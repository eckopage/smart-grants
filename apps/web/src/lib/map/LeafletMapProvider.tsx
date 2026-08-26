import L, { type Layer, type LeafletMouseEvent, type StyleFunction } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useEffect, useState } from 'react';
import { GeoJSON, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import type { Feature, FeatureCollection } from 'geojson';
import { VOIVODESHIP_NAME_TO_SLUG } from './voivodeship-names';
import type { MapProviderProps } from './types';

// Vite bundles leaflet's default marker icon URLs incorrectly unless set explicitly.
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const POLAND_CENTER: [number, number] = [52.05, 19.3];
const DEFAULT_ZOOM = 6;

function formatAmount(value: number): string {
  return new Intl.NumberFormat('pl-PL').format(value);
}

export function LeafletMapProvider({
  pointGrants,
  regionHighlights,
  highlightWholeCountry,
  onMarkerClick,
  onRegionClick,
}: MapProviderProps) {
  const [boundaries, setBoundaries] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/geo/wojewodztwa.geojson')
      .then((res) => res.json() as Promise<FeatureCollection>)
      .then((data) => {
        if (!cancelled) setBoundaries(data);
      })
      .catch(() => {
        if (!cancelled) setBoundaries(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const highlightBySlug = new Map(
    regionHighlights.map((h) => [h.voivodeship, h.count]),
  );

  const style: StyleFunction = (feature?: Feature) => {
    const name = (feature?.properties as { nazwa?: string } | undefined)?.nazwa;
    const slug = name ? VOIVODESHIP_NAME_TO_SLUG[name] : undefined;
    const count = slug ? highlightBySlug.get(slug) : undefined;
    const isHighlighted = !!count || highlightWholeCountry;

    return {
      color: '#475569',
      weight: 1,
      fillColor: count ? '#4f46e5' : '#94a3b8',
      fillOpacity: isHighlighted ? (count ? 0.5 : 0.15) : 0.03,
    };
  };

  function onEachFeature(feature: Feature, layer: Layer) {
    const name = (feature.properties as { nazwa?: string } | undefined)?.nazwa;
    const slug = name ? VOIVODESHIP_NAME_TO_SLUG[name] : undefined;
    const count = slug ? highlightBySlug.get(slug) : undefined;

    if (name) {
      layer.bindTooltip(
        count ? `${name} (${count})` : name,
        { sticky: true },
      );
    }
    if (slug) {
      layer.on('click', (_e: LeafletMouseEvent) => onRegionClick(slug));
    }
  }

  return (
    <MapContainer
      center={POLAND_CENTER}
      zoom={DEFAULT_ZOOM}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {boundaries && (
        <GeoJSON
          data={boundaries}
          style={style}
          onEachFeature={onEachFeature}
        />
      )}
      {pointGrants.map((grant) =>
        grant.location ? (
          <Marker
            key={grant._id}
            position={[grant.location.lat, grant.location.lng]}
            eventHandlers={{ click: () => onMarkerClick(grant) }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{grant.title}</p>
                {grant.fundingRange && (
                  <p>
                    {formatAmount(grant.fundingRange.min)} –{' '}
                    {formatAmount(grant.fundingRange.max)} zł
                  </p>
                )}
                {grant.timeline.submissionClosesAt && (
                  <p>
                    Termin:{' '}
                    {new Date(grant.timeline.submissionClosesAt).toLocaleDateString(
                      'pl-PL',
                    )}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => onMarkerClick(grant)}
                  className="mt-1 text-slate-900 underline"
                >
                  Zobacz szczegóły
                </button>
              </div>
            </Popup>
          </Marker>
        ) : null,
      )}
    </MapContainer>
  );
}
