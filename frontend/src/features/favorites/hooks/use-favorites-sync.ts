import { useCallback, useEffect, useState } from "react";
import { flushOfflineQueue, getOfflineQueue } from "@/lib/offline-queue";
import type { RefetchFavoritesOptions } from "./use-favorites";

type UseFavoritesSyncParams = {
  refetchFavorites: (options?: RefetchFavoritesOptions) => Promise<void>;
  onToast?: (message: string) => void;
};

type UseFavoritesSyncResult = {
  syncingIds: Set<number>;
  markQueued: (listingId: number) => void;
};

export function useFavoritesSync({
  refetchFavorites,
  onToast,
}: UseFavoritesSyncParams): UseFavoritesSyncResult {
  const [syncingIds, setSyncingIds] = useState<Set<number>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);

  const markQueued = useCallback((listingId: number) => {
    setSyncingIds((prev) => new Set(prev).add(listingId));
  }, []);

  const syncOfflineFavorites = useCallback(async () => {
    if (isSyncing) return;

    const queue = getOfflineQueue();
    if (!queue.length) return;

    try {
      setIsSyncing(true);
      setSyncingIds(new Set(queue.map((item) => item.listingId)));

      const syncedCount = await flushOfflineQueue();
      await refetchFavorites({ background: true });

      setSyncingIds(new Set());

      if (syncedCount > 0) {
        onToast?.("Offline favorites synced");
      }
    } catch (err) {
      console.error("Failed to sync offline favorites:", err);
      setSyncingIds(new Set());
      onToast?.("Failed to sync offline favorites");
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refetchFavorites, onToast]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function handleOnline() {
      void syncOfflineFavorites();
    }

    window.addEventListener("online", handleOnline);

    if (typeof navigator !== "undefined" && navigator.onLine) {
      void syncOfflineFavorites();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [syncOfflineFavorites]);

  return {
    syncingIds,
    markQueued,
  };
}
