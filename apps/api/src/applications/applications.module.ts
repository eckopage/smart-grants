import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompaniesModule } from '../companies/companies.module';
import { GrantsModule } from '../grants/grants.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { UsersModule } from '../users/users.module';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { DeadlineReminderScheduler } from './deadline-reminder.scheduler';
import { Application, ApplicationSchema } from './schemas/application.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Application.name, schema: ApplicationSchema },
    ]),
    GrantsModule,
    CompaniesModule,
    SubscriptionsModule,
    UsersModule,
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, DeadlineReminderScheduler],
})
export class ApplicationsModule {}
