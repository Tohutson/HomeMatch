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
import {
  clearStoredUserSession,
  getOrCreateUserId,
  getStoredUserEmail,
  getStoredUserId,
} from "@/lib/userId";

type FavoritesContextValue = UseFavoritesResult & {
  userId: number | null;
  userEmail: string | null;
  isLoggedIn: boolean;
  isUserReady: boolean;
  favoriteCount: number;
  ensureUserId: (email?: string, password?: string) => Promise<number | null>;
  logout: () => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userId, setUserId] = useState<number | null>(() => getStoredUserId());
  const [userEmail, setUserEmail] = useState<string | null>(() =>
    getStoredUserEmail()
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncFromStorage = () => {
      setUserId(getStoredUserId());
      setUserEmail(getStoredUserEmail());
    };

    window.addEventListener("storage", syncFromStorage);

    return () => {
      window.removeEventListener("storage", syncFromStorage);
    };
  }, []);

  const isLoggedIn = Boolean(userId && userId > 0);
  const isUserReady = true;
  const favorites = useFavorites({ userId, enabled: isUserReady });

  const ensureUserId = useCallback(async (email?: string, password?: string) => {
    if (userId && userId > 0) {
      return userId;
    }

    if (!email || !password) {
      return null;
    }

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const id = await getOrCreateUserId(normalizedEmail, password);
      setUserId(id);
      setUserEmail(normalizedEmail);
      return id;
    } catch (err) {
      console.error("Failed to initialize user:", err);
      return null;
    }
  }, [userId]);

  const logout = useCallback(() => {
    clearStoredUserSession();
    setUserId(null);
    setUserEmail(null);
  }, []);

  const value = useMemo(
    () => ({
      ...favorites,
      userId,
      userEmail,
      isLoggedIn,
      isUserReady,
      favoriteCount: favorites.favoriteIds.size,
      ensureUserId,
      logout,
    }),
    [
      favorites,
      userId,
      userEmail,
      isLoggedIn,
      isUserReady,
      ensureUserId,
      logout,
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
