import { HardHat, LogOut } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ROLE_LABELS } from '../lib/roles';
import { initials } from '../lib/format';

const linkBase = 'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-200';

export function TopBar() {
  const { profile, signOut } = useAuth();
  if (!profile) return null;

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
        <Link to="/" className="flex items-center gap-2 text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-white">
            <HardHat className="h-4.5 w-4.5" />
          </span>
          <span className="text-sm font-semibold">Объекты и задачи</span>
        </Link>

        <nav className="ml-4 flex items-center gap-1">
          <NavLink to="/" end className={({ isActive }) => `${linkBase} ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`}>
            Объекты
          </NavLink>
          {profile.role === 'worker' ? (
            <NavLink to="/my-tasks" className={({ isActive }) => `${linkBase} ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`}>
              Мои задачи
            </NavLink>
          ) : null}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-800">{profile.full_name}</p>
            <p className="text-xs text-slate-500">{ROLE_LABELS[profile.role]}</p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
            {initials(profile.full_name)}
          </span>
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-slate-500 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-700"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Выйти</span>
          </button>
        </div>
      </div>
    </header>
  );
}
