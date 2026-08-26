import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import {
  TimelineItemAssignee,
  TimelineItemStatus,
} from '../schemas/application.schema';

export class CreateTimelineItemDto {
  @IsString()
  title: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsEnum(TimelineItemAssignee)
  assignedTo: TimelineItemAssignee;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateTimelineItemDto {
  @IsEnum(TimelineItemStatus)
  status: TimelineItemStatus;
}
