import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GrantsModule } from '../grants/grants.module';
import { AdminIngestionController } from './admin-ingestion.controller';
import { GRANT_SOURCES, GrantSource } from './grant-source.interface';
import { IngestionProcessor, INGESTION_QUEUE } from './ingestion.processor';
import { IngestionScheduler } from './ingestion.scheduler';
import { IngestionService } from './ingestion.service';
import {
  IngestionRun,
  IngestionRunSchema,
} from './schemas/ingestion-run.schema';
import { DaneGovSource } from './sources/dane-gov.source';
import { EuFundingSource } from './sources/eu-funding.source';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: IngestionRun.name, schema: IngestionRunSchema },
    ]),
    BullModule.registerQueue({ name: INGESTION_QUEUE }),
    GrantsModule,
  ],
  controllers: [AdminIngestionController],
  providers: [
    IngestionService,
    IngestionProcessor,
    IngestionScheduler,
    EuFundingSource,
    DaneGovSource,
    {
      provide: GRANT_SOURCES,
      useFactory: (
        euFunding: EuFundingSource,
        daneGov: DaneGovSource,
      ): GrantSource[] => [euFunding, daneGov],
      inject: [EuFundingSource, DaneGovSource],
    },
  ],
})
export class IngestionModule {}
