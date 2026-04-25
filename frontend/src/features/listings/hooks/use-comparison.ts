import type { Listing } from "@/features/listings/types";
import { useState } from "react";

const MAX_COMPARE = 4;

export function useComparison() {
  const [comparedListings, setComparedListings] = useState<Listing[]>([]);

  const isSelected = (id: string | number) =>
    comparedListings.some((listing) => listing.id === id);

  const addListing = (listing: Listing) => {
    setComparedListings((prev) => {
      if (prev.some((item) => item.id === listing.id)) return prev;
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, listing];
    });
  };

  const removeListing = (id: string | number) => {
    setComparedListings((prev) => prev.filter((listing) => listing.id !== id));
  };

  const clearComparison = () => setComparedListings([]);

  const canAddMore = comparedListings.length < MAX_COMPARE;

  return {
    comparedListings,
    addListing,
    removeListing,
    clearComparison,
    isSelected,
    canAddMore,
    maxCompare: MAX_COMPARE,
  };
}