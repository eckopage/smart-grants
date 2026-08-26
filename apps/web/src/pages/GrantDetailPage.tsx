import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { fetchGrantBySlug } from '../lib/grants-client';

function formatDate(value?: string): string {
  return value ? new Date(value).toLocaleDateString('pl-PL') : '—';
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat('pl-PL').format(value);
}

export function GrantDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const {
    data: grant,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['grant', slug],
    queryFn: () => fetchGrantBySlug(slug!),
    enabled: !!slug,
  });

  if (isLoading) {
    return <p className="p-10 text-slate-500">Ładowanie…</p>;
  }
  if (isError || !grant) {
    return (
      <div className="p-10">
        <p className="text-red-600">Nie znaleziono dotacji.</p>
        <Link to="/grants" className="text-slate-900 underline">
          Wróć do listy
        </Link>
      </div>
    );
  }

  const steps: { label: string; date?: string }[] = [
    { label: 'Ogłoszenie', date: grant.timeline.announcedAt },
    { label: 'Otwarcie naboru', date: grant.timeline.submissionOpensAt },
    { label: 'Zamknięcie naboru', date: grant.timeline.submissionClosesAt },
    { label: 'Rozstrzygnięcie', date: grant.timeline.resultsAt },
  ];

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/grants" className="text-sm text-slate-500 underline">
        ← Wróć do listy
      </Link>
      <h1 className="mt-2 text-3xl font-semibold text-slate-900">
        {grant.title}
      </h1>
      <p className="mt-2 text-slate-600">{grant.description}</p>

      <section className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="block text-slate-500">Program</span>
          <span className="font-medium text-slate-900">{grant.programme}</span>
        </div>
        <div>
          <span className="block text-slate-500">Instytucja</span>
          <span className="font-medium text-slate-900">{grant.institution}</span>
        </div>
        {grant.fundingRange && (
          <div>
            <span className="block text-slate-500">Kwota dofinansowania</span>
            <span className="font-medium text-slate-900">
              {formatAmount(grant.fundingRange.min)} –{' '}
              {formatAmount(grant.fundingRange.max)} zł
            </span>
          </div>
        )}
        {grant.cofinancingRate && (
          <div>
            <span className="block text-slate-500">Poziom dofinansowania</span>
            <span className="font-medium text-slate-900">
              {grant.cofinancingRate}
            </span>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-semibold text-slate-900">Oś czasu naboru</h2>
        <ol className="flex flex-wrap gap-4">
          {steps.map((step) => (
            <li key={step.label} className="rounded border border-slate-200 px-3 py-2">
              <div className="text-xs text-slate-500">{step.label}</div>
              <div className="text-sm font-medium text-slate-900">
                {formatDate(step.date)}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {grant.eligibleCosts.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 font-semibold text-slate-900">
            Na co można przeznaczyć środki
          </h2>
          <ul className="list-inside list-disc text-sm text-slate-700">
            {grant.eligibleCosts.map((cost) => (
              <li key={cost}>{cost}</li>
            ))}
          </ul>
        </section>
      )}

      {grant.requiredDocuments.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 font-semibold text-slate-900">
            Wymagane dokumenty
          </h2>
          <ul className="list-inside list-disc text-sm text-slate-700">
            {grant.requiredDocuments.map((doc) => (
              <li key={doc}>{doc}</li>
            ))}
          </ul>
        </section>
      )}

      {grant.eligibility && (
        <section className="mt-8">
          <h2 className="mb-2 font-semibold text-slate-900">Kto może aplikować</h2>
          <p className="text-sm text-slate-700">{grant.eligibility}</p>
        </section>
      )}

      {grant.sourceUrl && (
        <a
          href={grant.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-block text-sm text-slate-900 underline"
        >
          Źródło informacji →
        </a>
      )}
    </main>
  );
}
