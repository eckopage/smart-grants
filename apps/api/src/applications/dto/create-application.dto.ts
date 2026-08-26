import { IsMongoId } from 'class-validator';

export class CreateApplicationDto {
  @IsMongoId()
  grantId: string;
}
