import { Injectable } from '@nestjs/common';
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
 * The exact request/response schema of this endpoint has not been verified
 * against a live call (outbound access to ec.europa.eu is blocked from the
 * environment this adapter was written in). Errors and shape mismatches are
 * NOT swallowed here — they propagate to IngestionService.syncAll, which
 * records the real message on the run so it's visible in the admin panel.
 * If a run shows a real error for this source, use that message (rather
 * than guessing) to fix the request body / `results[]` field names against
 * the current portal docs
 * (https://ec.europa.eu/info/funding-tenders/opportunities/portal) and
 * adjust `mapResult` accordingly.
 */
@Injectable()
export class EuFundingSource implements GrantSource {
  readonly name = 'eu_funding_tenders_portal';
  private readonly searchUrl =
    'https://api.tech.ec.europa.eu/search-api/prod/rest/search?apiKey=SEDIA&text=***&pageSize=50&pageNumber=1';

  async fetchGrants(): Promise<RawGrant[]> {
    // Errors intentionally propagate rather than being swallowed here — the
    // caller (IngestionService.syncAll) already isolates a failing source
    // and records the real error message on the run, which surfaces it in
    // the admin panel instead of only the server log.
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
