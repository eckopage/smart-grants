import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { INGESTION_QUEUE, SYNC_ALL_JOB } from './ingestion.processor';

@Injectable()
export class IngestionScheduler {
  constructor(@InjectQueue(INGESTION_QUEUE) private readonly queue: Queue) {}

  @Cron(CronExpression.EVERY_6_HOURS)
  async enqueueSync(): Promise<void> {
    await this.queue.add(SYNC_ALL_JOB, {});
  }
}
