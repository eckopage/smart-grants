import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../lib/api-client';
import { adminFetchCompanies, adminSetCompanyVerified } from '../../lib/admin-client';

export function AdminCompaniesPage() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'companies'],
    queryFn: () => adminFetchCompanies(accessToken!),
    enabled: !!accessToken,
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, isVerified }: { id: string; isVerified: boolean }) =>
      adminSetCompanyVerified(id, isVerified, accessToken!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Wystąpił błąd'),
  });

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Firmy doradcze</h2>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {isLoading && <p className="text-slate-500">Ładowanie…</p>}

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="py-2">Nazwa</th>
            <th className="py-2">Kontakt</th>
            <th className="py-2">Plan</th>
            <th className="py-2">Zweryfikowana</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {data?.map((company) => (
            <tr key={company._id} className="border-b border-slate-100">
              <td className="py-2">{company.name}</td>
              <td className="py-2">{company.contactEmail}</td>
              <td className="py-2">{company.subscriptionPlan}</td>
              <td className="py-2">{company.isVerified ? 'Tak' : 'Nie'}</td>
              <td className="py-2 text-right">
                <button
                  type="button"
                  disabled={verifyMutation.isPending}
                  onClick={() =>
                    verifyMutation.mutate({
                      id: company._id,
                      isVerified: !company.isVerified,
                    })
                  }
                  className="text-slate-900 underline disabled:opacity-50"
                >
                  {company.isVerified ? 'Cofnij weryfikację' : 'Zweryfikuj'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
