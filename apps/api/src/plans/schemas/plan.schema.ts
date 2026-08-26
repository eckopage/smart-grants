import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PlanDocument = HydratedDocument<Plan>;

export enum PlanAudience {
  ENTREPRENEUR = 'entrepreneur',
  COMPANY = 'company',
}

@Schema({ _id: false })
export class PlanLimits {
  /** null = unlimited */
  @Prop({ type: Number, default: null })
  maxFavorites: number | null;

  @Prop({ type: Number, default: null })
  leadContactsPerMonth: number | null;

  @Prop({ type: Number, default: 1 })
  maxTeamAccounts: number;

  @Prop({ default: false })
  exportData: boolean;

  @Prop({ default: false })
  apiAccess: boolean;
}
const PlanLimitsSchema = SchemaFactory.createForClass(PlanLimits);

@Schema({ timestamps: true })
export class Plan {
  /** Stable machine key, e.g. "starter", "pro", "business" */
  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ type: String, enum: PlanAudience, required: true })
  audience: PlanAudience;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, min: 0 })
  priceMonthly: number;

  @Prop({ required: true, min: 0 })
  priceYearly: number;

  @Prop({ default: 'PLN' })
  currency: string;

  @Prop({ type: PlanLimitsSchema, default: () => ({}) })
  limits: PlanLimits;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  sortOrder: number;
}

export const PlanSchema = SchemaFactory.createForClass(Plan);
