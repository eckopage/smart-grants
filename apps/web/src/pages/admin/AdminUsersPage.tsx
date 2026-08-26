import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { adminFetchUsers } from '../../lib/admin-client';

export function AdminUsersPage() {
  const { accessToken } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminFetchUsers(accessToken!),
    enabled: !!accessToken,
  });

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Użytkownicy</h2>
      {isLoading && <p className="text-slate-500">Ładowanie…</p>}

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="py-2">E-mail</th>
            <th className="py-2">Rola</th>
            <th className="py-2">Utworzono</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((u) => (
            <tr key={u._id} className="border-b border-slate-100">
              <td className="py-2">{u.email}</td>
              <td className="py-2">{u.role}</td>
              <td className="py-2">{new Date(u.createdAt).toLocaleDateString('pl-PL')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
