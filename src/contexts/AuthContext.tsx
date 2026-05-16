import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: 'customer' | 'restaurant_owner' | 'admin' | null;
  roleLoading: boolean;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<'customer' | 'restaurant_owner' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);

  const roleCache = useRef<Map<string, { role: 'customer' | 'restaurant_owner' | 'admin'; ts: number }>>(new Map());
  const CACHE_TTL = 1000 * 60 * 2;

  const fetchUserRole = useCallback(async (userId: string) => {
    setRoleLoading(true);
    try {
      const cached = roleCache.current.get(userId);
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        setUserRole(cached.role);
        return cached.role;
      }

      const result: any = await Promise.race([
        supabase.rpc('get_user_role', { user_id: userId }),
        new Promise((resolve) =>
          setTimeout(
            () => resolve({ data: null, error: new Error('timeout') }),
            8000,
          ),
        ),
      ]);

      const { data, error } = result;
      const role = (!error && data ? data : 'customer') as 'customer' | 'restaurant_owner' | 'admin';
      roleCache.current.set(userId, { role, ts: Date.now() });
      setUserRole(role);
      return role;
    } catch (e) {
      console.error('Error in fetchUserRole:', e);
      setUserRole('customer');
      return 'customer';
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

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setRoleLoading(true);
        setUserRole(null);
        try {
          await fetchUserRole(session.user.id);
        } catch (e) {
          console.error('Failed to fetch user role:', e);
        }
      } else {
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
          setRoleLoading(true);
          setUserRole(null);
          try {
            await fetchUserRole(session.user.id);
          } catch (e) {
            console.error('Failed to fetch user role:', e);
          }
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
        if (mounted) setLoading(false);
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
