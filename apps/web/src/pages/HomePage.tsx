import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchHealth } from '../lib/api-client';

export function HomePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold text-slate-900">Smart Grants</h1>
      <p className="text-slate-600">
        Platforma agregująca dotacje i kredyty UE oraz krajowe dla polskich
        przedsiębiorców.
      </p>
      <div
        data-testid="api-status"
        className="rounded-full border border-slate-200 px-4 py-2 text-sm"
      >
        {isLoading && 'Sprawdzanie połączenia z API…'}
        {isError && (
          <span className="text-red-600">Brak połączenia z API</span>
        )}
        {data && (
          <span className="text-emerald-600">API status: {data.status}</span>
        )}
      </div>
      <Link
        to="/grants"
        className="rounded bg-slate-900 px-4 py-2 text-white"
      >
        Przeglądaj dotacje
      </Link>
    </main>
  );
}
