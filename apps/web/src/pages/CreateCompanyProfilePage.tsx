import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api-client';
import { createCompanyProfile } from '../lib/companies-client';
import { GRANT_CATEGORIES, VOIVODESHIPS } from '../types/grant';

interface FormState {
  name: string;
  nip: string;
  description: string;
  servicesOffered: string;
  voivodeshipsServed: string[];
  specializations: string[];
  contactEmail: string;
  contactPhone: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  nip: '',
  description: '',
  servicesOffered: '',
  voivodeshipsServed: [],
  specializations: [],
  contactEmail: '',
  contactPhone: '',
};

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function CreateCompanyProfilePage() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createCompanyProfile(
        {
          name: form.name,
          nip: form.nip || undefined,
          description: form.description || undefined,
          servicesOffered: form.servicesOffered
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          voivodeshipsServed: form.voivodeshipsServed,
          specializations: form.specializations,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone || undefined,
        },
        accessToken!,
      ),
    onSuccess: () => navigate('/company/dashboard'),
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Wystąpił błąd'),
  });

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-2 text-2xl font-semibold text-slate-900">
        Utwórz profil firmy
      </h1>
      <p className="mb-6 text-slate-600">
        Uzupełnij dane, aby pojawić się w katalogu firm doradczych i otrzymywać
        dopasowane zgłoszenia od przedsiębiorców.
      </p>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          mutation.mutate();
        }}
        className="grid gap-4"
      >
        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Nazwa firmy</span>
          <input
            required
            className="rounded border border-slate-300 px-3 py-2"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">NIP</span>
            <input
              className="rounded border border-slate-300 px-3 py-2"
              value={form.nip}
              onChange={(e) => set('nip', e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">E-mail kontaktowy</span>
            <input
              required
              type="email"
              className="rounded border border-slate-300 px-3 py-2"
              value={form.contactEmail}
              onChange={(e) => set('contactEmail', e.target.value)}
            />
          </label>
        </div>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Telefon kontaktowy</span>
          <input
            className="rounded border border-slate-300 px-3 py-2"
            value={form.contactPhone}
            onChange={(e) => set('contactPhone', e.target.value)}
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Opis firmy</span>
          <textarea
            rows={4}
            className="rounded border border-slate-300 px-3 py-2"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Oferowane usługi (po przecinku)</span>
          <input
            className="rounded border border-slate-300 px-3 py-2"
            value={form.servicesOffered}
            onChange={(e) => set('servicesOffered', e.target.value)}
          />
        </label>

        <div>
          <span className="mb-2 block text-sm text-slate-700">
            Obsługiwane województwa (puste = cała Polska)
          </span>
          <div className="flex flex-wrap gap-2">
            {VOIVODESHIPS.map((v) => (
              <button
                type="button"
                key={v}
                onClick={() => set('voivodeshipsServed', toggle(form.voivodeshipsServed, v))}
                className={`rounded px-2 py-1 text-xs ${
                  form.voivodeshipsServed.includes(v)
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-300 text-slate-600'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-2 block text-sm text-slate-700">Specjalizacje</span>
          <div className="flex flex-wrap gap-2">
            {GRANT_CATEGORIES.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => set('specializations', toggle(form.specializations, c))}
                className={`rounded px-2 py-1 text-xs ${
                  form.specializations.includes(c)
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-300 text-slate-600'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-fit rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {mutation.isPending ? 'Zapisywanie…' : 'Utwórz profil'}
        </button>
      </form>
    </main>
  );
}
