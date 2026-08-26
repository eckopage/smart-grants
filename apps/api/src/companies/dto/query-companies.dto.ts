import { Transform } from 'class-transformer';
import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import { GRANT_CATEGORIES, VOIVODESHIPS } from '../../grants/constants';

function toArray(value: unknown): unknown[] | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? (value as unknown[]) : [value];
}

export class QueryCompaniesDto {
  @Transform(({ value }: { value: unknown }) => toArray(value))
  @IsArray()
  @IsIn(VOIVODESHIPS, { each: true })
  @IsOptional()
  voivodeship?: string[];

  @Transform(({ value }: { value: unknown }) => toArray(value))
  @IsArray()
  @IsIn(GRANT_CATEGORIES, { each: true })
  @IsOptional()
  specialization?: string[];

  @IsString()
  @IsOptional()
  search?: string;
}
