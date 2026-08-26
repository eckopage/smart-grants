import { IsString } from 'class-validator';

export class RequestUploadUrlDto {
  @IsString()
  fileName: string;

  @IsString()
  contentType: string;

  @IsString()
  category: string;
}
