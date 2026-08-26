import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsIn(['development', 'test', 'staging', 'production'])
  @IsOptional()
  NODE_ENV: string = 'development';

  @IsNumber()
  @Min(0)
  @Max(65535)
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  API_URL: string = 'http://localhost:3000';

  @IsString()
  WEB_URL: string = 'http://localhost:5173';

  @IsString()
  MONGODB_URI: string;

  @IsString()
  @IsOptional()
  REDIS_URL?: string;

  @IsString()
  JWT_ACCESS_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_ACCESS_EXPIRES_IN: string = '15m';

  @IsString()
  JWT_REFRESH_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN: string = '7d';

  @IsString()
  @IsOptional()
  PAYU_API_URL: string = 'https://secure.snd.payu.com';

  @IsString()
  @IsOptional()
  PAYU_CLIENT_ID?: string;

  @IsString()
  @IsOptional()
  PAYU_CLIENT_SECRET?: string;

  @IsString()
  @IsOptional()
  PAYU_POS_ID?: string;

  @IsString()
  @IsOptional()
  PAYU_SECOND_KEY?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n${errors
        .map((error) => Object.values(error.constraints ?? {}).join(', '))
        .join('\n')}`,
    );
  }

  return validatedConfig;
}
