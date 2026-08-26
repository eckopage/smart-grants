import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { fetchCompany } from '../lib/companies-client';

export function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: company, isLoading } = useQuery({
    queryKey: ['companies', id],
    queryFn: () => fetchCompany(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <p className="px-6 py-12 text-slate-500">Ładowanie…</p>;
  }

  if (!company) {
    return <p className="px-6 py-12 text-slate-500">Nie znaleziono firmy.</p>;
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-2 flex items-center gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">{company.name}</h1>
        {company.isVerified && (
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
            Zweryfikowana
          </span>
        )}
      </div>

      {company.description && (
        <p className="mb-6 text-slate-600">{company.description}</p>
      )}

      {company.servicesOffered.length > 0 && (
        <section className="mb-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">
            Oferowane usługi
          </h2>
          <ul className="list-inside list-disc text-sm text-slate-600">
            {company.servicesOffered.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>
      )}

      {company.specializations.length > 0 && (
        <section className="mb-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">
            Specjalizacje
          </h2>
          <p className="text-sm text-slate-600">
            {company.specializations.join(', ')}
          </p>
        </section>
      )}

      {company.voivodeshipsServed.length > 0 && (
        <section className="mb-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">
            Obsługiwane województwa
          </h2>
          <p className="text-sm text-slate-600">
            {company.voivodeshipsServed.join(', ')}
          </p>
        </section>
      )}

      <section className="mt-6 rounded border border-slate-200 p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Kontakt</h2>
        <p className="text-sm text-slate-600">{company.contactEmail}</p>
        {company.contactPhone && (
          <p className="text-sm text-slate-600">{company.contactPhone}</p>
        )}
      </section>
    </main>
  );
}
