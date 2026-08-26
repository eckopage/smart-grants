import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { GrantSource, RawGrant } from '../grant-source.interface';
import {
  GrantSource as GrantSourceEnum,
  GrantType,
} from '../../grants/constants';

/**
 * EU Funding & Tenders Portal (SEDIA) search API — public, no API key
 * required for read access to open call listings.
 *
 * The exact request/response schema of this endpoint is not something we
 * can verify from inside this sandbox (no outbound access to it here), so
 * this adapter is written defensively: any shape mismatch is logged and
 * yields an empty result for this run rather than throwing, per the "log
 * errors per source" requirement. Before relying on this in production,
 * verify the request body and `results[]` field names against the current
 * portal docs (https://ec.europa.eu/info/funding-tenders/opportunities/portal)
 * and adjust `mapResult` accordingly.
 */
@Injectable()
export class EuFundingSource implements GrantSource {
  readonly name = 'eu_funding_tenders_portal';
  private readonly logger = new Logger(EuFundingSource.name);
  private readonly searchUrl =
    'https://api.tech.ec.europa.eu/search-api/prod/rest/search?apiKey=SEDIA&text=***&pageSize=50&pageNumber=1';

  async fetchGrants(): Promise<RawGrant[]> {
    try {
      const response = await axios.post<{ results?: unknown[] }>(
        this.searchUrl,
        {
          query: {
            bool: {
              must: [{ term: { type: 'call_for_proposal' } }],
            },
          },
        },
        { timeout: 15000 },
      );

      const results = Array.isArray(response.data.results)
        ? response.data.results
        : [];
      return results
        .map((item) => this.mapResult(item))
        .filter((item): item is RawGrant => item !== null);
    } catch (err) {
      this.logger.error(
        `Failed to fetch grants from ${this.name}: ${String(err)}`,
      );
      return [];
    }
  }

  private mapResult(item: unknown): RawGrant | null {
    if (typeof item !== 'object' || item === null) return null;
    const record = item as Record<string, unknown>;

    const id = record.reference ?? record.identifier ?? record.id;
    const title = record.title;
    if (typeof id !== 'string' || typeof title !== 'string') {
      return null;
    }

    return {
      sourceSystem: this.name,
      externalId: id,
      title,
      description:
        typeof record.description === 'string' ? record.description : title,
      type: GrantType.GRANT,
      source: GrantSourceEnum.EU_CENTRAL,
      programme: typeof record.programme === 'string' ? record.programme : 'EU',
      institution: 'Komisja Europejska',
      sourceUrl: typeof record.url === 'string' ? record.url : undefined,
      timeline: {
        submissionClosesAt:
          typeof record.deadlineDate === 'string'
            ? new Date(record.deadlineDate)
            : undefined,
      },
    };
  }
}
