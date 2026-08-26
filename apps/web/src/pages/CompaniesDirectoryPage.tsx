import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCompanies } from '../lib/companies-client';
import { GRANT_CATEGORIES, VOIVODESHIPS } from '../types/grant';

export function CompaniesDirectoryPage() {
  const [search, setSearch] = useState('');
  const [voivodeship, setVoivodeship] = useState('');
  const [specialization, setSpecialization] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['companies', { search, voivodeship, specialization }],
    queryFn: () =>
      fetchCompanies({
        search: search || undefined,
        voivodeship: voivodeship ? [voivodeship] : undefined,
        specialization: specialization ? [specialization] : undefined,
      }),
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">
        Firmy doradcze
      </h1>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input
          placeholder="Szukaj po nazwie…"
          className="rounded border border-slate-300 px-3 py-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="rounded border border-slate-300 px-3 py-2"
          value={voivodeship}
          onChange={(e) => setVoivodeship(e.target.value)}
        >
          <option value="">Wszystkie województwa</option>
          {VOIVODESHIPS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <select
          className="rounded border border-slate-300 px-3 py-2"
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
        >
          <option value="">Wszystkie specjalizacje</option>
          {GRANT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="text-slate-500">Ładowanie…</p>}
      {data && data.length === 0 && (
        <p className="text-slate-500">Brak firm spełniających kryteria.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {data?.map((company) => (
          <Link
            key={company._id}
            to={`/companies/${company._id}`}
            className="rounded border border-slate-200 p-4 hover:border-slate-400"
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="font-medium text-slate-900">{company.name}</span>
              {company.isVerified && (
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                  Zweryfikowana
                </span>
              )}
            </div>
            {company.description && (
              <p className="line-clamp-2 text-sm text-slate-600">
                {company.description}
              </p>
            )}
            {company.voivodeshipsServed.length > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                {company.voivodeshipsServed.join(', ')}
              </p>
            )}
          </Link>
        ))}
      </div>
    </main>
  );
}
