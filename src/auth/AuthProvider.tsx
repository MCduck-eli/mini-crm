import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { fetchRow, friendlyError } from '../lib/db';
import type { Profile } from '../types';
import { AuthContext, type AuthValue } from './AuthContext';
import type { ReactNode } from 'react';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checking, setChecking] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const row = await fetchRow<Profile>(
        supabase.from('profiles').select('id, role, full_name, created_at').eq('id', userId).single(),
        'Профиль пользователя не найден. Обратитесь к постановщику.',
      );
      setProfile(row);
      setProfileError(null);
    } catch (error) {
      setProfile(null);
      setProfileError(friendlyError(error));
    }
  }, []);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
        if (data.session) void loadProfile(data.session.user.id);
        else setChecking(false);
      })
      .catch(() => setChecking(false));

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) void loadProfile(nextSession.user.id);
      else {
        setProfile(null);
        setChecking(false);
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      setChecking(false);
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ session, profile, checking, profileError, signIn, signOut }),
    [session, profile, checking, profileError, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
