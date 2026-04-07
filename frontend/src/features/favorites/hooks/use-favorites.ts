import { useCallback, useEffect, useState } from "react";
import {
  addFavorite as addFavoriteRequest,
  getFavorites,
  removeFavorite as removeFavoriteRequest,
} from "@/features/favorites/api";

type UseFavoritesParams = {
  userId: number | null;
};

type ActionResult =
  | { ok: true }
  | {
      ok: false;
      reason: "missing_user" | "already_exists" | "request_failed";
    };

type UseFavoritesResult = {
  favoriteIds: Set<number>;
  loading: boolean;
  error: string | null;
  isFavorited: (listingId: number) => boolean;
  addFavorite: (listingId: number) => Promise<ActionResult>;
  removeFavorite: (listingId: number) => Promise<ActionResult>;
  refetchFavorites: () => Promise<void>;
};

export function useFavorites({
  userId,
}: UseFavoritesParams): UseFavoritesResult {
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetchFavorites = useCallback(async () => {
    if (!userId || userId <= 0) {
      setFavoriteIds(new Set());
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const favorites = await getFavorites(userId);
      setFavoriteIds(new Set(favorites.map((favorite) => favorite.listing.id)));
    } catch (err) {
      console.error("Failed to fetch favorites:", err);
      setError("Failed to load favorites");
      setFavoriteIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refetchFavorites();
  }, [refetchFavorites]);

  const isFavorited = useCallback(
    (listingId: number) => favoriteIds.has(listingId),
    [favoriteIds]
  );

  const addFavorite = useCallback(
    async (listingId: number): Promise<ActionResult> => {
      if (!userId || userId <= 0) {
        return { ok: false, reason: "missing_user" };
      }

      try {
        const res = await addFavoriteRequest(userId, listingId);

        if (res.ok) {
          setFavoriteIds((prev) => new Set(prev).add(listingId));
          return { ok: true };
        }

        if (res.status === 409) {
          return { ok: false, reason: "already_exists" };
        }

        return { ok: false, reason: "request_failed" };
      } catch (err) {
        console.error("Failed to add favorite:", err);
        return { ok: false, reason: "request_failed" };
      }
    },
    [userId]
  );

  const removeFavorite = useCallback(
    async (listingId: number): Promise<ActionResult> => {
      if (!userId || userId <= 0) {
        return { ok: false, reason: "missing_user" };
      }

      try {
        const res = await removeFavoriteRequest(userId, listingId);

        if (res.ok) {
          setFavoriteIds((prev) => {
            const next = new Set(prev);
            next.delete(listingId);
            return next;
          });
          return { ok: true };
        }

        return { ok: false, reason: "request_failed" };
      } catch (err) {
        console.error("Failed to remove favorite:", err);
        return { ok: false, reason: "request_failed" };
      }
    },
    [userId]
  );

  return {
    favoriteIds,
    loading,
    error,
    isFavorited,
    addFavorite,
    removeFavorite,
    refetchFavorites,
  };
}
