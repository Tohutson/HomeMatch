"use client";

import NotLoggedInModal from "@/components/NotLoggedInModal";
import Toast from "@/components/Toast";
import ListingCard from "@/features/listings/components/listing-card";
import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import ListingFilters from "../components/listing-filters";

import { ListingsBanner } from "@/features/listings/components/listings-banner";
import { ListingsPagination } from "@/features/listings/components/listings-pagination";

import { useFavoritesContext } from "@/features/favorites/context/favorites-context";
import { useListingsFavoriteWorkflow } from "@/features/favorites/hooks/use-listings-favorite-workflow";
import { useComparison } from "@/features/listings/context/comparison-context";
import { useListings } from "@/features/listings/hooks/use-listings";
import { usePagedListingNavigation } from "@/features/listings/hooks/use-paged-listing-navigation";
import { type Listing, type ListingSortOption } from "@/features/listings/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { isListingSortOption, sortListings } from "../api";
import ComparisonBar from "../components/comparison-bar";
import { useListingFilters } from "../hooks/use-listing-filters";


const PAGE_SIZE = 12;

export default function ListingsPage() {
  const searchParams = useSearchParams();
  const locationParam = searchParams?.get("location") ?? "";
  const rawSortParam = searchParams?.get("sort") ?? null;
  const initialSort = rawSortParam && isListingSortOption(rawSortParam) ? rawSortParam : null;

  return (
    <ListingsPageContent
      key={locationParam}
      locationParam={locationParam}
      initialSort={initialSort}
    />
  );
}

function ListingsPageContent({
  locationParam,
  initialSort,
}: {
  locationParam: string;
  initialSort: ListingSortOption | null;
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const [sort, setSort] = useState<ListingSortOption | null>(initialSort);

  useEffect(() => {
    setSort(initialSort);
  }, [initialSort]);
  const [toast, setToast] = useState<string | null>(null);
  const [showNotLoggedIn, setShowNotLoggedIn] = useState(false);
  const { ensureUserId } = useFavoritesContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const {
    favoriteIds,
    syncingIds,
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
  } = useListingFilters(locationParam);

  const { listings, totalPages, totalElements, loading, error } = useListings({
    page: currentPage,
    size: PAGE_SIZE,
    filters: appliedFilters,
    sort,
  });

  const sortedListings = useMemo(() => {
    const result = sortListings(listings, sort);
    console.log(
      "SORT:",
      sort,
      result.map((listing) => ({
        id: listing.id,
        price: listing.price,
        sqft: listing.sqft,
        energy: listing.energyStarScore,
      }))
    );
    return result;
  }, [listings, sort]);

  const {
    currentIndex,
    currentListing,
    canGoPrevious,
    canGoNext,
    goNext,
    goPrevious,
    setCurrentIndex,
  } = usePagedListingNavigation({
    listings: sortedListings,
    currentPage,
    totalPages,
    onPageChange: setCurrentPage,
    loading,
  });

  const handleApplyFilters = useCallback(() => {
    setCurrentPage(0);
    setCurrentIndex(0);
    applyFilters();
  }, [applyFilters, setCurrentIndex]);

  const handleSortChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value as ListingSortOption | "";
      const nextSort = value === "" ? null : value;
  
      setSort(nextSort);
      setCurrentPage(0);
      setCurrentIndex(0);
  
      const params = new URLSearchParams(searchParams?.toString() ?? "");
  
      if (nextSort) {
        params.set("sort", nextSort);
      } else {
        params.delete("sort");
      }
  
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : (pathname ?? "/listings"));
    },
    [pathname, router, searchParams, setCurrentIndex]
  );

  const nextListing =
    currentIndex < sortedListings.length - 1 ? sortedListings[currentIndex + 1] : null;
  const isInitialLoading = loading && sortedListings.length === 0;
  const hasNoListings = sortedListings.length === 0;
  const hasExhaustedListings = sortedListings.length > 0 && !currentListing;

  const handleClearFilters = useCallback(() => {
    setCurrentPage(0);
    setCurrentIndex(0);
    setSort(null);
    clearFilters();
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete("sort");
    params.delete("location");
  
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : (pathname ?? "/listings"));
  }, [clearFilters, pathname, router, searchParams, setCurrentIndex]);

  const {
    comparedListings,
    addListing,
    removeListing,
    clearComparison,
    isSelected,
    canAddMore,
  } = useComparison();

  const handleToggleCompare = useCallback((listing: Listing) => {
    if (isSelected(listing.id)) {
      removeListing(listing.id);
    } else {
      addListing(listing);
    }
  }, [isSelected, removeListing, addListing]);

  const handleSwipeRight = useCallback(async () => {
    if (!currentListing) return false;

    if (favoriteIds.has(currentListing.id)) {
      goNext();
      return true;
    }

    const accepted = handleSwipeFavorite(currentListing);

    if (!accepted) {
      return false;
    }

    goNext();
    return true;
  }, [currentListing, favoriteIds, handleSwipeFavorite, goNext]);

  const handleSwipeLeft = useCallback(() => {
    goNext();
    return true;
  }, [goNext]);

  if (isInitialLoading)
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
        pendingFavorite={pendingFavorite}
        canUndo={canUndo}
        canRedo={canRedo}
        undoVisible={undoVisible}
        undoTimeLeft={undoTimeLeft}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {comparedListings.length > 0 && (
        <div className="mx-auto mb-6 flex max-w-7xl items-center justify-between rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">
          <div>
            <p className="text-sm font-medium text-zinc-900">
              {comparedListings.length} of 4 homes selected for comparison
            </p>
            <p className="text-sm text-zinc-500">
              Select up to 4 homes, then build your comparison page later
            </p>
          </div>
          <ComparisonBar
            selectedCount={comparedListings.length}
            onClear={clearComparison}
          />
          <button
            type="button"
            onClick={clearComparison}
            className="rounded-full bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-300"
          >
            Clear
          </button>
        </div>
      )}

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
          <div className="mb-4 flex items-center justify-end">
            <label htmlFor="listing-sort" className="mr-3 text-sm font-medium text-zinc-700">
              Sort by
            </label>
            <select
              id="listing-sort"
              value={sort ?? ""}
              onChange={handleSortChange}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Recommended</option>
              <option value="PRICE_ASC">Price: Low to High</option>
              <option value="PRICE_DESC">Price: High to Low</option>
              <option value="SIZE_ASC">Size: Small to Large</option>
              <option value="SIZE_DESC">Size: Large to Small</option>
              <option value="ENERGY_DESC">Energy Score: High to Low</option>
            </select>
          </div>
            {hasNoListings ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
                <h2 className="mb-2 text-xl font-semibold">
                  No homes found matching your criteria
                </h2>
                <p className="text-zinc-500">
                  Try changing or clearing your filters
                </p>
              </div>
            ) : hasExhaustedListings || !currentListing ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
              <h2 className="mb-2 text-xl font-semibold">
                You&apos;ve reached the end of these matches
              </h2>
              <p className="text-zinc-500">
                Try different filters or go back to revisit the last home.
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
                isCompared={isSelected(currentListing.id)}
                onToggleCompare={handleToggleCompare}
                disableCompare={!isSelected(currentListing.id) && !canAddMore}
              />
              </div>

              {loading && (
                <div className="pointer-events-none absolute inset-0 z-20 rounded-[28px] bg-white/60 backdrop-blur-[2px]">
                  <div className="absolute top-4 right-4 rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-500 shadow-sm">
                    Loading more homes...
                  </div>
                </div>
              )}
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
            {hasExhaustedListings
              ? "Adjust your filters to discover more homes"
              : "Swipe right to favorite · Swipe left to skip"}
          </p>
        </div>
      </div>
    </main>
  );
}
