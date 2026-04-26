import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  ComparisonProvider,
  useComparison,
} from "@/features/listings/context/comparison-context";
import type { Listing } from "@/features/listings/types";

const listings: Listing[] = Array.from({ length: 5 }, (_, index) => ({
  id: index + 1,
  address: `${index + 1} Main St`,
  price: 300000 + index,
  beds: 3,
  baths: 2,
  sqft: 1600,
  photoUrls: [],
}));

function wrapper({ children }: { children: ReactNode }) {
  return <ComparisonProvider>{children}</ComparisonProvider>;
}

describe("ComparisonProvider", () => {
  it("adds a listing", () => {
    const { result } = renderHook(() => useComparison(), { wrapper });

    act(() => {
      result.current.addListing(listings[0]);
    });

    expect(result.current.comparedListings).toEqual([listings[0]]);
  });

  it("does not add duplicates", () => {
    const { result } = renderHook(() => useComparison(), { wrapper });

    act(() => {
      result.current.addListing(listings[0]);
      result.current.addListing(listings[0]);
    });

    expect(result.current.comparedListings).toHaveLength(1);
  });

  it("enforces the max of 4", () => {
    const { result } = renderHook(() => useComparison(), { wrapper });

    act(() => {
      listings.forEach((listing) => result.current.addListing(listing));
    });

    expect(result.current.comparedListings).toHaveLength(4);
    expect(result.current.comparedListings.map((listing) => listing.id)).toEqual([
      1, 2, 3, 4,
    ]);
    expect(result.current.canAddMore).toBe(false);
  });

  it("removes a listing", () => {
    const { result } = renderHook(() => useComparison(), { wrapper });

    act(() => {
      result.current.addListing(listings[0]);
      result.current.addListing(listings[1]);
      result.current.removeListing(listings[0].id);
    });

    expect(result.current.comparedListings).toEqual([listings[1]]);
  });

  it("clears all listings", () => {
    const { result } = renderHook(() => useComparison(), { wrapper });

    act(() => {
      result.current.addListing(listings[0]);
      result.current.addListing(listings[1]);
      result.current.clearComparison();
    });

    expect(result.current.comparedListings).toEqual([]);
  });
});
