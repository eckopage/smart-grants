import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../users/schemas/user.schema';

const REGISTERABLE_ROLES = [UserRole.ENTREPRENEUR, UserRole.COMPANY] as const;

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsIn(REGISTERABLE_ROLES)
  @IsOptional()
  role?: UserRole;

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  nip?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
