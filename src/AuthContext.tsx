import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  refreshSession,
  signIn  as apiSignIn,
  signOut as apiSignOut,
  SupabaseSession,
} from './supabase';

const SESSION_KEY = 'ibb_session';

export interface AuthUser {
  id:    string;
  email: string;
}

interface AuthContextType {
  user:    AuthUser | null;
  session: SupabaseSession | null;
  loading: boolean;
  signIn:  (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user:    null,
  session: null,
  loading: true,
  signIn:  async () => {},
  signOut: async () => {},
});

function loadStored(): SupabaseSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SupabaseSession;
  } catch {
    return null;
  }
}

function persist(s: SupabaseSession | null) {
  if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else   localStorage.removeItem(SESSION_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount + refresh if expired soon.
  useEffect(() => {
    const stored = loadStored();
    if (!stored) { setLoading(false); return; }

    const expiresInMs = (stored.expires_at * 1000) - Date.now();
    if (expiresInMs < 60_000) {
      // Expired or about to — refresh.
      refreshSession(stored.refresh_token)
        .then((fresh) => { persist(fresh); setSession(fresh); })
        .catch(() => persist(null))
        .finally(() => setLoading(false));
    } else {
      setSession(stored);
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const fresh = await apiSignIn(email, password);
    persist(fresh);
    setSession(fresh);
  }, []);

  const signOut = useCallback(async () => {
    if (session) await apiSignOut(session.access_token).catch(() => {});
    persist(null);
    setSession(null);
  }, [session]);

  const user: AuthUser | null = session
    ? { id: session.user.id, email: session.user.email }
    : null;

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
