"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useFavorites, type UseFavoritesResult } from "@/features/favorites/hooks/use-favorites";
import { createClient } from "@/lib/supabase/client";

type SessionUser = {
  id: string;
  email: string | null;
};

type FavoritesContextValue = UseFavoritesResult & {
  user: SessionUser | null;
  isLoggedIn: boolean;
  isUserReady: boolean;
  favoriteCount: number;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<"success" | "pending" | "error">;
  signInWithGoogle: (nextPath?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isUserReady, setIsUserReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }

      setUser(
        data.session?.user
          ? {
              id: data.session.user.id,
              email: data.session.user.email ?? null,
            }
          : null
      );
      setIsUserReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(
        session?.user
          ? {
              id: session.user.id,
              email: session.user.email ?? null,
            }
          : null
      );
      setIsUserReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const isLoggedIn = Boolean(user);
  const favorites = useFavorites({ enabled: isUserReady && isLoggedIn });

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error || !data.user) {
        return false;
      }

      setUser({
        id: data.user.id,
        email: data.user.email ?? null,
      });
      setIsUserReady(true);
      return true;
    },
    [supabase]
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        return "error";
      }

      if (data.session?.user) {
        setUser({
          id: data.session.user.id,
          email: data.session.user.email ?? null,
        });
        setIsUserReady(true);
        return "success";
      }

      return "pending";
    },
    [supabase]
  );

  const signInWithGoogle = useCallback(
    async (nextPath = "/favorites") => {
      const redirectTo = new URL("/auth/callback", window.location.origin);
      redirectTo.searchParams.set("next", nextPath);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectTo.toString(),
        },
      });

      if (error) {
        return false;
      }

      return true;
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, [supabase]);

  const value = useMemo(
    () => ({
      ...favorites,
      user,
      isLoggedIn,
      isUserReady,
      favoriteCount: isLoggedIn ? favorites.favoriteIds.size : 0,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
    }),
    [
      favorites,
      user,
      isLoggedIn,
      isUserReady,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
    ]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavoritesContext() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error("useFavoritesContext must be used within FavoritesProvider");
  }

  return context;
}
