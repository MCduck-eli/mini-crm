import { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from '../types';

export interface AuthValue {
  session: Session | null;
  profile: Profile | null;
  checking: boolean;
  profileError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth должен вызываться внутри AuthProvider');
  return context;
}
