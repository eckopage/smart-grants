import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../lib/api-client';
import { adminDeleteGrant, adminFetchGrants } from '../../lib/admin-client';

export function AdminGrantsPage() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'grants'],
    queryFn: () => adminFetchGrants(accessToken!),
    enabled: !!accessToken,
  });

  async function handleDelete(id: string) {
    if (!confirm('Usunąć tę dotację?')) return;
    setError(null);
    try {
      await adminDeleteGrant(id, accessToken!);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'grants'] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Wystąpił błąd');
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Dotacje</h2>
        <Link
          to="/admin/grants/new"
          className="rounded bg-slate-900 px-3 py-2 text-sm text-white"
        >
          Nowa dotacja
        </Link>
      </div>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {isLoading && <p className="text-slate-500">Ładowanie…</p>}

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="py-2">Tytuł</th>
            <th className="py-2">Programme</th>
            <th className="py-2">Status</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {data?.items.map((grant) => (
            <tr key={grant._id} className="border-b border-slate-100">
              <td className="py-2">{grant.title}</td>
              <td className="py-2">{grant.programme}</td>
              <td className="py-2">{grant.timeline.status}</td>
              <td className="py-2 text-right">
                <Link
                  to={`/admin/grants/${grant._id}`}
                  className="mr-3 text-slate-900 underline"
                >
                  Edytuj
                </Link>
                <button
                  type="button"
                  onClick={() => void handleDelete(grant._id)}
                  className="text-red-600 underline"
                >
                  Usuń
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
