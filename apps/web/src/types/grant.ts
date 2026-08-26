export type GrantType = 'grant' | 'loan' | 'guarantee' | 'other';
export type GrantSource = 'eu_central' | 'national' | 'regional';
export type GrantTimelineStatus = 'upcoming' | 'open' | 'closed' | 'settled';

export interface GrantTimeline {
  announcedAt?: string;
  submissionOpensAt?: string;
  submissionClosesAt?: string;
  resultsAt?: string;
  status: GrantTimelineStatus;
}

export interface FundingRange {
  min: number;
  max: number;
}

export interface Grant {
  _id: string;
  title: string;
  slug: string;
  description: string;
  shortSummary?: string;
  type: GrantType;
  source: GrantSource;
  programme: string;
  institution: string;
  voivodeships: string[];
  category: string[];
  tags: string[];
  budgetTotal?: number;
  fundingRange?: FundingRange;
  eligibleCosts: string[];
  supportForm?: string;
  cofinancingRate?: string;
  timeline: GrantTimeline;
  eligibility?: string;
  requiredDocuments: string[];
  sourceUrl?: string;
  location?: { lat: number; lng: number } | null;
}

export interface PaginatedGrants {
  items: Grant[];
  total: number;
  page: number;
  limit: number;
}

export interface GrantFilters {
  search?: string;
  voivodeships?: string[];
  category?: string[];
  tags?: string[];
  type?: GrantType;
  status?: GrantTimelineStatus;
  page?: number;
  limit?: number;
}

export const VOIVODESHIPS = [
  'dolnoslaskie',
  'kujawsko-pomorskie',
  'lubelskie',
  'lubuskie',
  'lodzkie',
  'malopolskie',
  'mazowieckie',
  'opolskie',
  'podkarpackie',
  'podlaskie',
  'pomorskie',
  'slaskie',
  'swietokrzyskie',
  'warminsko-mazurskie',
  'wielkopolskie',
  'zachodniopomorskie',
] as const;

export const GRANT_CATEGORIES = [
  'cyfryzacja',
  'oze',
  'eksport',
  'badania-i-rozwoj',
  'inwestycje',
  'szkolenia',
  'termomodernizacja',
  'startupy',
  'innowacje',
  'internacjonalizacja',
] as const;
