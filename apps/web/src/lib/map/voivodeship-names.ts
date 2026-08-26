import { VOIVODESHIPS } from '../../types/grant';

/**
 * Maps our ASCII voivodeship slugs (used in the API/filters) to the Polish
 * diacritic names used as the "nazwa" property in the boundaries GeoJSON
 * (public/geo/wojewodztwa.geojson, source: ppatrzyk/polska-geojson).
 */
export const VOIVODESHIP_SLUG_TO_NAME: Record<string, string> = {
  dolnoslaskie: 'dolnośląskie',
  'kujawsko-pomorskie': 'kujawsko-pomorskie',
  lubelskie: 'lubelskie',
  lubuskie: 'lubuskie',
  lodzkie: 'łódzkie',
  malopolskie: 'małopolskie',
  mazowieckie: 'mazowieckie',
  opolskie: 'opolskie',
  podkarpackie: 'podkarpackie',
  podlaskie: 'podlaskie',
  pomorskie: 'pomorskie',
  slaskie: 'śląskie',
  swietokrzyskie: 'świętokrzyskie',
  'warminsko-mazurskie': 'warmińsko-mazurskie',
  wielkopolskie: 'wielkopolskie',
  zachodniopomorskie: 'zachodniopomorskie',
};

export const VOIVODESHIP_NAME_TO_SLUG: Record<string, string> = Object.fromEntries(
  VOIVODESHIPS.map((slug) => [VOIVODESHIP_SLUG_TO_NAME[slug], slug]),
);
