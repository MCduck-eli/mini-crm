import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { BootScreen } from '../components/BootScreen';
import type { ReactNode } from 'react';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, profile, checking, profileError } = useAuth();
  const location = useLocation();

  if (checking) return <BootScreen />;
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!profile) {
    return (
      <div className="mx-auto mt-20 max-w-md rise rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
        <p className="text-sm text-slate-600">{profileError ?? 'Профиль пользователя не найден.'}</p>
      </div>
    );
  }
  return <>{children}</>;
}
