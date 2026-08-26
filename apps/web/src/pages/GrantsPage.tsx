import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GrantCard } from '../components/GrantCard';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { ActiveMapProvider, type RegionHighlight } from '../lib/map';
import { fetchGrants } from '../lib/grants-client';
import { GRANT_CATEGORIES, VOIVODESHIPS, type Grant } from '../types/grant';

type ViewMode = 'list' | 'map';

export function GrantsPage() {
  useDocumentMeta(
    'Dotacje i kredyty — mapa i lista naborów | Smart Grants',
    'Przeglądaj aktualne dotacje unijne, krajowe i kredyty preferencyjne na mapie Polski lub liście, z filtrowaniem wg województwa i kategorii.',
  );
  const navigate = useNavigate();
  const [view, setView] = useState<ViewMode>('map');
  const [search, setSearch] = useState('');
  const [voivodeship, setVoivodeship] = useState('');
  const [category, setCategory] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['grants', { search, voivodeship, category }],
    queryFn: () =>
      fetchGrants({
        search: search || undefined,
        voivodeships: voivodeship ? [voivodeship] : undefined,
        category: category ? [category] : undefined,
        limit: 100,
      }),
  });

  const items = data?.items ?? [];

  const { pointGrants, regionHighlights, highlightWholeCountry } = useMemo(() => {
    const grants = data?.items ?? [];
    const points: Grant[] = [];
    const counts = new Map<string, number>();
    let nationwide = 0;

    for (const grant of grants) {
      if (grant.location) {
        points.push(grant);
        continue;
      }
      if (grant.voivodeships.length === 0) {
        nationwide += 1;
        continue;
      }
      for (const v of grant.voivodeships) {
        counts.set(v, (counts.get(v) ?? 0) + 1);
      }
    }

    const highlights: RegionHighlight[] = Array.from(counts.entries()).map(
      ([voivodeship, count]) => ({ voivodeship, count }),
    );

    return {
      pointGrants: points,
      regionHighlights: highlights,
      highlightWholeCountry: nationwide > 0,
    };
  }, [data]);

  return (
    <main className="mx-auto flex h-[calc(100vh-57px)] max-w-6xl flex-col px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">
          Dotacje i kredyty
        </h1>
        <div className="flex overflow-hidden rounded border border-slate-300">
          <button
            type="button"
            onClick={() => setView('map')}
            className={`px-3 py-1 text-sm ${view === 'map' ? 'bg-slate-900 text-white' : 'text-slate-700'}`}
          >
            Mapa
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            className={`px-3 py-1 text-sm ${view === 'list' ? 'bg-slate-900 text-white' : 'text-slate-700'}`}
          >
            Lista
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Szukaj…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded border border-slate-300 px-3 py-2"
        />
        <select
          value={voivodeship}
          onChange={(e) => setVoivodeship(e.target.value)}
          className="rounded border border-slate-300 px-3 py-2"
        >
          <option value="">Wszystkie województwa</option>
          {VOIVODESHIPS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded border border-slate-300 px-3 py-2"
        >
          <option value="">Wszystkie kategorie</option>
          {GRANT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-slate-500">Ładowanie…</p>}
      {isError && <p className="text-red-600">Nie udało się pobrać dotacji.</p>}
      {data && items.length === 0 && (
        <p className="text-slate-500">Brak wyników dla wybranych filtrów.</p>
      )}

      {view === 'list' ? (
        <div className="flex flex-col gap-3 overflow-y-auto">
          {items.map((grant) => (
            <GrantCard key={grant._id} grant={grant} />
          ))}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-hidden rounded border border-slate-200">
          <ActiveMapProvider
            pointGrants={pointGrants}
            regionHighlights={regionHighlights}
            highlightWholeCountry={highlightWholeCountry}
            onMarkerClick={(grant) => void navigate(`/grants/${grant.slug}`)}
            onRegionClick={(v) => setVoivodeship(v)}
          />
        </div>
      )}
    </main>
  );
}
