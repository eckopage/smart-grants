import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../lib/api-client';
import {
  adminCreatePlan,
  adminDeletePlan,
  adminFetchPlans,
  adminUpdatePlan,
} from '../../lib/admin-client';
import type { Plan } from '../../types/plan';

interface FormState {
  key: string;
  audience: 'entrepreneur' | 'company';
  name: string;
  priceMonthly: string;
  priceYearly: string;
  currency: string;
  maxFavorites: string;
  leadContactsPerMonth: string;
  maxTeamAccounts: string;
  exportData: boolean;
  apiAccess: boolean;
}

const EMPTY_FORM: FormState = {
  key: '',
  audience: 'entrepreneur',
  name: '',
  priceMonthly: '0',
  priceYearly: '0',
  currency: 'PLN',
  maxFavorites: '',
  leadContactsPerMonth: '',
  maxTeamAccounts: '1',
  exportData: false,
  apiAccess: false,
};

function toPayload(form: FormState) {
  return {
    key: form.key,
    audience: form.audience,
    name: form.name,
    priceMonthly: Number(form.priceMonthly),
    priceYearly: Number(form.priceYearly),
    currency: form.currency,
    limits: {
      maxFavorites: form.maxFavorites ? Number(form.maxFavorites) : null,
      leadContactsPerMonth: form.leadContactsPerMonth
        ? Number(form.leadContactsPerMonth)
        : null,
      maxTeamAccounts: Number(form.maxTeamAccounts),
      exportData: form.exportData,
      apiAccess: form.apiAccess,
    },
  };
}

function planToForm(plan: Plan): FormState {
  return {
    key: plan.key,
    audience: plan.audience,
    name: plan.name,
    priceMonthly: plan.priceMonthly.toString(),
    priceYearly: plan.priceYearly.toString(),
    currency: plan.currency,
    maxFavorites: plan.limits.maxFavorites?.toString() ?? '',
    leadContactsPerMonth: plan.limits.leadContactsPerMonth?.toString() ?? '',
    maxTeamAccounts: plan.limits.maxTeamAccounts.toString(),
    exportData: plan.limits.exportData,
    apiAccess: plan.limits.apiAccess,
  };
}

export function AdminPlansPage() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: () => adminFetchPlans(accessToken!),
    enabled: !!accessToken,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = toPayload(form);
      return editingKey
        ? adminUpdatePlan(editingKey, payload, accessToken!)
        : adminCreatePlan(payload, accessToken!);
    },
    onSuccess: () => {
      void invalidate();
      setForm(EMPTY_FORM);
      setEditingKey(null);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Wystąpił błąd'),
  });

  async function handleDelete(key: string) {
    if (!confirm('Usunąć ten plan?')) return;
    try {
      await adminDeletePlan(key, accessToken!);
      void invalidate();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Wystąpił błąd');
    }
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Plany subskrypcji</h2>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {isLoading && <p className="text-slate-500">Ładowanie…</p>}

      <table className="mb-8 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="py-2">Klucz</th>
            <th className="py-2">Nazwa</th>
            <th className="py-2">Grupa</th>
            <th className="py-2">Cena mies.</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {data?.map((plan) => (
            <tr key={plan._id} className="border-b border-slate-100">
              <td className="py-2">{plan.key}</td>
              <td className="py-2">{plan.name}</td>
              <td className="py-2">{plan.audience}</td>
              <td className="py-2">
                {plan.priceMonthly} {plan.currency}
              </td>
              <td className="py-2 text-right">
                <button
                  type="button"
                  onClick={() => {
                    setEditingKey(plan.key);
                    setForm(planToForm(plan));
                  }}
                  className="mr-3 text-slate-900 underline"
                >
                  Edytuj
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(plan.key)}
                  className="text-red-600 underline"
                >
                  Usuń
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="mb-3 text-lg font-semibold text-slate-900">
        {editingKey ? `Edytuj plan: ${editingKey}` : 'Nowy plan'}
      </h3>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          saveMutation.mutate();
        }}
        className="grid max-w-2xl gap-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Klucz</span>
            <input
              required
              disabled={!!editingKey}
              className="rounded border border-slate-300 px-3 py-2 disabled:bg-slate-100"
              value={form.key}
              onChange={(e) => set('key', e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Grupa odbiorców</span>
            <select
              className="rounded border border-slate-300 px-3 py-2"
              value={form.audience}
              onChange={(e) =>
                set('audience', e.target.value as FormState['audience'])
              }
            >
              <option value="entrepreneur">Przedsiębiorca</option>
              <option value="company">Firma doradcza</option>
            </select>
          </label>
        </div>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Nazwa</span>
          <input
            required
            className="rounded border border-slate-300 px-3 py-2"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </label>

        <div className="grid grid-cols-3 gap-4">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Cena miesięczna</span>
            <input
              type="number"
              className="rounded border border-slate-300 px-3 py-2"
              value={form.priceMonthly}
              onChange={(e) => set('priceMonthly', e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Cena roczna</span>
            <input
              type="number"
              className="rounded border border-slate-300 px-3 py-2"
              value={form.priceYearly}
              onChange={(e) => set('priceYearly', e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Waluta</span>
            <input
              className="rounded border border-slate-300 px-3 py-2"
              value={form.currency}
              onChange={(e) => set('currency', e.target.value)}
            />
          </label>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Limit ulubionych (puste = bez limitu)</span>
            <input
              type="number"
              className="rounded border border-slate-300 px-3 py-2"
              value={form.maxFavorites}
              onChange={(e) => set('maxFavorites', e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Kontakty leadowe/mies.</span>
            <input
              type="number"
              className="rounded border border-slate-300 px-3 py-2"
              value={form.leadContactsPerMonth}
              onChange={(e) => set('leadContactsPerMonth', e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Konta zespołowe</span>
            <input
              type="number"
              className="rounded border border-slate-300 px-3 py-2"
              value={form.maxTeamAccounts}
              onChange={(e) => set('maxTeamAccounts', e.target.value)}
            />
          </label>
        </div>

        <div className="flex gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.exportData}
              onChange={(e) => set('exportData', e.target.checked)}
            />
            Eksport danych
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.apiAccess}
              onChange={(e) => set('apiAccess', e.target.checked)}
            />
            Dostęp API
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Zapisywanie…' : 'Zapisz'}
          </button>
          {editingKey && (
            <button
              type="button"
              onClick={() => {
                setEditingKey(null);
                setForm(EMPTY_FORM);
              }}
              className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700"
            >
              Anuluj
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
