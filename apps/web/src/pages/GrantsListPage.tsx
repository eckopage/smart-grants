import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { GrantCard } from '../components/GrantCard';
import { fetchGrants } from '../lib/grants-client';
import { GRANT_CATEGORIES, VOIVODESHIPS } from '../types/grant';

export function GrantsListPage() {
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
      }),
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">
        Dotacje i kredyty
      </h1>

      <div className="mb-6 flex flex-wrap gap-3">
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
      {data && data.items.length === 0 && (
        <p className="text-slate-500">Brak wyników dla wybranych filtrów.</p>
      )}

      <div className="flex flex-col gap-3">
        {data?.items.map((grant) => (
          <GrantCard key={grant._id} grant={grant} />
        ))}
      </div>
    </main>
  );
}
