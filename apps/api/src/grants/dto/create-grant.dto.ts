import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  GRANT_CATEGORIES,
  GrantSource,
  GrantType,
  VOIVODESHIPS,
} from '../constants';

class FundingRangeDto {
  @IsNumber()
  @Min(0)
  min: number;

  @IsNumber()
  @Min(0)
  max: number;
}

class GrantTimelineDto {
  @IsDateString()
  @IsOptional()
  announcedAt?: string;

  @IsDateString()
  @IsOptional()
  submissionOpensAt?: string;

  @IsDateString()
  @IsOptional()
  submissionClosesAt?: string;

  @IsDateString()
  @IsOptional()
  resultsAt?: string;
}

class GeoLocationDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

export class CreateGrantDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  shortSummary?: string;

  @IsEnum(GrantType)
  type: GrantType;

  @IsEnum(GrantSource)
  source: GrantSource;

  @IsString()
  programme: string;

  @IsString()
  institution: string;

  @IsArray()
  @IsIn(VOIVODESHIPS, { each: true })
  @IsOptional()
  voivodeships?: string[];

  @IsArray()
  @IsIn(GRANT_CATEGORIES, { each: true })
  @IsOptional()
  category?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsNumber()
  @Min(0)
  @IsOptional()
  budgetTotal?: number;

  @ValidateNested()
  @Type(() => FundingRangeDto)
  @IsOptional()
  fundingRange?: FundingRangeDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  eligibleCosts?: string[];

  @IsString()
  @IsOptional()
  supportForm?: string;

  @IsString()
  @IsOptional()
  cofinancingRate?: string;

  @ValidateNested()
  @Type(() => GrantTimelineDto)
  @IsOptional()
  timeline?: GrantTimelineDto;

  @IsString()
  @IsOptional()
  eligibility?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredDocuments?: string[];

  @IsString()
  @IsOptional()
  sourceUrl?: string;

  @IsString()
  @IsOptional()
  sourceSystem?: string;

  @ValidateNested()
  @Type(() => GeoLocationDto)
  @IsOptional()
  location?: GeoLocationDto;
}
