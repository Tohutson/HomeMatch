"use client";

import { useEffect, useState, useCallback } from "react";
import Toast from "@/components/Toast";
import ListingCard from "@/features/listings/components/listing-card";
import NotLoggedInModal from "@/components/NotLoggedInModal";

import { ListingsBanner } from "@/features/listings/components/listings-banner";
import { ListingsHeader } from "@/features/listings/components/listings-header";
import { ListingsPagination } from "@/features/listings/components/listings-pagination";

import type { Listing } from "@/features/listings/types";
import { useListings } from "@/features/listings/hooks/use-listings";
import { useFavorites } from "@/features/favorites/hooks/use-favorites";
import { useFavoriteUndo } from "@/features/favorites/hooks/use-favorite-undo";
import { useFavoritesSync } from "@/features/favorites/hooks/use-favorites-sync";
import { usePagedListingNavigation } from "@/features/listings/hooks/use-paged-listing-navigation";

import { getOrCreateUserId } from "@/lib/userId";
import { enqueueOfflineFavorite } from "@/lib/offline-queue";

const PAGE_SIZE = 12;

export default function ListingsPage() {
  const [currentPage, setCurrentPage] = useState(0);

  const [userId, setUserId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showNotLoggedIn, setShowNotLoggedIn] = useState(false);

  useEffect(() => {
    getOrCreateUserId().then(setUserId).catch(console.error);
  }, []);

  const {
    favoriteIds,
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
    onToast: setToast,
  });

  const { syncingIds, markQueued } = useFavoritesSync({
    refetchFavorites,
    onToast: setToast,
  });

  const { listings, totalPages, loading, error } = useListings({
    page: currentPage,
    size: PAGE_SIZE,
  });

  const {
    currentIndex,
    currentListing,
    canGoPrevious,
    canGoNext,
    goNext,
    goPrevious,
  } = usePagedListingNavigation({
    listings,
    currentPage,
    totalPages,
    onPageChange: setCurrentPage,
    loading,
  });

  const handleFavorite = useCallback(
    async (listing: Listing) => {
      if (!userId) {
        setShowNotLoggedIn(true);
        return;
      }

      if (isFavorited(listing.id)) {
        const result = await removeFavorite(listing.id);

        if (!result.ok) {
          setToast("Failed to remove favorite");
          return;
        }

        setToast("Removed from favorites");
        return;
      }

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        enqueueOfflineFavorite({
          userId,
          listingId: listing.id,
        });
        markQueued(listing.id);
        recordAddedFavorite(listing);
        setToast("Saved offline. Will sync when back online.");
        return;
      }

      const result = await addFavorite(listing.id);

      if (!result.ok) {
        if (result.reason === "already_exists") {
          setToast("Already in favorites");
        } else if (result.reason === "missing_user") {
          setShowNotLoggedIn(true);
        } else {
          setToast("Failed to add favorite");
        }
        return;
      }

      recordAddedFavorite(listing);
      setToast("Added to favorites");
    },
    [
      userId,
      isFavorited,
      addFavorite,
      removeFavorite,
      markQueued,
      recordAddedFavorite,
    ]
  );

  const handleSwipeRight = useCallback(() => {
    if (!currentListing) return;

    if (!favoriteIds.has(currentListing.id)) {
      void handleFavorite(currentListing);
    } else {
      goNext();
    }
  }, [currentListing, favoriteIds, handleFavorite, goNext]);

  const handleSwipeLeft = useCallback(() => goNext(), [goNext]);

  if (loading)
    return (
      <main className="min-h-screen p-8 bg-zinc-50 text-black">
        <h1 className="text-3xl font-bold mb-4">HomeMatch Listings</h1>
        <p>Loading listings...</p>
      </main>
    );

  if (error)
    return (
      <main className="min-h-screen p-8 bg-zinc-50 text-black">
        <h1 className="text-3xl font-bold mb-4">HomeMatch Listings</h1>
        <p>Error: {error}</p>
      </main>
    );

  if (listings.length === 0)
    return (
      <main className="min-h-screen bg-zinc-50 p-8 text-black">
        <h1 className="mb-4 text-3xl font-bold">HomeMatch Listings</h1>
        <p>No listings found.</p>
      </main>
    );

  if (!currentListing) {
    return (
      <main className="min-h-screen bg-zinc-50 p-8 text-black">
        <h1 className="mb-4 text-3xl font-bold">HomeMatch Listings</h1>
        <p>No current listing available.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-8 text-black">
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      {showNotLoggedIn && (
        <NotLoggedInModal
          onDismiss={() => setShowNotLoggedIn(false)}
          onLogIn={() => {
            setShowNotLoggedIn(false);
            getOrCreateUserId().then(setUserId).catch(console.error);
          }}
        />
      )}

      <ListingsHeader favoriteCount={favoriteIds.size} />

      <ListingsBanner
        show={showBanner}
        canUndo={canUndo}
        canRedo={canRedo}
        undoVisible={undoVisible}
        undoTimeLeft={undoTimeLeft}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      <div className="mx-auto max-w-2xl">
        <ListingCard
          listing={currentListing}
          isFavorited={favoriteIds.has(currentListing.id)}
          isSyncing={syncingIds.has(currentListing.id)}
          onFavorite={handleFavorite}
          onSwipeRight={handleSwipeRight}
          onSwipeLeft={handleSwipeLeft}
        />

        <ListingsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          canGoPrevious={canGoPrevious}
          canGoNext={canGoNext}
          onPrevious={goPrevious}
          onNext={goNext}
        />

        <p className="mt-4 text-center text-sm text-zinc-400">
          Swipe right to favorite · Swipe left to skip
        </p>
      </div>
    </main>
  );
}
