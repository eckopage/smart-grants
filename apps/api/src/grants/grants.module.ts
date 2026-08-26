import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompaniesModule } from '../companies/companies.module';
import { AdminGrantsController } from './admin-grants.controller';
import { GrantsController } from './grants.controller';
import { GrantsService } from './grants.service';
import { Grant, GrantSchema } from './schemas/grant.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Grant.name, schema: GrantSchema }]),
    CompaniesModule,
  ],
  controllers: [GrantsController, AdminGrantsController],
  providers: [GrantsService],
  exports: [GrantsService],
})
export class GrantsModule {}
