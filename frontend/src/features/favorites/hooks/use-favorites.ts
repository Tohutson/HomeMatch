import { useCallback, useEffect, useRef, useState } from "react";
import {
  addFavorite as addFavoriteRequest,
  getFavorites,
  removeFavorite as removeFavoriteRequest,
} from "@/features/favorites/api";
import { isAbortError } from "@/lib/is-abort-error";
import type { FavoriteRecord } from "@/features/favorites/types";

type UseFavoritesParams = {
  userId: number | null;
  enabled?: boolean;
};

type ActionResult =
  | { ok: true; favorite?: FavoriteRecord }
  | {
      ok: false;
      reason: "missing_user" | "already_exists" | "request_failed";
    };

export type RefetchFavoritesOptions = {
  background?: boolean;
};

export type UseFavoritesResult = {
  favorites: FavoriteRecord[];
  favoriteIds: Set<number>;
  loading: boolean;
  error: string | null;
  isFavorited: (listingId: number) => boolean;
  setFavoriteOptimistic: (listingId: number, favorited: boolean) => void;
  addFavorite: (listingId: number) => Promise<ActionResult>;
  removeFavorite: (listingId: number) => Promise<ActionResult>;
  refetchFavorites: (options?: RefetchFavoritesOptions) => Promise<void>;
};

export type { ActionResult };

function mergeFavoriteRecord(
  favorites: FavoriteRecord[],
  favorite: FavoriteRecord
): FavoriteRecord[] {
  const existingIndex = favorites.findIndex(
    (entry) => entry.listing.id === favorite.listing.id
  );

  if (existingIndex === -1) {
    return [favorite, ...favorites];
  }

  const next = [...favorites];
  next[existingIndex] = favorite;
  return next;
}

export function useFavorites({
  userId,
  enabled = true,
}: UseFavoritesParams): UseFavoritesResult {
  const [favorites, setFavorites] = useState<FavoriteRecord[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const activeRequestRef = useRef<AbortController | null>(null);

  const refetchFavorites = useCallback(
    async ({ background = false }: RefetchFavoritesOptions = {}) => {
      activeRequestRef.current?.abort();

      if (!enabled) {
        return;
      }

      if (!userId || userId <= 0) {
        setFavorites([]);
        setFavoriteIds(new Set());
        setError(null);
        setLoading(false);
        return;
      }

      const controller = new AbortController();
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      activeRequestRef.current = controller;

      try {
        if (!background) {
          setLoading(true);
          setError(null);
        }

        const nextFavorites = await getFavorites(userId, controller.signal);

        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }

        setFavorites(nextFavorites);
        setFavoriteIds(
          new Set(nextFavorites.map((favorite) => favorite.listing.id))
        );
        setError(null);
      } catch (err) {
        if (isAbortError(err)) {
          return;
        }

        console.error("Failed to fetch favorites:", err);

        if (requestId !== requestIdRef.current) {
          return;
        }

        if (!background) {
          setFavorites([]);
          setFavoriteIds(new Set());
          setError("Failed to load favorites");
        }
      } finally {
        if (requestId === requestIdRef.current && !background) {
          setLoading(false);
        }

        if (activeRequestRef.current === controller) {
          activeRequestRef.current = null;
        }
      }
    },
    [enabled, userId]
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void refetchFavorites();

    return () => {
      activeRequestRef.current?.abort();
    };
  }, [enabled, refetchFavorites]);

  const isFavorited = useCallback(
    (listingId: number) => favoriteIds.has(listingId),
    [favoriteIds]
  );

  const setFavoriteOptimistic = useCallback(
    (listingId: number, favorited: boolean) => {
      setFavoriteIds((prev) => {
        const next = new Set(prev);

        if (favorited) {
          next.add(listingId);
        } else {
          next.delete(listingId);
        }

        return next;
      });

      if (!favorited) {
        setFavorites((prev) =>
          prev.filter((favorite) => favorite.listing.id !== listingId)
        );
      }
    },
    []
  );

  const addFavorite = useCallback(
    async (listingId: number): Promise<ActionResult> => {
      if (!userId || userId <= 0) {
        return { ok: false, reason: "missing_user" };
      }

      try {
        const res = await addFavoriteRequest(userId, listingId);

        if (res.ok) {
          const favorite = (await res.json()) as FavoriteRecord;

          setFavorites((prev) => mergeFavoriteRecord(prev, favorite));
          setFavoriteIds((prev) => {
            const next = new Set(prev);
            next.add(listingId);
            return next;
          });

          return { ok: true, favorite };
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
          setFavorites((prev) =>
            prev.filter((favorite) => favorite.listing.id !== listingId)
          );
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
    favorites,
    favoriteIds,
    loading,
    error,
    isFavorited,
    setFavoriteOptimistic,
    addFavorite,
    removeFavorite,
    refetchFavorites,
  };
}
