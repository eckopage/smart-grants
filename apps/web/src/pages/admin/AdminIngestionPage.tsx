import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../lib/api-client';
import { adminFetchIngestionRuns, adminTriggerIngestion } from '../../lib/admin-client';

export function AdminIngestionPage() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'ingestion', 'runs'],
    queryFn: () => adminFetchIngestionRuns(accessToken!),
    enabled: !!accessToken,
  });

  const triggerMutation = useMutation({
    mutationFn: () => adminTriggerIngestion(accessToken!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'ingestion', 'runs'] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Wystąpił błąd'),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Import danych (scraper)</h2>
        <button
          type="button"
          disabled={triggerMutation.isPending}
          onClick={() => {
            setError(null);
            triggerMutation.mutate();
          }}
          className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {triggerMutation.isPending ? 'Uruchamianie…' : 'Uruchom import teraz'}
        </button>
      </div>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {isLoading && <p className="text-slate-500">Ładowanie…</p>}

      <div className="flex flex-col gap-4">
        {data?.map((run) => (
          <div key={run._id} className="rounded border border-slate-200 p-4">
            <div className="mb-2 flex justify-between text-sm text-slate-500">
              <span>Start: {new Date(run.startedAt).toLocaleString('pl-PL')}</span>
              <span>
                {run.finishedAt
                  ? `Koniec: ${new Date(run.finishedAt).toLocaleString('pl-PL')}`
                  : 'W trakcie…'}
              </span>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-1">Źródło</th>
                  <th className="py-1">Znaleziono</th>
                  <th className="py-1">Utworzono</th>
                  <th className="py-1">Zaktualizowano</th>
                  <th className="py-1">Błąd</th>
                </tr>
              </thead>
              <tbody>
                {run.results.map((r) => (
                  <tr key={r.source} className="border-b border-slate-100">
                    <td className="py-1">{r.source}</td>
                    <td className="py-1">{r.found}</td>
                    <td className="py-1">{r.created}</td>
                    <td className="py-1">{r.updated}</td>
                    <td className="py-1 text-red-600">{r.error ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {data && data.length === 0 && (
          <p className="text-slate-500">Brak dotychczasowych uruchomień.</p>
        )}
      </div>
    </div>
  );
}
