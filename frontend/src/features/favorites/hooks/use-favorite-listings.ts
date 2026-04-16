import { useCallback, useEffect, useState } from "react";
import { getFavorites } from "@/features/favorites/api";
import { FavoriteRecord } from "../types";

type UseFavoriteListingsParams = {
  userId: number | null;
};

export type RefetchFavoritesOptions = {
  background?: boolean;
};

type UseFavoriteListingsResult = {
  favorites: FavoriteRecord[];
  loading: boolean;
  error: string | null;
  refetchFavorites: (options?: RefetchFavoritesOptions) => Promise<void>;
};

export function useFavoriteListings({
  userId,
}: UseFavoriteListingsParams): UseFavoriteListingsResult {
  const [favorites, setFavorites] = useState<FavoriteRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetchFavorites = useCallback(
    async ({ background = false }: RefetchFavoritesOptions = {}) => {
      if (!userId || userId <= 0) {
        setFavorites([]);
        setError(null);
        setLoading(false);
        return;
      }

      try {
        if (!background) {
          setLoading(true);
          setError(null);
        }

        const data = await getFavorites(userId);
        setFavorites(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch favorites:", err);
        if (!background) {
          setFavorites([]);
          setError("Failed to load favorites");
        }
      } finally {
        if (!background) {
          setLoading(false);
        }
      }
    },
    [userId],
  );

  useEffect(() => {
    void refetchFavorites();
  }, [refetchFavorites]);

  return {
    favorites,
    loading,
    error,
    refetchFavorites,
  };
}
