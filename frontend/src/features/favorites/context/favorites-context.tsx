"use client";

import { createContext, useContext, useMemo } from "react";
import { useAuth } from "@/features/auth/context/auth-context";
import { useFavorites, type UseFavoritesResult } from "@/features/favorites/hooks/use-favorites";

type FavoritesContextValue = UseFavoritesResult & {
  favoriteCount: number;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isAuthReady } = useAuth();
  const favorites = useFavorites({
    enabled: isAuthReady && isAuthenticated,
    userSub: user?.id ?? null,
  });

  const value = useMemo(
    () => ({
      ...favorites,
      favoriteCount: isAuthenticated ? favorites.favoriteIds.size : 0,
    }),
    [favorites, isAuthenticated]
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
