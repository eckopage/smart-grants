import { LeafletMapProvider } from './LeafletMapProvider';
import type { MapProviderComponent } from './types';

/**
 * Single swap point: to migrate away from Leaflet (e.g. to Google Maps or
 * Mapbox), implement `MapProviderComponent` and change this one export —
 * no business logic elsewhere needs to change.
 */
export const ActiveMapProvider: MapProviderComponent = LeafletMapProvider;

export type { MapProviderProps, RegionHighlight } from './types';
