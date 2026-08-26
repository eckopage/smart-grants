import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { PlansService } from '../plans/plans.service';
import { BillingPeriod } from '../subscriptions/schemas/subscription.schema';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PaymentsService } from './payments.service';
import { PAYMENT_PROVIDER } from './providers/payment-provider.interface';
import { Payment, PaymentStatus } from './schemas/payment.schema';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentProvider: {
    createOrder: jest.Mock;
    verifyWebhookSignature: jest.Mock;
    parseWebhookEvent: jest.Mock;
  };
  let plansService: { findByKey: jest.Mock };
  let subscriptionsService: {
    createPending: jest.Mock;
    attachPayuOrderId: jest.Mock;
    activateByPayuOrderId: jest.Mock;
    markFailedByPayuOrderId: jest.Mock;
  };
  let paymentModel: jest.Mock & { findOneAndUpdate: jest.Mock };

  const plan = {
    key: 'pro',
    name: 'Pro',
    priceMonthly: 99,
    priceYearly: 990,
    currency: 'PLN',
  };
  const subscription = {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(),
  };

  beforeEach(async () => {
    paymentProvider = {
      createOrder: jest.fn().mockResolvedValue({
        externalOrderId: 'payu-order-1',
        redirectUrl: 'https://secure.snd.payu.com/pay/1',
      }),
      verifyWebhookSignature: jest.fn().mockReturnValue(true),
      parseWebhookEvent: jest.fn(),
    };
    plansService = { findByKey: jest.fn().mockResolvedValue(plan) };
    subscriptionsService = {
      createPending: jest.fn().mockResolvedValue(subscription),
      attachPayuOrderId: jest.fn().mockResolvedValue(undefined),
      activateByPayuOrderId: jest.fn().mockResolvedValue(undefined),
      markFailedByPayuOrderId: jest.fn().mockResolvedValue(undefined),
    };

    const saveMock = jest.fn().mockResolvedValue(undefined);
    paymentModel = Object.assign(
      jest.fn().mockImplementation(() => ({ save: saveMock })),
      {
        findOneAndUpdate: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue(undefined) }),
      },
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getModelToken(Payment.name), useValue: paymentModel },
        { provide: PAYMENT_PROVIDER, useValue: paymentProvider },
        { provide: PlansService, useValue: plansService },
        { provide: SubscriptionsService, useValue: subscriptionsService },
        {
          provide: ConfigService,
          useValue: { get: () => undefined },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe('checkout', () => {
    it('creates a pending subscription and PayU order using the yearly price', async () => {
      const result = await service.checkout('user-id', 'user@example.com', {
        planKey: 'pro',
        billingPeriod: BillingPeriod.YEARLY,
      });

      expect(plansService.findByKey).toHaveBeenCalledWith('pro');
      expect(subscriptionsService.createPending).toHaveBeenCalledWith(
        'user-id',
        plan,
        BillingPeriod.YEARLY,
      );
      expect(paymentProvider.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 990, currency: 'PLN' }),
      );
      expect(subscriptionsService.attachPayuOrderId).toHaveBeenCalledWith(
        subscription._id.toString(),
        'payu-order-1',
      );
      expect(result).toEqual({
        redirectUrl: 'https://secure.snd.payu.com/pay/1',
      });
    });
  });

  describe('handleWebhook', () => {
    it('throws when the signature is invalid', async () => {
      paymentProvider.verifyWebhookSignature.mockReturnValue(false);
      await expect(
        service.handleWebhook('{}', 'bad-signature'),
      ).rejects.toThrow();
      expect(subscriptionsService.activateByPayuOrderId).not.toHaveBeenCalled();
    });

    it('activates the subscription on a completed event', async () => {
      paymentProvider.parseWebhookEvent.mockReturnValue({
        externalOrderId: 'payu-order-1',
        status: 'completed',
      });

      await service.handleWebhook('{}', 'valid-signature');

      expect(paymentModel.findOneAndUpdate).toHaveBeenCalledWith(
        { payuOrderId: 'payu-order-1' },
        { status: PaymentStatus.COMPLETED },
      );
      expect(subscriptionsService.activateByPayuOrderId).toHaveBeenCalledWith(
        'payu-order-1',
      );
    });

    it('marks the subscription failed on a cancelled event', async () => {
      paymentProvider.parseWebhookEvent.mockReturnValue({
        externalOrderId: 'payu-order-1',
        status: 'cancelled',
      });

      await service.handleWebhook('{}', 'valid-signature');

      expect(subscriptionsService.markFailedByPayuOrderId).toHaveBeenCalledWith(
        'payu-order-1',
      );
    });
  });
});
