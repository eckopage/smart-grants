import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PlansService } from '../plans/plans.service';
import { BillingPeriod } from '../subscriptions/schemas/subscription.schema';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CheckoutDto } from './dto/checkout.dto';
import { PAYMENT_PROVIDER } from './providers/payment-provider.interface';
import type { PaymentProvider } from './providers/payment-provider.interface';
import {
  Payment,
  PaymentDocument,
  PaymentStatus,
} from './schemas/payment.schema';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @Inject(PAYMENT_PROVIDER) private readonly paymentProvider: PaymentProvider,
    private readonly plansService: PlansService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly configService: ConfigService,
  ) {}

  async checkout(
    userId: string,
    userEmail: string,
    dto: CheckoutDto,
  ): Promise<{ redirectUrl: string }> {
    const plan = await this.plansService.findByKey(dto.planKey);
    const amount =
      dto.billingPeriod === BillingPeriod.YEARLY
        ? plan.priceYearly
        : plan.priceMonthly;

    const subscription = await this.subscriptionsService.createPending(
      userId,
      plan,
      dto.billingPeriod,
    );

    const webUrl =
      this.configService.get<string>('WEB_URL') ?? 'http://localhost:5173';
    const apiUrl =
      this.configService.get<string>('API_URL') ?? 'http://localhost:3000';

    const order = await this.paymentProvider.createOrder({
      orderId: subscription._id.toString(),
      amount,
      currency: plan.currency,
      description: `Subskrypcja Smart Grants — plan ${plan.name}`,
      buyerEmail: userEmail,
      continueUrl: `${webUrl}/dashboard`,
      notifyUrl: `${apiUrl}/payments/webhook`,
    });

    await this.subscriptionsService.attachPayuOrderId(
      subscription._id.toString(),
      order.externalOrderId,
    );

    await new this.paymentModel({
      userId: subscription.userId,
      subscriptionId: subscription._id,
      payuOrderId: order.externalOrderId,
      amount,
      currency: plan.currency,
      status: PaymentStatus.PENDING,
    }).save();

    return { redirectUrl: order.redirectUrl };
  }

  async handleWebhook(
    rawBody: string,
    signatureHeader: string | undefined,
  ): Promise<void> {
    if (
      !this.paymentProvider.verifyWebhookSignature(rawBody, signatureHeader)
    ) {
      throw new Error('Nieprawidłowy podpis webhooka płatności');
    }

    const event = this.paymentProvider.parseWebhookEvent(rawBody);

    if (event.status === 'completed') {
      await this.paymentModel
        .findOneAndUpdate(
          { payuOrderId: event.externalOrderId },
          { status: PaymentStatus.COMPLETED },
        )
        .exec();
      await this.subscriptionsService.activateByPayuOrderId(
        event.externalOrderId,
      );
    } else if (event.status === 'cancelled') {
      await this.paymentModel
        .findOneAndUpdate(
          { payuOrderId: event.externalOrderId },
          { status: PaymentStatus.FAILED },
        )
        .exec();
      await this.subscriptionsService.markFailedByPayuOrderId(
        event.externalOrderId,
      );
    }
  }
}
