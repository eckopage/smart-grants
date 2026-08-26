import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="border-b border-slate-200">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link to="/" className="font-semibold text-slate-900">
          Smart Grants
        </Link>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <Link to="/grants" className="hover:text-slate-900">
            Dotacje
          </Link>
          <Link to="/pricing" className="hover:text-slate-900">
            Cennik
          </Link>
          {user ? (
            <Link
              to={user.role === 'admin' ? '/admin' : '/dashboard'}
              className="hover:text-slate-900"
            >
              {user.role === 'admin' ? 'Panel admina' : 'Panel'}
            </Link>
          ) : (
            <>
              <Link to="/login" className="hover:text-slate-900">
                Zaloguj się
              </Link>
              <Link
                to="/register"
                className="rounded bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-800"
              >
                Załóż konto
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
