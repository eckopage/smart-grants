import { UpsertExternalGrantInput } from '../grants/grants.service';

export type RawGrant = UpsertExternalGrantInput;

/**
 * One data source (an API or, cautiously, a scraper) that can be polled for
 * grant listings. Each adapter owns its own error handling — a failing
 * source must never take down a sync run for the others.
 */
export interface GrantSource {
  name: string;
  fetchGrants(): Promise<RawGrant[]>;
}

export const GRANT_SOURCES = Symbol('GRANT_SOURCES');
