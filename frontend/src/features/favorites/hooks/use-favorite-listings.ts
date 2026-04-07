import { useCallback, useEffect, useState } from "react";
import { getFavorites } from "@/features/favorites/api";
import { FavoriteRecord } from "../types";

type UseFavoriteListingsParams = {
  userId: number | null;
};

type UseFavoriteListingsResult = {
  favorites: FavoriteRecord[];
  loading: boolean;
  error: string | null;
  refetchFavorites: () => Promise<void>;
};

export function useFavoriteListings({
  userId,
}: UseFavoriteListingsParams): UseFavoriteListingsResult {
  const [favorites, setFavorites] = useState<FavoriteRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetchFavorites = useCallback(async () => {
    if (!userId || userId <= 0) {
      setFavorites([]);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getFavorites(userId);
      setFavorites(data);
    } catch (err) {
      console.error("Failed to fetch favorites:", err);
      setFavorites([]);
      setError("Failed to load favorites");
    } finally {
      setLoading(false);
    }
  }, [userId]);

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
