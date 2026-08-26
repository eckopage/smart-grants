import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { PlanAudience } from '../schemas/plan.schema';

class PlanLimitsDto {
  @IsInt()
  @Min(0)
  @IsOptional()
  maxFavorites?: number | null;

  @IsInt()
  @Min(0)
  @IsOptional()
  leadContactsPerMonth?: number | null;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxTeamAccounts?: number;

  @IsBoolean()
  @IsOptional()
  exportData?: boolean;

  @IsBoolean()
  @IsOptional()
  apiAccess?: boolean;
}

export class CreatePlanDto {
  @IsString()
  key: string;

  @IsEnum(PlanAudience)
  audience: PlanAudience;

  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  priceMonthly: number;

  @IsNumber()
  @Min(0)
  priceYearly: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @ValidateNested()
  @Type(() => PlanLimitsDto)
  @IsOptional()
  limits?: PlanLimitsDto;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
