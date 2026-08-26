import { Module } from '@nestjs/common';
import { GrantsModule } from '../grants/grants.module';
import { SeoController } from './seo.controller';

@Module({
  imports: [GrantsModule],
  controllers: [SeoController],
})
export class SeoModule {}
