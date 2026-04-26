"use client";

import Toast from "@/components/Toast";
import ComparisonBar from "@/features/listings/components/comparison-bar";
import ListingCard from "@/features/listings/components/listing-card";
import { useComparison } from "@/features/listings/context/comparison-context";
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import ListingFilters from "../components/listing-filters";

import { ListingsBanner } from "@/features/listings/components/listings-banner";
import { ListingsPagination } from "@/features/listings/components/listings-pagination";

import { useAuth } from "@/features/auth/context/auth-context";
import { useListingsFavoriteWorkflow } from "@/features/favorites/hooks/use-listings-favorite-workflow";
import { useListings } from "@/features/listings/hooks/use-listings";
import { usePagedListingNavigation } from "@/features/listings/hooks/use-paged-listing-navigation";
import {
  STANDARD_LISTING_SORT_OPTIONS,
  type Listing,
  type ListingSortOption,
} from "@/features/listings/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useListingFilters } from "../hooks/use-listing-filters";

const PAGE_SIZE = 12;


function isListingSortOption(value: string | null): value is ListingSortOption {
  return (
    value === "RECOMMENDED" ||
    (value !== null && STANDARD_LISTING_SORT_OPTIONS.some((option) => option.value === value))
  );
}

export default function ListingsPage() {
  const searchParams = useSearchParams();
  const locationParam = searchParams?.get("location") ?? "";
  const rawSortParam = searchParams?.get("sort") ?? null;
  const initialSort = isListingSortOption(rawSortParam) ? rawSortParam : null;

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
  const [recommendationSessionResetKey, setRecommendationSessionResetKey] = useState(0);
  const hasMountedSortEffect = useRef(false);
  const { isAuthenticated } = useAuth();
  useEffect(() => {
    setSort(initialSort);

    if (hasMountedSortEffect.current) {
      setRecommendationSessionResetKey((key) => key + 1);
    } else {
      hasMountedSortEffect.current = true;
    }
  }, [initialSort]);
  const [toast, setToast] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const {
    favoriteIds,
    syncingIds,
    handleSwipeFavorite,
    handleFavorite,
    handleUndo,
    handleRedo,
    handleDismissBanner,
    pendingFavorite,
    canUndo,
    canRedo,
    undoVisible,
    undoTimeLeft,
    showBanner,
  } = useListingsFavoriteWorkflow({
    onToast: setToast,
    onRequireLogin: () => {
      const nextPath = searchParams?.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname ?? "/listings";

      const params = new URLSearchParams();
      params.set("next", nextPath);
      router.push(`/login?${params.toString()}`);
    },
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

  const {
    listings,
    totalPages,
    totalElements,
    loading,
    error,
    usingRecommendationFallback,
    recommendationMessage,
  } = useListings({
    page: currentPage,
    size: PAGE_SIZE,
    filters: appliedFilters,
    sort,
    recommendationSessionResetKey,
  });

  const {
    comparedListings,
    addListing,
    removeListing,
    clearComparison,
    isSelected,
    canAddMore,
  } = useComparison();

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

  useEffect(() => {
    if (!isAuthenticated && sort === "RECOMMENDED") {
      setSort(null);
      setCurrentPage(0);
      setCurrentIndex(0);
    }

    if (!isAuthenticated) {
      setRecommendationSessionResetKey((key) => key + 1);
    }
  }, [isAuthenticated, sort, setCurrentIndex]);

  const handleApplyFilters = useCallback(() => {
    setCurrentPage(0);
    setCurrentIndex(0);
    setRecommendationSessionResetKey((key) => key + 1);
    applyFilters();
  }, [applyFilters, setCurrentIndex]);

  const handleSortChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value as ListingSortOption | "";
      const nextSort = value === "" ? null : value;
  
      setSort(nextSort);
      setCurrentPage(0);
      setCurrentIndex(0);
      setRecommendationSessionResetKey((key) => key + 1);
  
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
    currentIndex < listings.length - 1 ? listings[currentIndex + 1] : null;
  const isInitialLoading = loading && listings.length === 0;
  const hasNoListings = listings.length === 0;
  const hasExhaustedListings = listings.length > 0 && !currentListing;

  const handleClearFilters = useCallback(() => {
    setCurrentPage(0);
    setCurrentIndex(0);
    setSort(null);
    setRecommendationSessionResetKey((key) => key + 1);
    clearFilters();
  
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete("sort");
    params.delete("location");
  
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : (pathname ?? "/listings"));
  }, [clearFilters, pathname, router, searchParams, setCurrentIndex]);

  const handleToggleCompare = useCallback(
    (listing: Listing) => {
      if (isSelected(listing.id)) {
        removeListing(listing.id);
        return;
      }

      addListing(listing);
    },
    [addListing, isSelected, removeListing]
  );

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

      <ListingsBanner
        show={showBanner}
        pendingFavorite={pendingFavorite}
        canUndo={canUndo}
        canRedo={canRedo}
        undoVisible={undoVisible}
        undoTimeLeft={undoTimeLeft}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onDismiss={handleDismissBanner}
      />

      <ComparisonBar
        selectedCount={comparedListings.length}
        onClear={clearComparison}
      />

      <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:grid lg:grid-cols-[320px_minmax(0,1fr)_280px] lg:items-start">
        <div className="order-1">
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
        </div>

        <aside className="order-2 lg:order-3 lg:sticky lg:top-24">
          <div className="rounded-[28px] border border-zinc-200 bg-white p-4 shadow-sm">
            <label
              htmlFor="listing-sort"
              className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400"
            >
              Sort Results
            </label>
            <div className="relative">
              <select
                id="listing-sort"
                value={sort ?? ""}
                onChange={handleSortChange}
                className="w-full appearance-none rounded-full border border-zinc-300 bg-zinc-50 px-4 py-3 pr-11 text-sm font-medium text-zinc-800 outline-none transition focus:border-zinc-400 focus:bg-white"
              >
                <option value="">Default</option>
                {isAuthenticated && (
                  <option value="RECOMMENDED">Recommended for you</option>
                )}
                {STANDARD_LISTING_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-zinc-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.511a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </div>
            {sort === "RECOMMENDED" && usingRecommendationFallback && (
              <p className="mt-3 text-sm leading-5 text-zinc-500">
                {recommendationMessage ??
                  "Like a few homes to personalize your recommendations."}
              </p>
            )}
          </div>
        </aside>

        <div className="order-3 mx-auto w-full max-w-2xl lg:order-2">
          {hasNoListings ? (
            <div className="w-full rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
              <h2 className="mb-2 text-xl font-semibold">
                No homes found matching your criteria
              </h2>
              <p className="text-zinc-500">
                Try changing or clearing your filters
              </p>
            </div>
          ) : hasExhaustedListings || !currentListing ? (
            <div className="w-full rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
              <h2 className="mb-2 text-xl font-semibold">
                You&apos;ve reached the end of these matches
              </h2>
              <p className="text-zinc-500">
                Try different filters or go back to revisit the last home.
              </p>
            </div>
          ) : (
            <div className="relative w-full">
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
