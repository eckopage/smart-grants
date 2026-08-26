import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PlanDocument } from '../plans/schemas/plan.schema';
import { PlansService } from '../plans/plans.service';
import {
  BillingPeriod,
  Subscription,
  SubscriptionDocument,
  SubscriptionStatus,
} from './schemas/subscription.schema';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
    private readonly plansService: PlansService,
  ) {}

  async getActivePlanForUser(userId: string): Promise<PlanDocument | null> {
    const subscription = await this.findActiveForUser(userId);
    if (!subscription) {
      return null;
    }
    return this.plansService.findByKey(subscription.planKey);
  }

  findActiveForUser(userId: string): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel
      .findOne({
        userId: new Types.ObjectId(userId),
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: { $gt: new Date() },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  createPending(
    userId: string,
    plan: PlanDocument,
    billingPeriod: BillingPeriod,
  ): Promise<SubscriptionDocument> {
    return new this.subscriptionModel({
      userId: new Types.ObjectId(userId),
      planId: plan._id,
      planKey: plan.key,
      billingPeriod,
      status: SubscriptionStatus.PENDING,
    }).save();
  }

  async activateByPayuOrderId(
    payuOrderId: string,
  ): Promise<SubscriptionDocument | null> {
    const subscription = await this.subscriptionModel
      .findOne({ payuOrderId })
      .exec();
    if (!subscription) {
      return null;
    }
    const periodStart = new Date();
    const periodEnd = new Date(periodStart);
    if (subscription.billingPeriod === BillingPeriod.YEARLY) {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }
    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.currentPeriodStart = periodStart;
    subscription.currentPeriodEnd = periodEnd;
    return subscription.save();
  }

  async markFailedByPayuOrderId(payuOrderId: string): Promise<void> {
    await this.subscriptionModel
      .findOneAndUpdate(
        { payuOrderId },
        { status: SubscriptionStatus.CANCELLED },
      )
      .exec();
  }

  async attachPayuOrderId(
    subscriptionId: string,
    payuOrderId: string,
  ): Promise<void> {
    await this.subscriptionModel
      .findByIdAndUpdate(subscriptionId, { payuOrderId })
      .exec();
  }

  findAllActive(): Promise<SubscriptionDocument[]> {
    return this.subscriptionModel
      .find({ status: SubscriptionStatus.ACTIVE })
      .populate('userId', 'email role')
      .populate('planId', 'key name priceMonthly priceYearly currency')
      .sort({ createdAt: -1 })
      .exec();
  }
}
