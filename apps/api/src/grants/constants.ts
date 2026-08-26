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

export type Voivodeship = (typeof VOIVODESHIPS)[number];

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

export type GrantCategory = (typeof GRANT_CATEGORIES)[number];

export enum GrantType {
  GRANT = 'grant',
  LOAN = 'loan',
  GUARANTEE = 'guarantee',
  OTHER = 'other',
}

export enum GrantSource {
  EU_CENTRAL = 'eu_central',
  NATIONAL = 'national',
  REGIONAL = 'regional',
}

export enum GrantTimelineStatus {
  UPCOMING = 'upcoming',
  OPEN = 'open',
  CLOSED = 'closed',
  SETTLED = 'settled',
}
