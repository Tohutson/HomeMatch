"use client";

import type { Listing } from "@/features/listings/types";
import { createContext, useContext, useMemo, useState } from "react";

type ComparisonContextValue = {
  comparedListings: Listing[];
  addListing: (listing: Listing) => void;
  removeListing: (id: string | number) => void;
  clearComparison: () => void;
  isSelected: (id: string | number) => boolean;
  canAddMore: boolean;
  maxCompare: number;
};

const MAX_COMPARE = 4;

const ComparisonContext = createContext<ComparisonContextValue | undefined>(
  undefined
);

export function ComparisonProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [comparedListings, setComparedListings] = useState<Listing[]>([]);

  const addListing = (listing: Listing) => {
    setComparedListings((prev) => {
      if (prev.some((item) => item.id === listing.id)) return prev;
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, listing];
    });
  };

  const removeListing = (id: string | number) => {
    setComparedListings((prev) =>
      prev.filter((listing) => listing.id !== id)
    );
  };

  const clearComparison = () => {
    setComparedListings([]);
  };

  const isSelected = (id: string | number) =>
    comparedListings.some((listing) => listing.id === id);

  const canAddMore = comparedListings.length < MAX_COMPARE;

  const value = useMemo(
    () => ({
      comparedListings,
      addListing,
      removeListing,
      clearComparison,
      isSelected,
      canAddMore,
      maxCompare: MAX_COMPARE,
    }),
    [comparedListings, canAddMore]
  );

  return (
    <ComparisonContext.Provider value={value}>
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);

  if (!context) {
    throw new Error("useComparison must be used within ComparisonProvider");
  }

  return context;
}