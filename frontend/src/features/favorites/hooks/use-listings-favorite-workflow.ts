import { useCallback } from "react";
import type { Listing } from "@/features/listings/types";
import { useFavoritesContext } from "@/features/favorites/context/favorites-context";
import { useFavoriteUndo } from "@/features/favorites/hooks/use-favorite-undo";
import { useFavoritesSync } from "@/features/favorites/hooks/use-favorites-sync";
import { enqueueOfflineFavorite } from "@/lib/offline-queue";
import type { ActionResult } from "@/features/favorites/hooks/use-favorites";

type UseListingsFavoriteWorkflowParams = {
  onToast?: (message: string) => void;
  onRequireLogin?: () => void;
};

type UseListingsFavoriteWorkflowResult = {
  favoriteIds: Set<number>;
  syncingIds: Set<number>;
  loading: boolean;
  error: string | null;
  isFavorited: (listingId: number) => boolean;
  handleSwipeFavorite: (listing: Listing) => boolean;
  handleFavorite: (listing: Listing) => Promise<ActionResult>;
  handleUndo: () => Promise<void>;
  handleRedo: () => Promise<void>;
  pendingFavorite: boolean;
  canUndo: boolean;
  canRedo: boolean;
  undoVisible: boolean;
  undoTimeLeft: number;
  showBanner: boolean;
  refetchFavorites: () => Promise<void>;
};

export function useListingsFavoriteWorkflow({
  onToast,
  onRequireLogin,
}: UseListingsFavoriteWorkflowParams): UseListingsFavoriteWorkflowResult {
  const {
    userId,
    favoriteIds,
    loading,
    error,
    isFavorited,
    setFavoriteOptimistic,
    addFavorite,
    removeFavorite,
    refetchFavorites,
  } = useFavoritesContext();

  const {
    recordPendingFavorite,
    confirmPendingFavorite,
    discardPendingFavorite,
    handleUndo,
    handleRedo,
    pendingFavorite,
    canUndo,
    canRedo,
    undoVisible,
    undoTimeLeft,
    showBanner,
  } = useFavoriteUndo({
    addFavorite,
    removeFavorite,
    onToast,
  });

  const { syncingIds, markQueued } = useFavoritesSync({
    refetchFavorites,
    onToast,
  });

  const startFavoriteAdd = useCallback(
    (listing: Listing): ActionResult => {
      if (!userId || userId <= 0) {
        onRequireLogin?.();
        return { ok: false, reason: "missing_user" };
      }

      if (isFavorited(listing.id)) {
        return { ok: true };
      }

      setFavoriteOptimistic(listing.id, true);
      recordPendingFavorite(listing);

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        enqueueOfflineFavorite({
          userId,
          listingId: listing.id,
        });

        markQueued(listing.id);
        confirmPendingFavorite(listing.id);
        onToast?.("Saved offline. Will sync when back online.");
        return { ok: true };
      }

      void addFavorite(listing.id).then((result) => {
        if (result.ok || result.reason === "already_exists") {
          confirmPendingFavorite(listing.id);
          return;
        }

        setFavoriteOptimistic(listing.id, false);
        discardPendingFavorite(listing.id);

        if (result.reason === "missing_user") {
          onRequireLogin?.();
        } else {
          onToast?.("Failed to add favorite");
        }
      });

      return { ok: true };
    },
    [
      userId,
      isFavorited,
      setFavoriteOptimistic,
      recordPendingFavorite,
      markQueued,
      confirmPendingFavorite,
      addFavorite,
      discardPendingFavorite,
      onRequireLogin,
      onToast,
    ]
  );

  const handleSwipeFavorite = useCallback(
    (listing: Listing) => startFavoriteAdd(listing).ok,
    [startFavoriteAdd]
  );

  const handleFavorite = useCallback(
    async (listing: Listing): Promise<ActionResult> => {
      if (!userId || userId <= 0) {
        onRequireLogin?.();
        return { ok: false, reason: "missing_user" };
      }

      if (isFavorited(listing.id)) {
        const result = await removeFavorite(listing.id);

        if (!result.ok) {
          if (result.reason === "missing_user") {
            onRequireLogin?.();
          } else {
            onToast?.("Failed to remove favorite");
          }
          return result;
        }

        onToast?.("Removed from favorites");
        return result;
      }

      return startFavoriteAdd(listing);
    },
    [
      userId,
      isFavorited,
      removeFavorite,
      startFavoriteAdd,
      onToast,
      onRequireLogin,
    ]
  );

  return {
    favoriteIds,
    syncingIds,
    loading,
    error,
    isFavorited,
    handleSwipeFavorite,
    handleFavorite,
    handleUndo,
    handleRedo,
    pendingFavorite,
    canUndo,
    canRedo,
    undoVisible,
    undoTimeLeft,
    showBanner,
    refetchFavorites,
  };
}
