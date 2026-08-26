import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { createHash } from 'node:crypto';
import { PayuPaymentProvider } from './payu-payment.provider';

describe('PayuPaymentProvider', () => {
  let provider: PayuPaymentProvider;
  const secondKey = 'test-second-key';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayuPaymentProvider,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => ({ PAYU_SECOND_KEY: secondKey })[key],
          },
        },
      ],
    }).compile();

    provider = module.get<PayuPaymentProvider>(PayuPaymentProvider);
  });

  describe('verifyWebhookSignature', () => {
    it('returns false when the signature header is missing', () => {
      expect(provider.verifyWebhookSignature('{}', undefined)).toBe(false);
    });

    it('returns false for a non-MD5 algorithm', () => {
      const body = '{"order":{"orderId":"1"}}';
      const hash = createHash('md5')
        .update(body + secondKey)
        .digest('hex');
      expect(
        provider.verifyWebhookSignature(
          body,
          `signature=${hash};algorithm=SHA256;sender=checkout`,
        ),
      ).toBe(false);
    });

    it('returns false when the signature does not match', () => {
      const body = '{"order":{"orderId":"1"}}';
      expect(
        provider.verifyWebhookSignature(
          body,
          'signature=deadbeef;algorithm=MD5;sender=checkout',
        ),
      ).toBe(false);
    });

    it('returns true for a correctly signed body', () => {
      const body = '{"order":{"orderId":"1"}}';
      const hash = createHash('md5')
        .update(body + secondKey)
        .digest('hex');
      expect(
        provider.verifyWebhookSignature(
          body,
          `signature=${hash};algorithm=MD5;sender=checkout`,
        ),
      ).toBe(true);
    });
  });

  describe('parseWebhookEvent', () => {
    it('maps COMPLETED to "completed"', () => {
      const event = provider.parseWebhookEvent(
        JSON.stringify({ order: { orderId: 'abc', status: 'COMPLETED' } }),
      );
      expect(event).toEqual({ externalOrderId: 'abc', status: 'completed' });
    });

    it('maps CANCELED to "cancelled"', () => {
      const event = provider.parseWebhookEvent(
        JSON.stringify({ order: { orderId: 'abc', status: 'CANCELED' } }),
      );
      expect(event.status).toBe('cancelled');
    });

    it('maps unknown statuses to "pending"', () => {
      const event = provider.parseWebhookEvent(
        JSON.stringify({
          order: { orderId: 'abc', status: 'WAITING_FOR_CONFIRMATION' },
        }),
      );
      expect(event.status).toBe('pending');
    });
  });
});
