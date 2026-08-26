import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
    </main>
  );
}
