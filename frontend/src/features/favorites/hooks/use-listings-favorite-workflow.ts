import { useCallback } from "react";
import type { Listing } from "@/features/listings/types";
import { useFavorites } from "@/features/favorites/hooks/use-favorites";
import { useFavoriteUndo } from "@/features/favorites/hooks/use-favorite-undo";
import { useFavoritesSync } from "@/features/favorites/hooks/use-favorites-sync";
import { enqueueOfflineFavorite } from "@/lib/offline-queue";

type UseListingsFavoriteWorkflowParams = {
  userId: number | null;
  onToast?: (message: string) => void;
  onRequireLogin?: () => void;
};

type UseListingsFavoriteWorkflowResult = {
  favoriteIds: Set<number>;
  syncingIds: Set<number>;
  loading: boolean;
  error: string | null;
  isFavorited: (listingId: number) => boolean;
  handleFavorite: (listing: Listing) => Promise<void>;
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
  userId,
  onToast,
  onRequireLogin,
}: UseListingsFavoriteWorkflowParams): UseListingsFavoriteWorkflowResult {
  const {
    favoriteIds,
    loading,
    error,
    isFavorited,
    addFavorite,
    removeFavorite,
    refetchFavorites,
  } = useFavorites({ userId });

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
    async (listing: Listing) => {
      if (!userId || userId <= 0) {
        onRequireLogin?.();
        return;
      }

      if (isFavorited(listing.id)) {
        const result = await removeFavorite(listing.id);

        if (!result.ok) {
          if (result.reason === "missing_user") {
            onRequireLogin?.();
          } else {
            onToast?.("Failed to remove favorite");
          }
          return;
        }

        onToast?.("Removed from favorites");
        return;
      }

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        enqueueOfflineFavorite({
          userId,
          listingId: listing.id,
        });

        markQueued(listing.id);
        recordAddedFavorite(listing);
        onToast?.("Saved offline. Will sync when back online.");
        return;
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
        return;
      }

      recordAddedFavorite(listing);
      onToast?.("Added to favorites");
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
