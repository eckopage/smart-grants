import type { ComponentType } from 'react';
import type { Grant } from '../../types/grant';

/**
 * Abstraction over the underlying map library. Business logic (GrantsMapPage)
 * only depends on this contract, never on Leaflet/Google Maps/Mapbox APIs
 * directly — swapping providers means implementing this interface and
 * changing one import in `./index.ts`, not rewriting business logic.
 */
export interface RegionHighlight {
  /** ASCII voivodeship slug, e.g. "mazowieckie" */
  voivodeship: string;
  /** Number of matching grants, used for highlight intensity/labels */
  count: number;
}

export interface MapProviderProps {
  /** Grants with a concrete location — rendered as point markers */
  pointGrants: Grant[];
  /** Region highlights for grants scoped to specific voivodeships */
  regionHighlights: RegionHighlight[];
  /** True when at least one visible grant is nationwide (no voivodeship) */
  highlightWholeCountry: boolean;
  onMarkerClick: (grant: Grant) => void;
  onRegionClick: (voivodeship: string) => void;
}

export type MapProviderComponent = ComponentType<MapProviderProps>;
