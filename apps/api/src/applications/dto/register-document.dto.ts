import { IsString } from 'class-validator';

export class RegisterDocumentDto {
  @IsString()
  fileName: string;

  @IsString()
  key: string;

  @IsString()
  category: string;
}
