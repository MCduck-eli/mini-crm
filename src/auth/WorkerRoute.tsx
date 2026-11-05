import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { ReactNode } from 'react';

export function WorkerRoute({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  if (!profile) return null;
  if (profile.role !== 'worker') return <Navigate to="/" replace />;
  return <>{children}</>;
}
