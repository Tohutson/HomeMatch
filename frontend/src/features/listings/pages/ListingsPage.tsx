"use client";

import NotLoggedInModal from "@/components/NotLoggedInModal";
import Toast from "@/components/Toast";
import ListingCard from "@/features/listings/components/listing-card";
import ListingFilters from "../components/listing-filters";
import { useCallback, useEffect, useState } from "react";

import { ListingsBanner } from "@/features/listings/components/listings-banner";
import { ListingsPagination } from "@/features/listings/components/listings-pagination";

import { useFavoritesContext } from "@/features/favorites/context/favorites-context";
import { useListingsFavoriteWorkflow } from "@/features/favorites/hooks/use-listings-favorite-workflow";
import { useListingFilters } from "../hooks/use-listing-filters";
import { useListings } from "@/features/listings/hooks/use-listings";
import { usePagedListingNavigation } from "@/features/listings/hooks/use-paged-listing-navigation";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const PAGE_SIZE = 12;

export default function ListingsPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [showNotLoggedIn, setShowNotLoggedIn] = useState(false);
  const { ensureUserId } = useFavoritesContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const {
    favoriteIds,
    syncingIds,
    handleFavorite,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    undoVisible,
    undoTimeLeft,
    showBanner,
  } = useListingsFavoriteWorkflow({
    onToast: setToast,
    onRequireLogin: () => setShowNotLoggedIn(true),
  });

  const {
    draftFilters,
    appliedFilters,
    updateDraftFilter,
    applyFilters,
    clearFilters,
    validationErrors,
    isApplyDisabled,
    isClearDisabled,
    resetFiltersForLocation,
  } = useListingFilters();

  const locationParam = searchParams?.get("location") ?? "";

  const handleApplyFilters = useCallback(() => {
    setCurrentPage(0);
    setCurrentIndex(0);
    applyFilters();
  }, [applyFilters]);

  const { listings, totalPages, totalElements, loading, error } = useListings({
    page: currentPage,
    size: PAGE_SIZE,
    filters: appliedFilters,
  });

  const {
    currentIndex,
    currentListing,
    canGoPrevious,
    canGoNext,
    goNext,
    goPrevious,
    setCurrentIndex,
  } = usePagedListingNavigation({
    listings,
    currentPage,
    totalPages,
    onPageChange: setCurrentPage,
    loading,
  });

  const nextListing =
    currentIndex < listings.length - 1 ? listings[currentIndex + 1] : null;

  const handleClearFilters = useCallback(() => {
    setCurrentPage(0);
    setCurrentIndex(0);
    clearFilters();
    router.replace(pathname ?? "/listings");
  }, [clearFilters, pathname, router, setCurrentIndex]);

  useEffect(() => {
    resetFiltersForLocation(locationParam);

    setCurrentPage(0);
    setCurrentIndex(0);
  }, [locationParam, resetFiltersForLocation, setCurrentIndex]);

  const handleSwipeRight = useCallback(async () => {
    if (!currentListing) return false;

    if (favoriteIds.has(currentListing.id)) {
      goNext();
      return true;
    }

    const result = await handleFavorite(currentListing);

    if (!result.ok) {
      return false;
    }

    goNext();
    return true;
  }, [currentListing, favoriteIds, handleFavorite, goNext]);

  const handleSwipeLeft = useCallback(() => {
    goNext();
    return true;
  }, [goNext]);

  if (loading)
    return (
      <main className="min-h-screen p-8 bg-zinc-50 text-black">
        <p>Loading listings...</p>
      </main>
    );

  if (error)
    return (
      <main className="min-h-screen p-8 bg-zinc-50 text-black">
        <p>Error: {error}</p>
      </main>
    );

  return (
    <main className="min-h-screen bg-zinc-50 p-8 text-black">
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      {showNotLoggedIn && (
        <NotLoggedInModal
          onDismiss={() => setShowNotLoggedIn(false)}
          onLogIn={() => {
            setShowNotLoggedIn(false);
            void ensureUserId();
          }}
        />
      )}

      <ListingsBanner
        show={showBanner}
        canUndo={canUndo}
        canRedo={canRedo}
        undoVisible={undoVisible}
        undoTimeLeft={undoTimeLeft}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        <ListingFilters
          filters={draftFilters}
          onFilterChange={updateDraftFilter}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          validationErrors={validationErrors}
          isApplyDisabled={isApplyDisabled}
          isClearDisabled={isClearDisabled}
          matchCount={totalElements}
        />

        <div className="mx-auto w-full max-w-3xl">
          {listings.length === 0 || !currentListing ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
              <h2 className="mb-2 text-xl font-semibold">
                No homes found matching your criteria
              </h2>
              <p className="text-zinc-500">
                Try changing or clearing your filters
              </p>
            </div>
          ) : (
            <div className="relative">
              {nextListing && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-0"
                >
                  <ListingCard
                    key={`preview-${nextListing.id}`}
                    listing={nextListing}
                    interactive={false}
                  />
                </div>
              )}

              <div className="relative z-10">
                <ListingCard
                  key={currentListing.id}
                  listing={currentListing}
                  isFavorited={favoriteIds.has(currentListing.id)}
                  isSyncing={syncingIds.has(currentListing.id)}
                  onFavorite={handleFavorite}
                  onSwipeRight={handleSwipeRight}
                  onSwipeLeft={handleSwipeLeft}
                />
              </div>
            </div>
          )}

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
      </div>
    </main>
  );
}
