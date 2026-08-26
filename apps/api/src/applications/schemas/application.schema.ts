import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ApplicationDocument = HydratedDocument<Application>;

export enum ApplicationStatus {
  INTENT = 'intent',
  MATCHED = 'matched',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export enum TimelineItemAssignee {
  USER = 'user',
  COMPANY = 'company',
}

export enum TimelineItemStatus {
  PENDING = 'pending',
  DONE = 'done',
  OVERDUE = 'overdue',
}

@Schema({ _id: true, timestamps: false })
export class TimelineItem {
  @Prop({ required: true })
  title: string;

  @Prop()
  dueDate?: Date;

  @Prop({ type: String, enum: TimelineItemAssignee, required: true })
  assignedTo: TimelineItemAssignee;

  @Prop({
    type: String,
    enum: TimelineItemStatus,
    default: TimelineItemStatus.PENDING,
  })
  status: TimelineItemStatus;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}
const TimelineItemSchema = SchemaFactory.createForClass(TimelineItem);

@Schema({ _id: true, timestamps: false })
export class ApplicationDocumentItem {
  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  fileUrl: string;

  @Prop({ required: true })
  category: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploadedBy: Types.ObjectId;

  @Prop({ default: () => new Date() })
  uploadedAt: Date;

  @Prop({ default: 1 })
  version: number;
}
const ApplicationDocumentSchema = SchemaFactory.createForClass(
  ApplicationDocumentItem,
);

@Schema({ _id: true, timestamps: false })
export class ApplicationMessage {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ type: String, enum: TimelineItemAssignee, required: true })
  senderRole: TimelineItemAssignee;

  @Prop({ required: true })
  content: string;

  @Prop()
  attachmentUrl?: string;

  @Prop({ default: () => new Date() })
  createdAt: Date;

  @Prop({ type: Date, default: null })
  readAt: Date | null;
}
const ApplicationMessageSchema =
  SchemaFactory.createForClass(ApplicationMessage);

@Schema({ timestamps: true })
export class Application {
  @Prop({ type: Types.ObjectId, ref: 'Grant', required: true, index: true })
  grantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', default: null })
  companyId: Types.ObjectId | null;

  @Prop({
    type: String,
    enum: ApplicationStatus,
    default: ApplicationStatus.INTENT,
  })
  status: ApplicationStatus;

  @Prop({ type: [TimelineItemSchema], default: [] })
  timeline: TimelineItem[];

  @Prop({ type: [ApplicationDocumentSchema], default: [] })
  documents: ApplicationDocumentItem[];

  @Prop({ type: [ApplicationMessageSchema], default: [] })
  messages: ApplicationMessage[];
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);
