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
  const [draftFilters, setDraftFilters] = useState<DraftListingFilters>(
    DEFAULT_DRAFT_FILTERS
  );
  const [appliedFilters, setAppliedFilters] = useState<ListingFilters>(
    DEFAULT_APPLIED_FILTERS
  );

  const updateDraftFilter = (key: keyof DraftListingFilters, value: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setDraftFilters(DEFAULT_DRAFT_FILTERS);
    setAppliedFilters(DEFAULT_APPLIED_FILTERS);
  };

  const parsedDraftFilters = useMemo(
    () => ({
      minPrice: toNumberOrUndefined(draftFilters.minPrice),
      maxPrice: toNumberOrUndefined(draftFilters.maxPrice),
      minBeds: toNumberOrUndefined(draftFilters.minBeds),
      minBaths: toNumberOrUndefined(draftFilters.minBaths),
      minSqft: toNumberOrUndefined(draftFilters.minSqft),
      maxSqft: toNumberOrUndefined(draftFilters.maxSqft),
    }),
    [draftFilters]
  );

  const hasActiveFilters = useMemo(() => {
    return Object.values(appliedFilters).some((value) => value !== undefined);
  }, [appliedFilters]);

  const hasDraftChanges = useMemo(() => {
    return (
      draftFilters.minPrice !== (appliedFilters.minPrice?.toString() ?? "") ||
      draftFilters.maxPrice !== (appliedFilters.maxPrice?.toString() ?? "") ||
      draftFilters.minBeds !== (appliedFilters.minBeds?.toString() ?? "") ||
      draftFilters.minBaths !== (appliedFilters.minBaths?.toString() ?? "") ||
      draftFilters.minSqft !== (appliedFilters.minSqft?.toString() ?? "") ||
      draftFilters.maxSqft !== (appliedFilters.maxSqft?.toString() ?? "")
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

    return errors;
  }, [parsedDraftFilters]);

  const hasValidationErrors = useMemo(() => {
    return Object.keys(validationErrors).length > 0;
  }, [validationErrors]);

  const isApplyDisabled = !hasDraftChanges || hasValidationErrors;
  const isClearDisabled = !hasActiveFilters && !hasDraftChanges;

  const applyFilters = () => {
    if (isApplyDisabled) {
      return;
    }

    setAppliedFilters(parsedDraftFilters);
  };

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
  };
}
