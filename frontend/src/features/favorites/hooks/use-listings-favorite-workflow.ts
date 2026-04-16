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
  handleFavorite: (listing: Listing) => Promise<ActionResult>;
  handleUndo: () => Promise<void>;
  handleRedo: () => Promise<void>;
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
    addFavorite,
    removeFavorite,
    refetchFavorites,
  } = useFavoritesContext();

  const {
    recordAddedFavorite,
    handleUndo,
    handleRedo,
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

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        enqueueOfflineFavorite({
          userId,
          listingId: listing.id,
        });

        markQueued(listing.id);
        recordAddedFavorite(listing);
        onToast?.("Saved offline. Will sync when back online.");
        return { ok: true };
      }

      const result = await addFavorite(listing.id);

      if (!result.ok) {
        if (result.reason === "already_exists") {
          onToast?.("Already in favorites");
        } else if (result.reason === "missing_user") {
          onRequireLogin?.();
        } else {
          onToast?.("Failed to add favorite");
        }
        return result;
      }

      recordAddedFavorite(listing);
      onToast?.("Added to favorites");
      return result;
    },
    [
      userId,
      isFavorited,
      addFavorite,
      removeFavorite,
      markQueued,
      recordAddedFavorite,
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
    handleFavorite,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    undoVisible,
    undoTimeLeft,
    showBanner,
    refetchFavorites,
  };
}
