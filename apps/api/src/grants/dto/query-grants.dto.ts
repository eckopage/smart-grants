import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  GRANT_CATEGORIES,
  GrantSource,
  GrantTimelineStatus,
  GrantType,
  VOIVODESHIPS,
} from '../constants';

function toArray(value: unknown): unknown[] | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? (value as unknown[]) : [value];
}

export class QueryGrantsDto {
  @IsString()
  @IsOptional()
  search?: string;

  @Transform(({ value }: TransformFnParams) => toArray(value))
  @IsArray()
  @IsIn(VOIVODESHIPS, { each: true })
  @IsOptional()
  voivodeships?: string[];

  @Transform(({ value }: TransformFnParams) => toArray(value))
  @IsArray()
  @IsIn(GRANT_CATEGORIES, { each: true })
  @IsOptional()
  category?: string[];

  @Transform(({ value }: TransformFnParams) => toArray(value))
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsEnum(GrantType)
  @IsOptional()
  type?: GrantType;

  @IsEnum(GrantSource)
  @IsOptional()
  source?: GrantSource;

  @IsEnum(GrantTimelineStatus)
  @IsOptional()
  status?: GrantTimelineStatus;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minFunding?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxFunding?: number;

  @IsString()
  @IsOptional()
  submissionClosesBefore?: string;

  @IsString()
  @IsOptional()
  submissionClosesAfter?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;
}
