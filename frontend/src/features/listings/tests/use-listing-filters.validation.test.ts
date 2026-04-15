import { act, renderHook } from "@testing-library/react";
import { useListingFilters } from "../hooks/use-listing-filters";

describe("useListingFilters validation", () => {
  it("disables apply when minPrice is greater than maxPrice", () => {
    const { result } = renderHook(() => useListingFilters());

    act(() => {
      result.current.updateDraftFilter("minPrice", "500000");
      result.current.updateDraftFilter("maxPrice", "300000");
    });

    expect(result.current.isApplyDisabled).toBe(true);
    expect(result.current.hasValidationErrors).toBe(true);
    expect(result.current.validationErrors.minPrice).toBe(
      "Min price cannot be greater than max price."
    );
  });

  it("disables apply when minSqft is greater than maxSqft", () => {
    const { result } = renderHook(() => useListingFilters());

    act(() => {
      result.current.updateDraftFilter("minSqft", "2000");
      result.current.updateDraftFilter("maxSqft", "1500");
    });

    expect(result.current.isApplyDisabled).toBe(true);
    expect(result.current.hasValidationErrors).toBe(true);
    expect(result.current.validationErrors.minSqft).toBe(
      "Min sqft cannot be greater than max sqft."
    );
  });

  it("disables apply when a numeric filter is negative", () => {
    const { result } = renderHook(() => useListingFilters());

    act(() => {
      result.current.updateDraftFilter("minPrice", "-1");
    });

    expect(result.current.isApplyDisabled).toBe(true);
    expect(result.current.hasValidationErrors).toBe(true);
    expect(result.current.validationErrors.minPrice).toBe(
      "Min price cannot be negative."
    );
  });

  it("enables apply when all draft filters are valid", () => {
    const { result } = renderHook(() => useListingFilters());

    act(() => {
      result.current.updateDraftFilter("minPrice", "250000");
      result.current.updateDraftFilter("maxPrice", "500000");
      result.current.updateDraftFilter("minSqft", "1200");
      result.current.updateDraftFilter("maxSqft", "2200");
    });

    expect(result.current.hasValidationErrors).toBe(false);
    expect(result.current.validationErrors).toEqual({});
    expect(result.current.isApplyDisabled).toBe(false);
  });

  it("does not apply invalid draft filters", () => {
    const { result } = renderHook(() => useListingFilters());

    act(() => {
      result.current.updateDraftFilter("minPrice", "500000");
      result.current.updateDraftFilter("maxPrice", "300000");
    });

    act(() => {
      result.current.applyFilters();
    });

    expect(result.current.appliedFilters).toEqual({
      minPrice: undefined,
      maxPrice: undefined,
      minBeds: undefined,
      minBaths: undefined,
      minSqft: undefined,
      maxSqft: undefined,
    });
  });

  it("applies valid draft filters", () => {
    const { result } = renderHook(() => useListingFilters());

    act(() => {
      result.current.updateDraftFilter("minPrice", "250000");
      result.current.updateDraftFilter("maxPrice", "500000");
    });

    act(() => {
      result.current.applyFilters();
    });

    expect(result.current.appliedFilters.minPrice).toBe(250000);
    expect(result.current.appliedFilters.maxPrice).toBe(500000);
    expect(result.current.hasActiveFilters).toBe(true);
    expect(result.current.hasDraftChanges).toBe(false);
  });

  it("disables clear when there are no active filters and no draft changes", () => {
    const { result } = renderHook(() => useListingFilters());

    expect(result.current.isClearDisabled).toBe(true);
  });

  it("enables clear when there are draft changes", () => {
    const { result } = renderHook(() => useListingFilters());

    act(() => {
      result.current.updateDraftFilter("minBeds", "2");
    });

    expect(result.current.isClearDisabled).toBe(false);
  });
});
