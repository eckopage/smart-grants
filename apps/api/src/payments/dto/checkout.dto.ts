import { IsIn, IsString } from 'class-validator';
import { BillingPeriod } from '../../subscriptions/schemas/subscription.schema';

export class CheckoutDto {
  @IsString()
  planKey: string;

  @IsIn([BillingPeriod.MONTHLY, BillingPeriod.YEARLY])
  billingPeriod: BillingPeriod;
}
