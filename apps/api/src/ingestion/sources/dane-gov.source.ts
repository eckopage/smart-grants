import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { GrantSource, RawGrant } from '../grant-source.interface';
import {
  GrantSource as GrantSourceEnum,
  GrantType,
} from '../../grants/constants';

interface DaneGovResourceRow {
  [column: string]: string | number | undefined;
}

/**
 * dane.gov.pl (Polish open-data portal) REST API — stable, documented,
 * JSON:API-shaped (https://api.dane.gov.pl/1.4/).
 *
 * dane.gov.pl itself is a catalog of open datasets, not a grants database —
 * so this adapter does not guess which dataset to use. Point it at a
 * specific known resource (e.g. a ministry-published "wykaz naborów"
 * dataset) via DANE_GOV_PL_RESOURCE_ID; without it configured, this source
 * is a documented no-op rather than fabricating data. Once a resource is
 * chosen, the column-name mapping below should be adjusted to match it.
 */
@Injectable()
export class DaneGovSource implements GrantSource {
  readonly name = 'dane_gov_pl';
  private readonly logger = new Logger(DaneGovSource.name);

  constructor(private readonly configService: ConfigService) {}

  async fetchGrants(): Promise<RawGrant[]> {
    const resourceId = this.configService.get<string>(
      'DANE_GOV_PL_RESOURCE_ID',
    );
    if (!resourceId) {
      this.logger.log(
        `${this.name}: DANE_GOV_PL_RESOURCE_ID not configured — skipping (no-op).`,
      );
      return [];
    }

    try {
      const response = await axios.get<{ data?: DaneGovResourceRow[] }>(
        `https://api.dane.gov.pl/1.4/resources/${resourceId}/data`,
        { timeout: 15000 },
      );

      const rows = Array.isArray(response.data.data) ? response.data.data : [];
      return rows
        .map((row) => this.mapRow(row))
        .filter((item): item is RawGrant => item !== null);
    } catch (err) {
      this.logger.error(
        `Failed to fetch grants from ${this.name}: ${String(err)}`,
      );
      return [];
    }
  }

  private mapRow(row: DaneGovResourceRow): RawGrant | null {
    const id = row.id ?? row.nr_naboru;
    const title = row.nazwa ?? row.tytul;
    if (id === undefined || title === undefined) {
      return null;
    }

    return {
      sourceSystem: this.name,
      externalId: String(id),
      title: String(title),
      description: String(row.opis ?? title),
      type: GrantType.GRANT,
      source: GrantSourceEnum.NATIONAL,
      programme: String(row.program ?? 'nieznany'),
      institution: String(row.instytucja ?? 'nieznana'),
    };
  }
}
