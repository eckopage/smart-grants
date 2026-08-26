import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApplicationsModule } from './applications/applications.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { GrantsModule } from './grants/grants.module';
import { HealthModule } from './health/health.module';
import { MailModule } from './mail/mail.module';
import { PaymentsModule } from './payments/payments.module';
import { PlansModule } from './plans/plans.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: ['.env'],
    }),
    DatabaseModule,
    MailModule,
    HealthModule,
    UsersModule,
    AuthModule,
    CompaniesModule,
    GrantsModule,
    PlansModule,
    SubscriptionsModule,
    PaymentsModule,
    ApplicationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
