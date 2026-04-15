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
    expect(result.current.validationErrors.minPrice).toBeDefined();
  });

  it("disables apply when minSqft is greater than maxSqft", () => {
    const { result } = renderHook(() => useListingFilters());

    act(() => {
      result.current.updateDraftFilter("minSqft", "2000");
      result.current.updateDraftFilter("maxSqft", "1500");
    });

    expect(result.current.isApplyDisabled).toBe(true);
    expect(result.current.validationErrors.minSqft).toBeDefined();
  });

  it("disables apply when a numeric filter is negative", () => {
    const { result } = renderHook(() => useListingFilters());

    act(() => {
      result.current.updateDraftFilter("minPrice", "-1");
    });

    expect(result.current.isApplyDisabled).toBe(true);
    expect(result.current.validationErrors.minPrice).toBeDefined();
  });

  it("enables apply when all draft filters are valid", () => {
    const { result } = renderHook(() => useListingFilters());

    act(() => {
      result.current.updateDraftFilter("minPrice", "250000");
      result.current.updateDraftFilter("maxPrice", "500000");
      result.current.updateDraftFilter("minSqft", "1200");
      result.current.updateDraftFilter("maxSqft", "2200");
    });

    expect(result.current.isApplyDisabled).toBe(false);
  });
});
