import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompaniesModule } from '../companies/companies.module';
import { GrantsModule } from '../grants/grants.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { Application, ApplicationSchema } from './schemas/application.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Application.name, schema: ApplicationSchema },
    ]),
    GrantsModule,
    CompaniesModule,
    SubscriptionsModule,
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
})
export class ApplicationsModule {}
