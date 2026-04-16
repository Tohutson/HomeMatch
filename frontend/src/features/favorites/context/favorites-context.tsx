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
import { getOrCreateUserId } from "@/lib/userId";

type FavoritesContextValue = UseFavoritesResult & {
  userId: number | null;
  favoriteCount: number;
  ensureUserId: () => Promise<number | null>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userId, setUserId] = useState<number | null>(null);
  const favorites = useFavorites({ userId });

  const ensureUserId = useCallback(async () => {
    try {
      const id = await getOrCreateUserId();
      setUserId(id);
      return id;
    } catch (err) {
      console.error("Failed to initialize user:", err);
      return null;
    }
  }, []);

  useEffect(() => {
    void ensureUserId();
  }, [ensureUserId]);

  const value = useMemo(
    () => ({
      ...favorites,
      userId,
      favoriteCount: favorites.favoriteIds.size,
      ensureUserId,
    }),
    [favorites, userId, ensureUserId]
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
