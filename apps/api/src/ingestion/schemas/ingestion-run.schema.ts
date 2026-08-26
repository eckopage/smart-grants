import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type IngestionRunDocument = HydratedDocument<IngestionRun>;

@Schema({ _id: false })
export class SourceRunResult {
  @Prop({ required: true })
  source: string;

  @Prop({ default: 0 })
  found: number;

  @Prop({ default: 0 })
  created: number;

  @Prop({ default: 0 })
  updated: number;

  @Prop()
  error?: string;
}
const SourceRunResultSchema = SchemaFactory.createForClass(SourceRunResult);

@Schema({ timestamps: true })
export class IngestionRun {
  @Prop({ required: true })
  startedAt: Date;

  @Prop()
  finishedAt?: Date;

  @Prop({ type: [SourceRunResultSchema], default: [] })
  results: SourceRunResult[];
}

export const IngestionRunSchema = SchemaFactory.createForClass(IngestionRun);
