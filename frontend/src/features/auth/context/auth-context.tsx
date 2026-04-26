"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { clearOfflineQueue } from "@/lib/offline-queue";
import { createBrowserSupabaseClient } from "@/features/auth/lib/supabase-browser";

type AuthResult =
  | { success: true }
  | {
      success: false;
      error: string;
    };

type SignupResult =
  | { status: "success" }
  | { status: "pending" }
  | { status: "error"; error: string };

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isAuthReady: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (email: string, password: string) => Promise<SignupResult>;
  loginWithGoogle: (nextPath?: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createBrowserSupabaseClient());
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) {
        return;
      }

      if (error) {
        setSession(null);
        setUser(null);
        setIsAuthReady(true);
        return;
      }

      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setIsAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setUser(nextSession?.user ?? null);
      setIsAuthReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      setSession(data.session ?? null);
      setUser(data.user ?? null);
      setIsAuthReady(true);

      return { success: true };
    },
    [supabase],
  );

  const signup = useCallback(
    async (email: string, password: string): Promise<SignupResult> => {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        return {
          status: "error",
          error: error.message,
        };
      }

      if (data.session?.user) {
        setSession(data.session);
        setUser(data.user ?? data.session.user);
        setIsAuthReady(true);
        return { status: "success" };
      }

      return { status: "pending" };
    },
    [supabase],
  );

  const loginWithGoogle = useCallback(
    async (nextPath = "/favorites"): Promise<AuthResult> => {
      const redirectTo = new URL("/auth/callback", window.location.origin);
      redirectTo.searchParams.set("next", nextPath);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectTo.toString(),
        },
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return { success: true };
    },
    [supabase],
  );

  const logout = useCallback(async () => {
    if (user?.id) {
      clearOfflineQueue(user.id);
    }

    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  }, [supabase, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      isAuthReady,
      isAuthenticated: user != null,
      login,
      signup,
      loginWithGoogle,
      logout,
    }),
    [session, user, isAuthReady, login, signup, loginWithGoogle, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
