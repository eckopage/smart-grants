import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CompanyDocument = HydratedDocument<Company>;

export enum CompanyPlanKey {
  BASIC_LISTING = 'basic_listing',
  FEATURED = 'featured',
  PREMIUM_LEADS = 'premium_leads',
}

export const COMPANY_PLAN_RANK: Record<CompanyPlanKey, number> = {
  [CompanyPlanKey.PREMIUM_LEADS]: 3,
  [CompanyPlanKey.FEATURED]: 2,
  [CompanyPlanKey.BASIC_LISTING]: 1,
};

@Schema({ timestamps: true })
export class Company {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop()
  nip?: string;

  @Prop()
  logoUrl?: string;

  @Prop()
  description?: string;

  @Prop({ type: [String], default: [] })
  servicesOffered: string[];

  @Prop({ type: [String], default: [] })
  voivodeshipsServed: string[];

  @Prop({ type: [String], default: [], index: true })
  specializations: string[];

  @Prop({
    type: String,
    enum: CompanyPlanKey,
    default: CompanyPlanKey.BASIC_LISTING,
  })
  subscriptionPlan: CompanyPlanKey;

  @Prop({ required: true })
  contactEmail: string;

  @Prop()
  contactPhone?: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ type: [Types.ObjectId], ref: 'Application', default: [] })
  applications: Types.ObjectId[];
}

export const CompanySchema = SchemaFactory.createForClass(Company);
