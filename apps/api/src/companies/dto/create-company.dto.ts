import { IsArray, IsEmail, IsIn, IsOptional, IsString } from 'class-validator';
import { GRANT_CATEGORIES, VOIVODESHIPS } from '../../grants/constants';

export class CreateCompanyDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  nip?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  servicesOffered?: string[];

  @IsArray()
  @IsIn(VOIVODESHIPS, { each: true })
  @IsOptional()
  voivodeshipsServed?: string[];

  @IsArray()
  @IsIn(GRANT_CATEGORIES, { each: true })
  @IsOptional()
  specializations?: string[];

  @IsEmail()
  contactEmail: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;
}
