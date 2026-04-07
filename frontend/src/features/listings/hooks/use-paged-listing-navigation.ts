import { useEffect, useMemo, useState } from "react";
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
  const [pendingBoundaryDirection, setPendingBoundaryDirection] = useState<
    "next" | "previous" | null
  >(null);

  useEffect(() => {
    if (listings.length === 0) {
      setCurrentIndex(0);
      return;
    }

    if (pendingBoundaryDirection === "next") {
      setCurrentIndex(0);
      setPendingBoundaryDirection(null);
      return;
    }

    if (pendingBoundaryDirection === "previous") {
      setCurrentIndex(Math.max(listings.length - 1, 0));
      setPendingBoundaryDirection(null);
      return;
    }

    if (currentIndex >= listings.length) {
      setCurrentIndex(Math.max(listings.length - 1, 0));
    }
  }, [listings, pendingBoundaryDirection, currentIndex]);

  const currentListing = useMemo(() => {
    if (listings.length === 0) return null;
    return listings[currentIndex] ?? null;
  }, [listings, currentIndex]);

  const isAtAbsoluteStart = currentPage === 0 && currentIndex === 0;
  const isAtAbsoluteEnd =
    totalPages === 0 ||
    (currentPage === totalPages - 1 &&
      currentIndex === Math.max(listings.length - 1, 0));

  const canGoPrevious = !loading && !isAtAbsoluteStart;
  const canGoNext = !loading && !isAtAbsoluteEnd;

  function goNext() {
    if (loading) return;

    if (currentIndex < listings.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    if (currentPage < totalPages - 1) {
      setPendingBoundaryDirection("next");
      onPageChange(currentPage + 1);
    }
  }

  function goPrevious() {
    if (loading) return;

    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      return;
    }

    if (currentPage > 0) {
      setPendingBoundaryDirection("previous");
      onPageChange(currentPage - 1);
    }
  }

  return {
    currentIndex,
    currentListing,
    isAtAbsoluteStart,
    isAtAbsoluteEnd,
    canGoPrevious,
    canGoNext,
    goNext,
    goPrevious,
    setCurrentIndex,
  };
}
