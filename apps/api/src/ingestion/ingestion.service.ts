import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GrantsService } from '../grants/grants.service';
import { GRANT_SOURCES, GrantSource } from './grant-source.interface';
import {
  IngestionRun,
  IngestionRunDocument,
} from './schemas/ingestion-run.schema';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    @Inject(GRANT_SOURCES) private readonly sources: GrantSource[],
    private readonly grantsService: GrantsService,
    @InjectModel(IngestionRun.name)
    private readonly ingestionRunModel: Model<IngestionRunDocument>,
  ) {}

  async syncAll(): Promise<IngestionRunDocument> {
    const run = new this.ingestionRunModel({
      startedAt: new Date(),
      results: [],
    });

    for (const source of this.sources) {
      const result = { source: source.name, found: 0, created: 0, updated: 0 };
      try {
        const rawGrants = await source.fetchGrants();
        result.found = rawGrants.length;

        for (const rawGrant of rawGrants) {
          const { wasCreated, wasUpdated } =
            await this.grantsService.upsertFromExternalSource(rawGrant);
          if (wasCreated) result.created += 1;
          if (wasUpdated) result.updated += 1;
        }
        run.results.push(result);
      } catch (err) {
        this.logger.error(`Source ${source.name} failed: ${String(err)}`);
        run.results.push({ ...result, error: String(err) });
      }
    }

    run.finishedAt = new Date();
    return run.save();
  }

  findRecentRuns(limit = 20): Promise<IngestionRunDocument[]> {
    return this.ingestionRunModel
      .find()
      .sort({ startedAt: -1 })
      .limit(limit)
      .exec();
  }
}
