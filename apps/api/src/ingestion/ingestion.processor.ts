import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { IngestionService } from './ingestion.service';

export const INGESTION_QUEUE = 'ingestion';
export const SYNC_ALL_JOB = 'sync-all';

@Processor(INGESTION_QUEUE)
export class IngestionProcessor extends WorkerHost {
  private readonly logger = new Logger(IngestionProcessor.name);

  constructor(private readonly ingestionService: IngestionService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== SYNC_ALL_JOB) return;
    this.logger.log('Running scheduled grant ingestion sync…');
    const run = await this.ingestionService.syncAll();
    this.logger.log(
      `Ingestion run finished: ${JSON.stringify(run.results.map((r) => ({ source: r.source, found: r.found, created: r.created, updated: r.updated, error: r.error })))}`,
    );
  }
}
