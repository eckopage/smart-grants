import { NavLink, Outlet } from 'react-router-dom';

const LINKS = [
  { to: '/admin/grants', label: 'Dotacje' },
  { to: '/admin/plans', label: 'Plany' },
  { to: '/admin/companies', label: 'Firmy' },
  { to: '/admin/ingestion', label: 'Scraper' },
  { to: '/admin/users', label: 'Użytkownicy' },
  { to: '/admin/subscriptions', label: 'Subskrypcje' },
];

export function AdminLayout() {
  return (
    <div className="mx-auto flex max-w-6xl gap-6 px-6 py-8">
      <aside className="w-48 shrink-0">
        <h1 className="mb-4 text-lg font-semibold text-slate-900">
          Panel admina
        </h1>
        <nav className="flex flex-col gap-1">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded px-3 py-2 text-sm ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
