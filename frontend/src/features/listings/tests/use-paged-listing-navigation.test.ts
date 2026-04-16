import { act, renderHook } from "@testing-library/react";
import { usePagedListingNavigation } from "../hooks/use-paged-listing-navigation";

const listing = {
  id: 1,
  address: "123 Main St",
  price: 350000,
  beds: 3,
  baths: 2,
  sqft: 1600,
  listingUrl: "https://example.com/listing/1",
  allPhotoUrls: [],
};

describe("usePagedListingNavigation", () => {
  it("moves to an exhausted state after the final listing on the last page", () => {
    const onPageChange = jest.fn();
    const { result } = renderHook(() =>
      usePagedListingNavigation({
        listings: [listing],
        currentPage: 0,
        totalPages: 1,
        onPageChange,
      })
    );

    act(() => {
      result.current.goNext();
    });

    expect(result.current.currentIndex).toBe(1);
    expect(result.current.currentListing).toBeNull();
    expect(result.current.isAtAbsoluteEnd).toBe(true);
    expect(result.current.canGoPrevious).toBe(true);
    expect(result.current.canGoNext).toBe(false);
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("returns to the last listing when going back from the exhausted state", () => {
    const { result } = renderHook(() =>
      usePagedListingNavigation({
        listings: [listing],
        currentPage: 0,
        totalPages: 1,
        onPageChange: jest.fn(),
      })
    );

    act(() => {
      result.current.goNext();
    });

    act(() => {
      result.current.goPrevious();
    });

    expect(result.current.currentIndex).toBe(0);
    expect(result.current.currentListing).toEqual(listing);
  });
});
