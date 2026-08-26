import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { GrantTimelineStatus } from '../constants';
import { CreateGrantDto } from './create-grant.dto';

export class UpdateGrantDto extends PartialType(CreateGrantDto) {
  @IsEnum(GrantTimelineStatus)
  @IsOptional()
  timelineStatus?: GrantTimelineStatus;
}
