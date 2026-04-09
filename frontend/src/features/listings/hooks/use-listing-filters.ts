import type { ListingFilters } from "@/features/listings/types";
import { useMemo, useState } from "react";

type DraftListingFilters = {
    minPrice: string;
    maxPrice: string;
    minBeds: string;
    minBaths: string;
    minSqft: string;
    maxSqft: string;
};

const DEFAULT_DRAFT_FILTERS: DraftListingFilters = {
  minPrice: "",
  maxPrice: "",
  minBeds: "",
  minBaths: "",
  minSqft: "",
  maxSqft: "",
};

const DEFAULT_APPLIED_FILTERS: ListingFilters = {
    minPrice: undefined,
    maxPrice: undefined,
    minBeds: undefined,
    minBaths: undefined,
    minSqft: undefined,
    maxSqft: undefined,
    };

function toNumberOrUndefined(value: string): number | undefined {
    if (value.trim() === "") {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
}

export function useListingFilters() {
  const [draftFilters, setDraftFilters] = useState<DraftListingFilters>(DEFAULT_DRAFT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<ListingFilters>(DEFAULT_APPLIED_FILTERS);

  const updateDraftFilter = (key: keyof DraftListingFilters, value: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const applyFilters = () => {
    setAppliedFilters({
        minPrice: toNumberOrUndefined(draftFilters.minPrice),
        maxPrice: toNumberOrUndefined(draftFilters.maxPrice),
        minBeds: toNumberOrUndefined(draftFilters.minBeds),
        minBaths: toNumberOrUndefined(draftFilters.minBaths),
        minSqft: toNumberOrUndefined(draftFilters.minSqft),
        maxSqft: toNumberOrUndefined(draftFilters.maxSqft),
    });
};

  const clearFilters = () => {
    setDraftFilters(DEFAULT_DRAFT_FILTERS);
    setAppliedFilters(DEFAULT_APPLIED_FILTERS);
  };

  const hasActiveFilters = useMemo(() => {
    return Object.values(appliedFilters).some((value) => value !== undefined);
  }, [appliedFilters]);

  return {
    draftFilters,
    updateDraftFilter,
    appliedFilters,
    applyFilters,
    clearFilters,
    hasActiveFilters,
  };
}