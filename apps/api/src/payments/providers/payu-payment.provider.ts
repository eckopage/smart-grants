import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { createHash } from 'node:crypto';
import {
  CreateOrderInput,
  CreateOrderResult,
  PaymentProvider,
  WebhookEvent,
  WebhookOrderStatus,
} from './payment-provider.interface';

interface PayuOauthResponse {
  access_token: string;
  expires_in: number;
}

interface PayuCreateOrderResponse {
  orderId?: string;
  redirectUri?: string;
  status?: { statusCode?: string };
}

interface PayuWebhookPayload {
  order: {
    orderId: string;
    status: string;
  };
}

const PAYU_ORDER_STATUS_MAP: Record<string, WebhookOrderStatus> = {
  COMPLETED: 'completed',
  CANCELED: 'cancelled',
};

@Injectable()
export class PayuPaymentProvider implements PaymentProvider {
  private readonly logger = new Logger(PayuPaymentProvider.name);
  private cachedToken: { value: string; expiresAt: number } | null = null;

  constructor(private readonly configService: ConfigService) {}

  private get baseUrl(): string {
    return (
      this.configService.get<string>('PAYU_API_URL') ??
      'https://secure.snd.payu.com'
    );
  }

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now()) {
      return this.cachedToken.value;
    }

    const clientId = this.configService.get<string>('PAYU_CLIENT_ID');
    const clientSecret = this.configService.get<string>('PAYU_CLIENT_SECRET');

    const response = await axios.post<PayuOauthResponse>(
      `${this.baseUrl}/pl/standard/user/oauth/authorize`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId ?? '',
        client_secret: clientSecret ?? '',
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    this.cachedToken = {
      value: response.data.access_token,
      expiresAt: Date.now() + (response.data.expires_in - 60) * 1000,
    };
    return this.cachedToken.value;
  }

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    const token = await this.getAccessToken();
    const merchantPosId = this.configService.get<string>('PAYU_POS_ID');

    const response = await axios.post<PayuCreateOrderResponse>(
      `${this.baseUrl}/api/v2_1/orders`,
      {
        notifyUrl: input.notifyUrl,
        continueUrl: input.continueUrl,
        customerIp: '127.0.0.1',
        merchantPosId,
        description: input.description,
        currencyCode: input.currency,
        totalAmount: String(Math.round(input.amount * 100)),
        extOrderId: input.orderId,
        buyer: { email: input.buyerEmail },
        products: [
          {
            name: input.description,
            unitPrice: String(Math.round(input.amount * 100)),
            quantity: '1',
          },
        ],
      },
      {
        headers: { Authorization: `Bearer ${token}` },
        maxRedirects: 0,
        validateStatus: () => true,
      },
    );

    const { orderId, redirectUri } = response.data;
    if (!orderId || !redirectUri) {
      this.logger.error(
        `Unexpected PayU response: ${JSON.stringify(response.data)}`,
      );
      throw new Error(
        'PayU nie zwrócił poprawnej odpowiedzi dla nowego zamówienia',
      );
    }

    return { externalOrderId: orderId, redirectUrl: redirectUri };
  }

  verifyWebhookSignature(
    rawBody: string,
    signatureHeader: string | undefined,
  ): boolean {
    if (!signatureHeader) return false;
    const secondKey = this.configService.get<string>('PAYU_SECOND_KEY') ?? '';

    const signatureMatch = /signature=([a-f0-9]+)/i.exec(signatureHeader);
    const algorithmMatch = /algorithm=([A-Za-z0-9-]+)/i.exec(signatureHeader);
    if (!signatureMatch || algorithmMatch?.[1]?.toUpperCase() !== 'MD5') {
      return false;
    }

    const expected = createHash('md5')
      .update(rawBody + secondKey)
      .digest('hex');

    return expected === signatureMatch[1].toLowerCase();
  }

  parseWebhookEvent(rawBody: string): WebhookEvent {
    const payload = JSON.parse(rawBody) as PayuWebhookPayload;
    return {
      externalOrderId: payload.order.orderId,
      status: PAYU_ORDER_STATUS_MAP[payload.order.status] ?? 'pending',
    };
  }
}
