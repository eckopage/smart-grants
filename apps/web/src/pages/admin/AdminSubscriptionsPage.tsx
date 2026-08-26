import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { adminFetchSubscriptions } from '../../lib/admin-client';

function label(value: { email?: string; key?: string } | string, field: 'email' | 'key') {
  if (typeof value === 'string') return value;
  return value[field] ?? '—';
}

export function AdminSubscriptionsPage() {
  const { accessToken } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'subscriptions'],
    queryFn: () => adminFetchSubscriptions(accessToken!),
    enabled: !!accessToken,
  });

  const monthlyRevenue = data?.reduce((sum, sub) => {
    if (typeof sub.planId === 'string') return sum;
    const price =
      sub.billingPeriod === 'yearly' ? sub.planId.priceYearly / 12 : sub.planId.priceMonthly;
    return sum + price;
  }, 0);

  return (
    <div>
      <h2 className="mb-2 text-xl font-semibold text-slate-900">Subskrypcje</h2>
      {monthlyRevenue !== undefined && (
        <p className="mb-4 text-sm text-slate-600">
          Szacowany przychód miesięczny (MRR): {monthlyRevenue.toFixed(2)} PLN
        </p>
      )}
      {isLoading && <p className="text-slate-500">Ładowanie…</p>}

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="py-2">Użytkownik</th>
            <th className="py-2">Plan</th>
            <th className="py-2">Okres</th>
            <th className="py-2">Status</th>
            <th className="py-2">Koniec okresu</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((sub) => (
            <tr key={sub._id} className="border-b border-slate-100">
              <td className="py-2">{label(sub.userId, 'email')}</td>
              <td className="py-2">{label(sub.planId, 'key') || sub.planKey}</td>
              <td className="py-2">{sub.billingPeriod}</td>
              <td className="py-2">{sub.status}</td>
              <td className="py-2">
                {sub.currentPeriodEnd
                  ? new Date(sub.currentPeriodEnd).toLocaleDateString('pl-PL')
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
