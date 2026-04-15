import { act, renderHook } from "@testing-library/react";
import { useListingFilters } from "../hooks/use-listing-filters";

describe("useListingFilters", () => {
  it("initializes with empty draft filters, empty applied filters, and no active filters", () => {
    const { result } = renderHook(() => useListingFilters());

    expect(result.current.draftFilters).toEqual({
      minPrice: "",
      maxPrice: "",
      minBeds: "",
      minBaths: "",
      minSqft: "",
      maxSqft: "",
      minEnergyStarScore: "",
    });

    expect(result.current.appliedFilters).toEqual({
      minPrice: undefined,
      maxPrice: undefined,
      minBeds: undefined,
      minBaths: undefined,
      minSqft: undefined,
      maxSqft: undefined,
      minEnergyStarScore: undefined,
    });

    expect(result.current.hasActiveFilters).toBe(false);
  });

  it("updates only the draft filter that changed", () => {
    const { result } = renderHook(() => useListingFilters());

    act(() => {
      result.current.updateDraftFilter("minPrice", "250000");
    });

    expect(result.current.draftFilters).toEqual({
      minPrice: "250000",
      maxPrice: "",
      minBeds: "",
      minBaths: "",
      minSqft: "",
      maxSqft: "",
      minEnergyStarScore: "",
    });

    expect(result.current.appliedFilters).toEqual({
      minPrice: undefined,
      maxPrice: undefined,
      minBeds: undefined,
      minBaths: undefined,
      minSqft: undefined,
      maxSqft: undefined,
      minEnergyStarScore: undefined,
    });
  });

  it("does not apply draft values until applyFilters is called", () => {
    const { result } = renderHook(() => useListingFilters());

    act(() => {
      result.current.updateDraftFilter("minPrice", "300000");
      result.current.updateDraftFilter("maxSqft", "1800");
    });

    expect(result.current.appliedFilters).toEqual({
      minPrice: undefined,
      maxPrice: undefined,
      minBeds: undefined,
      minBaths: undefined,
      minSqft: undefined,
      maxSqft: undefined,
      minEnergyStarScore: undefined,
    });

    expect(result.current.hasActiveFilters).toBe(false);
  });

  it("converts valid draft strings into numeric applied filters when applyFilters is called", () => {
    const { result } = renderHook(() => useListingFilters());

    act(() => {
      result.current.updateDraftFilter("minPrice", "300000");
      result.current.updateDraftFilter("maxPrice", "550000");
      result.current.updateDraftFilter("minBeds", "3");
      result.current.updateDraftFilter("minBaths", "2");
      result.current.updateDraftFilter("minSqft", "1400");
      result.current.updateDraftFilter("maxSqft", "2200");
      result.current.updateDraftFilter("minEnergyStarScore", "30");
    });

    act(() => {
      result.current.applyFilters();
    });

    expect(result.current.appliedFilters).toEqual({
      minPrice: 300000,
      maxPrice: 550000,
      minBeds: 3,
      minBaths: 2,
      minSqft: 1400,
      maxSqft: 2200,
      minEnergyStarScore: 30,
    });

    expect(result.current.hasActiveFilters).toBe(true);
  });

  it("converts empty draft strings to undefined when applyFilters is called", () => {
    const { result } = renderHook(() => useListingFilters());

    act(() => {
      result.current.updateDraftFilter("minPrice", "");
      result.current.updateDraftFilter("maxPrice", "");
      result.current.updateDraftFilter("maxSqft", "");
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
      minEnergyStarScore: undefined,
    });

    expect(result.current.hasActiveFilters).toBe(false);
  });

  it("includes maxSqft in applied filters", () => {
    const { result } = renderHook(() => useListingFilters());

    act(() => {
      result.current.updateDraftFilter("maxSqft", "1750");
    });

    act(() => {
      result.current.applyFilters();
    });

    expect(result.current.appliedFilters.maxSqft).toBe(1750);
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it("clearFilters resets both draft and applied filters and clears active state", () => {
    const { result } = renderHook(() => useListingFilters());

    act(() => {
      result.current.updateDraftFilter("minPrice", "250000");
      result.current.updateDraftFilter("maxSqft", "1800");
    });

    expect(result.current.hasActiveFilters).toBe(false);

    act(() => {
      result.current.applyFilters();
    });

    expect(result.current.appliedFilters).toEqual({
      minPrice: 250000,
      maxPrice: undefined,
      minBeds: undefined,
      minBaths: undefined,
      minSqft: undefined,
      maxSqft: 1800,
      minEnergyStarScore: undefined,
    });

    expect(result.current.hasActiveFilters).toBe(true);

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.draftFilters).toEqual({
      minPrice: "",
      maxPrice: "",
      minBeds: "",
      minBaths: "",
      minSqft: "",
      maxSqft: "",
      minEnergyStarScore: "",
    });

    expect(result.current.appliedFilters).toEqual({
      minPrice: undefined,
      maxPrice: undefined,
      minBeds: undefined,
      minBaths: undefined,
      minSqft: undefined,
      maxSqft: undefined,
      minEnergyStarScore: undefined,
    });

    expect(result.current.hasActiveFilters).toBe(false);
  });
});
