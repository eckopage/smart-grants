import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchMyApplications } from '../lib/applications-client';
import type { Grant } from '../types/grant';

const STATUS_LABELS: Record<string, string> = {
  intent: 'Zgłoszenie wysłane',
  matched: 'Dopasowano firmę',
  in_progress: 'W trakcie',
  submitted: 'Wniosek złożony',
  completed: 'Zakończone',
  rejected: 'Odrzucone',
  withdrawn: 'Wycofane',
};

export function DashboardPage() {
  const { user, accessToken, logout } = useAuth();
  const navigate = useNavigate();

  const { data: applications, isLoading } = useQuery({
    queryKey: ['applications', 'me'],
    queryFn: () => fetchMyApplications(accessToken!),
    enabled: !!accessToken,
  });

  async function handleLogout() {
    await logout();
    void navigate('/login');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-6 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">Panel użytkownika</h1>
      <p className="text-slate-600">Zalogowano jako {user?.email}</p>
      <p className="text-slate-600">Rola: {user?.role}</p>
      <button
        type="button"
        onClick={() => void handleLogout()}
        className="w-fit rounded border border-slate-300 px-4 py-2 text-slate-900"
      >
        Wyloguj się
      </button>

      <section className="mt-6">
        <h2 className="mb-3 text-xl font-semibold text-slate-900">
          Moje aplikacje
        </h2>
        {isLoading && <p className="text-slate-500">Ładowanie…</p>}
        {applications && applications.length === 0 && (
          <p className="text-slate-500">Brak zgłoszeń.</p>
        )}
        <div className="flex flex-col gap-2">
          {applications?.map((application) => {
            const grant =
              typeof application.grantId === 'string' ? null : application.grantId;
            return (
              <div
                key={application._id}
                className="rounded border border-slate-200 p-3"
              >
                {grant ? (
                  <Link
                    to={`/grants/${(grant as Grant).slug}`}
                    className="font-medium text-slate-900 underline"
                  >
                    {(grant as Grant).title}
                  </Link>
                ) : (
                  <span className="font-medium text-slate-900">Dotacja</span>
                )}
                <p className="text-sm text-slate-500">
                  Status: {STATUS_LABELS[application.status] ?? application.status}
                </p>
                <Link
                  to={`/applications/${application._id}`}
                  className="text-sm text-slate-900 underline"
                >
                  Otwórz workspace →
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
