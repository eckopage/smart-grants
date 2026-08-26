import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlansModule } from '../plans/plans.module';
import { ActiveSubscriptionGuard } from './guards/active-subscription.guard';
import {
  Subscription,
  SubscriptionSchema,
} from './schemas/subscription.schema';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
    PlansModule,
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, ActiveSubscriptionGuard],
  exports: [SubscriptionsService, ActiveSubscriptionGuard],
})
export class SubscriptionsModule {}
