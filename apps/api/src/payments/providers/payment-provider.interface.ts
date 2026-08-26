export interface CreateOrderInput {
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  buyerEmail: string;
  continueUrl: string;
  notifyUrl: string;
}

export interface CreateOrderResult {
  externalOrderId: string;
  redirectUrl: string;
}

export type WebhookOrderStatus = 'completed' | 'cancelled' | 'pending';

export interface WebhookEvent {
  externalOrderId: string;
  status: WebhookOrderStatus;
}

/**
 * Abstraction over the payment gateway. Business logic (PaymentsService)
 * depends only on this contract, so adding Stripe later (e.g. for
 * international markets) means implementing this interface, not touching
 * checkout/webhook business logic.
 */
export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');

export interface PaymentProvider {
  createOrder(input: CreateOrderInput): Promise<CreateOrderResult>;
  verifyWebhookSignature(
    rawBody: string,
    signatureHeader: string | undefined,
  ): boolean;
  parseWebhookEvent(rawBody: string): WebhookEvent;
}
