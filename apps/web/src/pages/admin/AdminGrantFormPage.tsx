import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../lib/api-client';
import {
  adminCreateGrant,
  adminFetchGrant,
  adminUpdateGrant,
} from '../../lib/admin-client';
import type { GrantSource, GrantTimelineStatus, GrantType } from '../../types/grant';

interface FormState {
  title: string;
  description: string;
  shortSummary: string;
  type: GrantType;
  source: GrantSource;
  programme: string;
  institution: string;
  voivodeships: string;
  category: string;
  tags: string;
  budgetTotal: string;
  fundingMin: string;
  fundingMax: string;
  eligibleCosts: string;
  supportForm: string;
  cofinancingRate: string;
  status: GrantTimelineStatus;
  submissionOpensAt: string;
  submissionClosesAt: string;
  eligibility: string;
  requiredDocuments: string;
  sourceUrl: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  shortSummary: '',
  type: 'grant',
  source: 'national',
  programme: '',
  institution: '',
  voivodeships: '',
  category: '',
  tags: '',
  budgetTotal: '',
  fundingMin: '',
  fundingMax: '',
  eligibleCosts: '',
  supportForm: '',
  cofinancingRate: '',
  status: 'upcoming',
  submissionOpensAt: '',
  submissionClosesAt: '',
  eligibility: '',
  requiredDocuments: '',
  sourceUrl: '',
};

function toList(value: string): string[] {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function toPayload(form: FormState): Record<string, unknown> {
  return {
    title: form.title,
    description: form.description,
    shortSummary: form.shortSummary || undefined,
    type: form.type,
    source: form.source,
    programme: form.programme,
    institution: form.institution,
    voivodeships: toList(form.voivodeships),
    category: toList(form.category),
    tags: toList(form.tags),
    budgetTotal: form.budgetTotal ? Number(form.budgetTotal) : undefined,
    fundingRange:
      form.fundingMin || form.fundingMax
        ? { min: Number(form.fundingMin || 0), max: Number(form.fundingMax || 0) }
        : undefined,
    eligibleCosts: toList(form.eligibleCosts),
    supportForm: form.supportForm || undefined,
    cofinancingRate: form.cofinancingRate || undefined,
    timeline: {
      status: form.status,
      submissionOpensAt: form.submissionOpensAt || undefined,
      submissionClosesAt: form.submissionClosesAt || undefined,
    },
    eligibility: form.eligibility || undefined,
    requiredDocuments: toList(form.requiredDocuments),
    sourceUrl: form.sourceUrl || undefined,
  };
}

export function AdminGrantFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id && id !== 'new';
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const { data: existing } = useQuery({
    queryKey: ['admin', 'grants', id],
    queryFn: () => adminFetchGrant(id!, accessToken!),
    enabled: isEdit && !!accessToken,
  });

  useEffect(() => {
    if (!existing) return;
    setForm({
      title: existing.title,
      description: existing.description,
      shortSummary: existing.shortSummary ?? '',
      type: existing.type,
      source: existing.source,
      programme: existing.programme,
      institution: existing.institution,
      voivodeships: existing.voivodeships.join(', '),
      category: existing.category.join(', '),
      tags: existing.tags.join(', '),
      budgetTotal: existing.budgetTotal?.toString() ?? '',
      fundingMin: existing.fundingRange?.min?.toString() ?? '',
      fundingMax: existing.fundingRange?.max?.toString() ?? '',
      eligibleCosts: existing.eligibleCosts.join(', '),
      supportForm: existing.supportForm ?? '',
      cofinancingRate: existing.cofinancingRate ?? '',
      status: existing.timeline.status,
      submissionOpensAt: existing.timeline.submissionOpensAt?.slice(0, 10) ?? '',
      submissionClosesAt: existing.timeline.submissionClosesAt?.slice(0, 10) ?? '',
      eligibility: existing.eligibility ?? '',
      requiredDocuments: existing.requiredDocuments.join(', '),
      sourceUrl: existing.sourceUrl ?? '',
    });
  }, [existing]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = toPayload(form);
      return isEdit
        ? adminUpdateGrant(id!, payload, accessToken!)
        : adminCreateGrant(payload, accessToken!);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'grants'] });
      navigate('/admin/grants');
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Wystąpił błąd');
    },
  });

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold text-slate-900">
        {isEdit ? 'Edytuj dotację' : 'Nowa dotacja'}
      </h2>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          mutation.mutate();
        }}
        className="grid max-w-3xl gap-4"
      >
        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Tytuł</span>
          <input
            required
            className="rounded border border-slate-300 px-3 py-2"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Krótkie podsumowanie</span>
          <input
            className="rounded border border-slate-300 px-3 py-2"
            value={form.shortSummary}
            onChange={(e) => set('shortSummary', e.target.value)}
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Opis</span>
          <textarea
            required
            rows={5}
            className="rounded border border-slate-300 px-3 py-2"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Typ</span>
            <select
              className="rounded border border-slate-300 px-3 py-2"
              value={form.type}
              onChange={(e) => set('type', e.target.value as GrantType)}
            >
              <option value="grant">Dotacja</option>
              <option value="loan">Pożyczka</option>
              <option value="guarantee">Gwarancja</option>
              <option value="other">Inne</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Źródło</span>
            <select
              className="rounded border border-slate-300 px-3 py-2"
              value={form.source}
              onChange={(e) => set('source', e.target.value as GrantSource)}
            >
              <option value="eu_central">UE centralne</option>
              <option value="national">Krajowe</option>
              <option value="regional">Regionalne</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Program</span>
            <input
              required
              className="rounded border border-slate-300 px-3 py-2"
              value={form.programme}
              onChange={(e) => set('programme', e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Instytucja</span>
            <input
              required
              className="rounded border border-slate-300 px-3 py-2"
              value={form.institution}
              onChange={(e) => set('institution', e.target.value)}
            />
          </label>
        </div>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Województwa (po przecinku, puste = ogólnopolski)</span>
          <input
            className="rounded border border-slate-300 px-3 py-2"
            value={form.voivodeships}
            onChange={(e) => set('voivodeships', e.target.value)}
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Kategorie (po przecinku)</span>
          <input
            className="rounded border border-slate-300 px-3 py-2"
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Tagi (po przecinku)</span>
          <input
            className="rounded border border-slate-300 px-3 py-2"
            value={form.tags}
            onChange={(e) => set('tags', e.target.value)}
          />
        </label>

        <div className="grid grid-cols-3 gap-4">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Budżet całkowity (PLN)</span>
            <input
              type="number"
              className="rounded border border-slate-300 px-3 py-2"
              value={form.budgetTotal}
              onChange={(e) => set('budgetTotal', e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Dofinansowanie min (PLN)</span>
            <input
              type="number"
              className="rounded border border-slate-300 px-3 py-2"
              value={form.fundingMin}
              onChange={(e) => set('fundingMin', e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Dofinansowanie max (PLN)</span>
            <input
              type="number"
              className="rounded border border-slate-300 px-3 py-2"
              value={form.fundingMax}
              onChange={(e) => set('fundingMax', e.target.value)}
            />
          </label>
        </div>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Koszty kwalifikowane (po przecinku)</span>
          <input
            className="rounded border border-slate-300 px-3 py-2"
            value={form.eligibleCosts}
            onChange={(e) => set('eligibleCosts', e.target.value)}
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Forma wsparcia</span>
            <input
              className="rounded border border-slate-300 px-3 py-2"
              value={form.supportForm}
              onChange={(e) => set('supportForm', e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Poziom dofinansowania</span>
            <input
              className="rounded border border-slate-300 px-3 py-2"
              value={form.cofinancingRate}
              onChange={(e) => set('cofinancingRate', e.target.value)}
            />
          </label>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Status</span>
            <select
              className="rounded border border-slate-300 px-3 py-2"
              value={form.status}
              onChange={(e) => set('status', e.target.value as GrantTimelineStatus)}
            >
              <option value="upcoming">Nadchodzący</option>
              <option value="open">Otwarty</option>
              <option value="closed">Zamknięty</option>
              <option value="settled">Rozliczony</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Start naboru</span>
            <input
              type="date"
              className="rounded border border-slate-300 px-3 py-2"
              value={form.submissionOpensAt}
              onChange={(e) => set('submissionOpensAt', e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Koniec naboru</span>
            <input
              type="date"
              className="rounded border border-slate-300 px-3 py-2"
              value={form.submissionClosesAt}
              onChange={(e) => set('submissionClosesAt', e.target.value)}
            />
          </label>
        </div>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Kryteria kwalifikowalności</span>
          <textarea
            rows={3}
            className="rounded border border-slate-300 px-3 py-2"
            value={form.eligibility}
            onChange={(e) => set('eligibility', e.target.value)}
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Wymagane dokumenty (po przecinku)</span>
          <input
            className="rounded border border-slate-300 px-3 py-2"
            value={form.requiredDocuments}
            onChange={(e) => set('requiredDocuments', e.target.value)}
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Link źródłowy</span>
          <input
            className="rounded border border-slate-300 px-3 py-2"
            value={form.sourceUrl}
            onChange={(e) => set('sourceUrl', e.target.value)}
          />
        </label>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {mutation.isPending ? 'Zapisywanie…' : 'Zapisz'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/grants')}
            className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700"
          >
            Anuluj
          </button>
        </div>
      </form>
    </div>
  );
}
