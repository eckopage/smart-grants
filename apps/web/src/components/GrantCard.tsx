import { Link } from 'react-router-dom';
import type { Grant } from '../types/grant';

function formatAmount(value: number): string {
  return new Intl.NumberFormat('pl-PL').format(value);
}

export function GrantCard({ grant }: { grant: Grant }) {
  const deadline = grant.timeline.submissionClosesAt
    ? new Date(grant.timeline.submissionClosesAt).toLocaleDateString('pl-PL')
    : 'brak danych';

  return (
    <Link
      to={`/grants/${grant.slug}`}
      className="block rounded-lg border border-slate-200 p-4 transition hover:border-slate-400"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-900">{grant.title}</h3>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
          {grant.timeline.status}
        </span>
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-slate-600">
        {grant.shortSummary ?? grant.description}
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
        {grant.fundingRange && (
          <span>
            {formatAmount(grant.fundingRange.min)} –{' '}
            {formatAmount(grant.fundingRange.max)} zł
          </span>
        )}
        <span>Termin: {deadline}</span>
      </div>
      {grant.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {grant.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded bg-slate-50 px-2 py-0.5 text-xs text-slate-500"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
