import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api-client';
import { checkout } from '../lib/payments-client';
import { fetchPlans } from '../lib/plans-client';

function formatPrice(value: number): string {
  return new Intl.NumberFormat('pl-PL').format(value);
}

export function PricingPage() {
  const { user, accessToken } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans', 'entrepreneur'],
    queryFn: () => fetchPlans('entrepreneur'),
  });

  async function handleChoosePlan(planKey: string) {
    setError(null);
    if (!user || !accessToken) {
      void navigate('/login');
      return;
    }
    setPendingKey(planKey);
    try {
      const { redirectUrl } = await checkout(planKey, 'monthly', accessToken);
      window.location.href = redirectUrl;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Wystąpił błąd');
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-8 text-center text-3xl font-semibold text-slate-900">
        Cennik
      </h1>
      {isLoading && <p className="text-center text-slate-500">Ładowanie…</p>}
      {error && <p className="mb-4 text-center text-red-600">{error}</p>}

      <div className="grid gap-6 sm:grid-cols-3">
        {plans?.map((plan) => (
          <div
            key={plan.key}
            className="flex flex-col gap-3 rounded-lg border border-slate-200 p-6"
          >
            <h2 className="text-xl font-semibold text-slate-900">{plan.name}</h2>
            <p className="text-2xl font-bold text-slate-900">
              {formatPrice(plan.priceMonthly)} {plan.currency}
              <span className="text-sm font-normal text-slate-500">/mies.</span>
            </p>
            <ul className="flex-1 text-sm text-slate-600">
              <li>
                Zapisane dotacje:{' '}
                {plan.limits.maxFavorites === null
                  ? 'bez limitu'
                  : plan.limits.maxFavorites}
              </li>
              <li>
                Kontakt z firmami doradczymi:{' '}
                {plan.limits.leadContactsPerMonth === null
                  ? 'bez limitu'
                  : `${plan.limits.leadContactsPerMonth}/mies.`}
              </li>
              <li>Eksport danych: {plan.limits.exportData ? 'tak' : 'nie'}</li>
            </ul>
            <button
              type="button"
              onClick={() => void handleChoosePlan(plan.key)}
              disabled={pendingKey === plan.key}
              className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
            >
              {pendingKey === plan.key ? 'Przekierowywanie…' : 'Wybierz plan'}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
