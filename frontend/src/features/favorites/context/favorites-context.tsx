"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { useFavorites, type UseFavoritesResult } from "@/features/favorites/hooks/use-favorites";
import { getOrCreateUserId, getStoredUserId } from "@/lib/userId";

type FavoritesContextValue = UseFavoritesResult & {
  userId: number | null;
  isUserReady: boolean;
  favoriteCount: number;
  ensureUserId: () => Promise<number | null>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function subscribeToStoredUserId(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
  };
}

export function FavoritesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storedUserId = useSyncExternalStore(
    subscribeToStoredUserId,
    getStoredUserId,
    () => null
  );
  const [createdUserId, setCreatedUserId] = useState<number | null>(null);
  const userId = createdUserId ?? storedUserId;
  const isUserReady = true;
  const favorites = useFavorites({ userId, enabled: isUserReady });

  const ensureUserId = useCallback(async () => {
    try {
      const id = await getOrCreateUserId();
      setCreatedUserId(id);
      return id;
    } catch (err) {
      console.error("Failed to initialize user:", err);
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({
      ...favorites,
      userId,
      isUserReady,
      favoriteCount: favorites.favoriteIds.size,
      ensureUserId,
    }),
    [favorites, userId, isUserReady, ensureUserId]
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
