'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import {
  fetchPreferencesFromBackend,
  loadPreferences,
  pushPreferencesToBackend,
  savePreferences,
} from './preferences';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);

      // Sync local preferences with Supabase on fresh sign-in.
      if (event === 'SIGNED_IN' && newSession?.access_token) {
        syncPreferencesOnSignIn(newSession.access_token).catch((err) => {
          console.warn('Preference sync failed:', err.message);
        });
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signUp,
      signIn,
      signOut,
    }),
    [session, loading, signUp, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

// When a guest with local preferences signs in, sync them with Supabase.
// Rule: backend wins if it has data; otherwise upload local data.
async function syncPreferencesOnSignIn(accessToken: string): Promise<void> {
  const local = loadPreferences();
  let remote = null;
  try {
    remote = await fetchPreferencesFromBackend(accessToken);
  } catch (err) {
    console.warn('Could not fetch remote preferences:', (err as Error).message);
  }

  if (remote && remote.favoriteGenres.length > 0) {
    savePreferences(remote);
    return;
  }

  if (local && local.favoriteGenres.length > 0) {
    try {
      const saved = await pushPreferencesToBackend(accessToken, local);
      savePreferences(saved);
    } catch (err) {
      console.warn('Could not upload local preferences:', (err as Error).message);
    }
  }
}
