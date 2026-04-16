import type { ListingFilters } from "@/features/listings/types";
import { useCallback, useMemo, useState } from "react";
import { DraftListingFilters } from "@/features/listings/types";

const DEFAULT_DRAFT_FILTERS: DraftListingFilters = {
  location: "",
  minPrice: "",
  maxPrice: "",
  minBeds: "",
  minBaths: "",
  minSqft: "",
  maxSqft: "",
  minEnergyStarScore: "",
};

const DEFAULT_APPLIED_FILTERS: ListingFilters = {
  location: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  minBeds: undefined,
  minBaths: undefined,
  minSqft: undefined,
  maxSqft: undefined,
  minEnergyStarScore: undefined,
};

const NUMERIC_FILTER_KEYS = new Set<keyof DraftListingFilters>([
  "minPrice",
  "maxPrice",
  "minBeds",
  "minBaths",
  "minSqft",
  "maxSqft",
  "minEnergyStarScore",
]);

function toNumberOrUndefined(value: string): number | undefined {
  if (value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function toLocationOrUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function normalizeDraftFilterValue(
  key: keyof DraftListingFilters,
  value: string
): string {
  if (!NUMERIC_FILTER_KEYS.has(key)) {
    return value;
  }

  const digitsOnly = value.replace(/\D+/g, "");

  if (digitsOnly === "") {
    return "";
  }

  if (key === "minEnergyStarScore") {
    return String(Math.min(Number(digitsOnly), 100));
  }

  return digitsOnly;
}

export function useListingFilters() {
  const [draftFilters, setDraftFilters] = useState<DraftListingFilters>(
    DEFAULT_DRAFT_FILTERS
  );
  const [appliedFilters, setAppliedFilters] = useState<ListingFilters>(
    DEFAULT_APPLIED_FILTERS
  );

  const updateDraftFilter = useCallback(
    (key: keyof DraftListingFilters, value: string) => {
      setDraftFilters((prev) => ({
        ...prev,
        [key]: normalizeDraftFilterValue(key, value),
      }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setDraftFilters(DEFAULT_DRAFT_FILTERS);
    setAppliedFilters(DEFAULT_APPLIED_FILTERS);
  }, []);

  const parsedDraftFilters = useMemo(
    () => ({
      location: toLocationOrUndefined(draftFilters.location),
      minPrice: toNumberOrUndefined(draftFilters.minPrice),
      maxPrice: toNumberOrUndefined(draftFilters.maxPrice),
      minBeds: toNumberOrUndefined(draftFilters.minBeds),
      minBaths: toNumberOrUndefined(draftFilters.minBaths),
      minSqft: toNumberOrUndefined(draftFilters.minSqft),
      maxSqft: toNumberOrUndefined(draftFilters.maxSqft),
      minEnergyStarScore: toNumberOrUndefined(draftFilters.minEnergyStarScore),
    }),
    [draftFilters]
  );

  const hasActiveFilters = useMemo(() => {
    return Object.values(appliedFilters).some((value) => value !== undefined);
  }, [appliedFilters]);

  const hasDraftChanges = useMemo(() => {
    return (
      draftFilters.location !== (appliedFilters.location ?? "") ||
      draftFilters.minPrice !== (appliedFilters.minPrice?.toString() ?? "") ||
      draftFilters.maxPrice !== (appliedFilters.maxPrice?.toString() ?? "") ||
      draftFilters.minBeds !== (appliedFilters.minBeds?.toString() ?? "") ||
      draftFilters.minBaths !== (appliedFilters.minBaths?.toString() ?? "") ||
      draftFilters.minSqft !== (appliedFilters.minSqft?.toString() ?? "") ||
      draftFilters.maxSqft !== (appliedFilters.maxSqft?.toString() ?? "") ||
      draftFilters.minEnergyStarScore !==
        (appliedFilters.minEnergyStarScore?.toString() ?? "")
    );
  }, [draftFilters, appliedFilters]);

  const validationErrors = useMemo(() => {
    const errors: Partial<Record<keyof DraftListingFilters, string>> = {};

    if (
      parsedDraftFilters.minPrice !== undefined &&
      parsedDraftFilters.minPrice < 0
    ) {
      errors.minPrice = "Min price cannot be negative.";
    }

    if (
      parsedDraftFilters.maxPrice !== undefined &&
      parsedDraftFilters.maxPrice < 0
    ) {
      errors.maxPrice = "Max price cannot be negative.";
    }

    if (
      parsedDraftFilters.minBeds !== undefined &&
      parsedDraftFilters.minBeds < 0
    ) {
      errors.minBeds = "Min beds cannot be negative.";
    }

    if (
      parsedDraftFilters.minBaths !== undefined &&
      parsedDraftFilters.minBaths < 0
    ) {
      errors.minBaths = "Min baths cannot be negative.";
    }

    if (
      parsedDraftFilters.minSqft !== undefined &&
      parsedDraftFilters.minSqft < 0
    ) {
      errors.minSqft = "Min sqft cannot be negative.";
    }

    if (
      parsedDraftFilters.maxSqft !== undefined &&
      parsedDraftFilters.maxSqft < 0
    ) {
      errors.maxSqft = "Max sqft cannot be negative.";
    }

    if (
      parsedDraftFilters.minPrice !== undefined &&
      parsedDraftFilters.maxPrice !== undefined &&
      parsedDraftFilters.minPrice > parsedDraftFilters.maxPrice
    ) {
      errors.minPrice = "Min price cannot be greater than max price.";
    }

    if (
      parsedDraftFilters.minSqft !== undefined &&
      parsedDraftFilters.maxSqft !== undefined &&
      parsedDraftFilters.minSqft > parsedDraftFilters.maxSqft
    ) {
      errors.minSqft = "Min sqft cannot be greater than max sqft.";
    }

    if (
      parsedDraftFilters.minEnergyStarScore !== undefined &&
      parsedDraftFilters.minEnergyStarScore < 0
    ) {
      errors.minEnergyStarScore = "Min energy star score cannot be negative.";
    }

    if (
      parsedDraftFilters.minEnergyStarScore !== undefined &&
      parsedDraftFilters.minEnergyStarScore > 100
    ) {
      errors.minEnergyStarScore =
        "Min energy star score cannot be greater than 100.";
    }

    return errors;
  }, [parsedDraftFilters]);

  const hasValidationErrors = useMemo(() => {
    return Object.keys(validationErrors).length > 0;
  }, [validationErrors]);

  const isApplyDisabled = !hasDraftChanges || hasValidationErrors;
  const isClearDisabled = !hasActiveFilters && !hasDraftChanges;

  const applyFilters = useCallback(() => {
    if (isApplyDisabled) {
      return;
    }

    setDraftFilters((prev) => ({
      ...prev,
      location: prev.location.trim(),
    }));
    setAppliedFilters(parsedDraftFilters);
  }, [isApplyDisabled, parsedDraftFilters]);

  const resetFiltersForLocation = useCallback((location: string) => {
    const normalizedLocation = location.trim();
    const nextDraftFilters = {
      ...DEFAULT_DRAFT_FILTERS,
      location: normalizedLocation,
    };
    const nextAppliedFilters = {
      ...DEFAULT_APPLIED_FILTERS,
      location: toLocationOrUndefined(normalizedLocation),
    };

    setDraftFilters(nextDraftFilters);
    setAppliedFilters(nextAppliedFilters);
  }, []);

  return {
    draftFilters,
    updateDraftFilter,
    appliedFilters,
    applyFilters,
    clearFilters,
    parsedDraftFilters,
    validationErrors,
    hasValidationErrors,
    hasDraftChanges,
    hasActiveFilters,
    isApplyDisabled,
    isClearDisabled,
    resetFiltersForLocation,
  };
}
