import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api-client';
import {
  fetchMatchedApplications,
  fetchOwnCompanyProfile,
  takeApplication,
  updateOwnCompanyProfile,
} from '../lib/companies-client';
import type { Grant } from '../types/grant';

const STATUS_LABELS: Record<string, string> = {
  intent: 'Nowe zgłoszenie',
  matched: 'Dopasowano',
  in_progress: 'W trakcie',
  submitted: 'Wniosek złożony',
  completed: 'Zakończone',
  rejected: 'Odrzucone',
  withdrawn: 'Wycofane',
};

interface ProfileFormState {
  name: string;
  description: string;
  servicesOffered: string;
  contactEmail: string;
  contactPhone: string;
}

export function CompanyDashboardPage() {
  const { user, accessToken, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [profileForm, setProfileForm] = useState<ProfileFormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [takeError, setTakeError] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ['companies', 'me', 'profile'],
    queryFn: () => fetchOwnCompanyProfile(accessToken!),
    enabled: !!accessToken,
    retry: false,
  });

  const matchedQuery = useQuery({
    queryKey: ['applications', 'company', 'matched'],
    queryFn: () => fetchMatchedApplications(accessToken!),
    enabled: !!accessToken && profileQuery.isSuccess,
  });

  useEffect(() => {
    if (!profileQuery.data) return;
    setProfileForm({
      name: profileQuery.data.name,
      description: profileQuery.data.description ?? '',
      servicesOffered: profileQuery.data.servicesOffered.join(', '),
      contactEmail: profileQuery.data.contactEmail,
      contactPhone: profileQuery.data.contactPhone ?? '',
    });
  }, [profileQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateOwnCompanyProfile(
        {
          name: profileForm!.name,
          description: profileForm!.description || undefined,
          servicesOffered: profileForm!.servicesOffered
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          contactEmail: profileForm!.contactEmail,
          contactPhone: profileForm!.contactPhone || undefined,
        },
        accessToken!,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['companies', 'me', 'profile'] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Wystąpił błąd'),
  });

  const takeMutation = useMutation({
    mutationFn: (applicationId: string) => takeApplication(applicationId, accessToken!),
    onSuccess: (application) => {
      void queryClient.invalidateQueries({
        queryKey: ['applications', 'company', 'matched'],
      });
      void navigate(`/applications/${application._id}`);
    },
    onError: (err) =>
      setTakeError(err instanceof ApiError ? err.message : 'Wystąpił błąd'),
  });

  async function handleLogout() {
    await logout();
    void navigate('/login');
  }

  if (
    profileQuery.isError &&
    profileQuery.error instanceof ApiError &&
    profileQuery.error.status === 404
  ) {
    return <Navigate to="/company/onboarding" replace />;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-6 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">Panel firmy</h1>
      <p className="text-slate-600">Zalogowano jako {user?.email}</p>
      <button
        type="button"
        onClick={() => void handleLogout()}
        className="w-fit rounded border border-slate-300 px-4 py-2 text-slate-900"
      >
        Wyloguj się
      </button>

      {profileQuery.isLoading && <p className="text-slate-500">Ładowanie…</p>}

      {profileForm && (
        <section className="mt-6">
          <h2 className="mb-3 text-xl font-semibold text-slate-900">Profil firmy</h2>
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              saveMutation.mutate();
            }}
            className="grid gap-3"
          >
            <label className="grid gap-1 text-sm">
              <span className="text-slate-700">Nazwa firmy</span>
              <input
                required
                className="rounded border border-slate-300 px-3 py-2"
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, name: e.target.value })
                }
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-700">Opis</span>
              <textarea
                rows={3}
                className="rounded border border-slate-300 px-3 py-2"
                value={profileForm.description}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, description: e.target.value })
                }
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-700">Oferowane usługi (po przecinku)</span>
              <input
                className="rounded border border-slate-300 px-3 py-2"
                value={profileForm.servicesOffered}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, servicesOffered: e.target.value })
                }
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="grid gap-1 text-sm">
                <span className="text-slate-700">E-mail kontaktowy</span>
                <input
                  required
                  type="email"
                  className="rounded border border-slate-300 px-3 py-2"
                  value={profileForm.contactEmail}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, contactEmail: e.target.value })
                  }
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-slate-700">Telefon</span>
                <input
                  className="rounded border border-slate-300 px-3 py-2"
                  value={profileForm.contactPhone}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, contactPhone: e.target.value })
                  }
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="w-fit rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Zapisywanie…' : 'Zapisz zmiany'}
            </button>
          </form>
        </section>
      )}

      <section className="mt-6">
        <h2 className="mb-3 text-xl font-semibold text-slate-900">
          Dopasowane zgłoszenia
        </h2>
        {takeError && <p className="mb-3 text-sm text-red-600">{takeError}</p>}
        {matchedQuery.isLoading && <p className="text-slate-500">Ładowanie…</p>}
        {matchedQuery.data && matchedQuery.data.length === 0 && (
          <p className="text-slate-500">Brak dopasowanych zgłoszeń.</p>
        )}
        <div className="flex flex-col gap-2">
          {matchedQuery.data?.map((application) => {
            const grant =
              typeof application.grantId === 'string' ? null : application.grantId;
            const isOwn = application.companyId !== null;
            return (
              <div
                key={application._id}
                className="rounded border border-slate-200 p-3"
              >
                <span className="font-medium text-slate-900">
                  {grant ? (grant as Grant).title : 'Dotacja'}
                </span>
                <p className="text-sm text-slate-500">
                  Status: {STATUS_LABELS[application.status] ?? application.status}
                </p>
                {isOwn ? (
                  <Link
                    to={`/applications/${application._id}`}
                    className="text-sm text-slate-900 underline"
                  >
                    Otwórz workspace →
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled={takeMutation.isPending}
                    onClick={() => {
                      setTakeError(null);
                      takeMutation.mutate(application._id);
                    }}
                    className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                  >
                    Podejmij
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
