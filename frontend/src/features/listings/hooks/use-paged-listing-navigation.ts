import { useMemo, useState } from "react";
import type { Listing } from "@/features/listings/types";

type UsePagedListingNavigationParams = {
  listings: Listing[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
};

type UsePagedListingNavigationResult = {
  currentIndex: number;
  currentListing: Listing | null;
  isAtAbsoluteStart: boolean;
  isAtAbsoluteEnd: boolean;
  canGoPrevious: boolean;
  canGoNext: boolean;
  goNext: () => void;
  goPrevious: () => void;
  setCurrentIndex: (index: number) => void;
};

export function usePagedListingNavigation({
  listings,
  currentPage,
  totalPages,
  onPageChange,
  loading = false,
}: UsePagedListingNavigationParams): UsePagedListingNavigationResult {
  const [currentIndex, setCurrentIndex] = useState(0);
  const resolvedCurrentIndex = useMemo(() => {
    if (listings.length === 0) {
      return 0;
    }

    return Math.min(Math.max(currentIndex, 0), listings.length - 1);
  }, [currentIndex, listings.length]);

  const currentListing = useMemo(() => {
    if (listings.length === 0) return null;
    return listings[resolvedCurrentIndex] ?? null;
  }, [listings, resolvedCurrentIndex]);

  const isAtAbsoluteStart = currentPage === 0 && resolvedCurrentIndex === 0;
  const isAtAbsoluteEnd =
    totalPages === 0 ||
    (currentPage === totalPages - 1 &&
      resolvedCurrentIndex === Math.max(listings.length - 1, 0));

  const canGoPrevious = !loading && !isAtAbsoluteStart;
  const canGoNext = !loading && !isAtAbsoluteEnd;

  function goNext() {
    if (loading) return;

    if (resolvedCurrentIndex < listings.length - 1) {
      setCurrentIndex(resolvedCurrentIndex + 1);
      return;
    }

    if (currentPage < totalPages - 1) {
      setCurrentIndex(0);
      onPageChange(currentPage + 1);
    }
  }

  function goPrevious() {
    if (loading) return;

    if (resolvedCurrentIndex > 0) {
      setCurrentIndex(resolvedCurrentIndex - 1);
      return;
    }

    if (currentPage > 0) {
      setCurrentIndex(Number.MAX_SAFE_INTEGER);
      onPageChange(currentPage - 1);
    }
  }

  return {
    currentIndex: resolvedCurrentIndex,
    currentListing,
    isAtAbsoluteStart,
    isAtAbsoluteEnd,
    canGoPrevious,
    canGoNext,
    goNext,
    goPrevious,
    setCurrentIndex: (index: number) => setCurrentIndex(Math.max(index, 0)),
  };
}
