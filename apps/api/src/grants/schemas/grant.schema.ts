import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { GrantSource, GrantTimelineStatus, GrantType } from '../constants';

export type GrantDocument = HydratedDocument<Grant>;

@Schema({ _id: false })
export class FundingRange {
  @Prop({ required: true, min: 0 })
  min: number;

  @Prop({ required: true, min: 0 })
  max: number;
}
const FundingRangeSchema = SchemaFactory.createForClass(FundingRange);

@Schema({ _id: false })
export class GrantTimeline {
  @Prop()
  announcedAt?: Date;

  @Prop()
  submissionOpensAt?: Date;

  @Prop()
  submissionClosesAt?: Date;

  @Prop()
  resultsAt?: Date;

  @Prop({
    type: String,
    enum: GrantTimelineStatus,
    default: GrantTimelineStatus.UPCOMING,
  })
  status: GrantTimelineStatus;
}
const GrantTimelineSchema = SchemaFactory.createForClass(GrantTimeline);

@Schema({ _id: false })
export class GeoLocation {
  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  lng: number;
}
const GeoLocationSchema = SchemaFactory.createForClass(GeoLocation);

@Schema({ timestamps: true })
export class Grant {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  shortSummary?: string;

  @Prop({ type: String, enum: GrantType, required: true })
  type: GrantType;

  @Prop({ type: String, enum: GrantSource, required: true })
  source: GrantSource;

  @Prop({ required: true })
  programme: string;

  @Prop({ required: true })
  institution: string;

  @Prop({ type: [String], default: [] })
  voivodeships: string[];

  @Prop({ type: [String], default: [], index: true })
  category: string[];

  @Prop({ type: [String], default: [], index: true })
  tags: string[];

  @Prop()
  budgetTotal?: number;

  @Prop({ type: FundingRangeSchema })
  fundingRange?: FundingRange;

  @Prop({ type: [String], default: [] })
  eligibleCosts: string[];

  @Prop()
  supportForm?: string;

  @Prop()
  cofinancingRate?: string;

  @Prop({ type: GrantTimelineSchema, default: () => ({}) })
  timeline: GrantTimeline;

  @Prop()
  eligibility?: string;

  @Prop({ type: [String], default: [] })
  requiredDocuments: string[];

  @Prop()
  sourceUrl?: string;

  @Prop()
  sourceSystem?: string;

  /** Stable identifier from the source system, used for dedup/diffing by scrapers. */
  @Prop()
  externalId?: string;

  @Prop()
  lastScrapedAt?: Date;

  @Prop({ type: [Types.ObjectId], ref: 'Company', default: [] })
  contactPartners: Types.ObjectId[];

  @Prop({ type: GeoLocationSchema, default: null })
  location?: GeoLocation | null;
}

export const GrantSchema = SchemaFactory.createForClass(Grant);
GrantSchema.index({ title: 'text', description: 'text' });
GrantSchema.index(
  { sourceSystem: 1, externalId: 1 },
  { unique: true, sparse: true },
);
