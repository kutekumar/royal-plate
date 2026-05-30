import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'customer' | 'restaurant_owner' | 'admin';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  roleLoading: boolean;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_STORAGE_KEY = 'rp_user_role';

function readStoredRole(userId: string): UserRole | null {
  try {
    const raw = localStorage.getItem(ROLE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.userId === userId && parsed.role) return parsed.role;
  } catch {}
  return null;
}

function writeStoredRole(userId: string, role: UserRole) {
  try {
    localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify({ userId, role }));
  } catch {}
}

function clearStoredRole() {
  try {
    localStorage.removeItem(ROLE_STORAGE_KEY);
  } catch {}
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);

  const roleCache = useRef<Map<string, { role: UserRole; ts: number }>>(new Map());
  const initDone = useRef(false);
  const CACHE_TTL = 1000 * 60 * 2;

  const fetchUserRole = useCallback(async (userId: string) => {
    setRoleLoading(true);
    try {
      const cached = roleCache.current.get(userId);
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        setUserRole(cached.role);
        return cached.role;
      }

      const stored = readStoredRole(userId);
      if (stored) {
        setUserRole(stored);
      }

      const result: any = await Promise.race([
        supabase.rpc('get_user_role', { user_id: userId }),
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: null, error: new Error('timeout') }), 8000),
        ),
      ]);

      const { data, error } = result;
      if (!error && data) {
        const role = data as UserRole;
        roleCache.current.set(userId, { role, ts: Date.now() });
        writeStoredRole(userId, role);
        setUserRole(role);
        return role;
      }

      if (stored) {
        roleCache.current.set(userId, { role: stored, ts: Date.now() });
        return stored;
      }

      return null;
    } catch (e) {
      console.error('Error in fetchUserRole:', e);
      const stored = readStoredRole(userId);
      if (stored) {
        roleCache.current.set(userId, { role: stored, ts: Date.now() });
        setUserRole(stored);
        return stored;
      }
      return null;
    } finally {
      setRoleLoading(false);
    }
  }, []);

  const refreshRole = useCallback(async () => {
    if (user) {
      roleCache.current.delete(user.id);
      await fetchUserRole(user.id);
    }
  }, [user, fetchUserRole]);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'INITIAL_SESSION') return;

      if (event === 'SIGNED_IN' && session?.user) {
        setSession(session);
        setUser(session.user);
        await fetchUserRole(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        roleCache.current.clear();
        clearStoredRole();
        setSession(null);
        setUser(null);
        setUserRole(null);
      }
    });

    const init = async () => {
      try {
        const storageKey = Object.keys(localStorage).find(
          (k) => k.startsWith('sb-') && k.endsWith('-auth-token'),
        );

        if (storageKey) {
          try {
            const raw = localStorage.getItem(storageKey);
            if (raw) {
              const parsed = JSON.parse(raw);
              const expired = parsed?.expires_at
                ? Date.now() / 1000 > parsed.expires_at - 120
                : true;
              if (expired) {
                localStorage.removeItem(storageKey);
              }
            }
          } catch {}
        }

        const result = await supabase.auth.getSession();

        if (!mounted) return;
        const session = result?.data?.session ?? null;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchUserRole(session.user.id);
        } else {
          setUserRole(null);
        }
      } catch {
        if (!mounted) return;
        try {
          const key = Object.keys(localStorage).find(
            (k) => k.startsWith('sb-') && k.endsWith('-auth-token'),
          );
          if (key) localStorage.removeItem(key);
        } catch {}
      } finally {
        if (mounted) {
          initDone.current = true;
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserRole]);

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/home`,
        data: { full_name: fullName, phone },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    roleCache.current.clear();
    clearStoredRole();
    setUserRole(null);
    setUser(null);
    setSession(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, userRole, roleLoading, signUp, signIn, signOut, loading, refreshRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
