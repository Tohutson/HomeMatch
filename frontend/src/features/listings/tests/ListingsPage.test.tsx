import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ListingsPage from "../pages/ListingsPage";

const mockUseListings = jest.fn();
const mockUsePagedListingNavigation = jest.fn();
const mockUseListingsFavoriteWorkflow = jest.fn();

jest.mock("@/features/listings/hooks/use-listings", () => ({
  useListings: (...args: unknown[]) => mockUseListings(...args),
}));

jest.mock("@/features/listings/hooks/use-paged-listing-navigation", () => ({
  usePagedListingNavigation: (...args: unknown[]) =>
    mockUsePagedListingNavigation(...args),
}));

jest.mock("@/features/favorites/hooks/use-listings-favorite-workflow", () => ({
  useListingsFavoriteWorkflow: (...args: unknown[]) =>
    mockUseListingsFavoriteWorkflow(...args),
}));

jest.mock("@/lib/userId", () => ({
  getOrCreateUserId: jest.fn().mockResolvedValue(123),
}));

describe("ListingsPage", () => {
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

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseListingsFavoriteWorkflow.mockReturnValue({
      favoriteIds: new Set<number>(),
      syncingIds: new Set<number>(),
      handleFavorite: jest.fn(),
      handleSwipeRight: jest.fn(),
      handleSwipeLeft: jest.fn(),
      handleUndo: jest.fn(),
      handleRedo: jest.fn(),
    });

    mockUsePagedListingNavigation.mockReturnValue({
      currentIndex: 0,
      currentListing: listing,
      isAtAbsoluteStart: true,
      isAtAbsoluteEnd: true,
      canGoPrevious: false,
      canGoNext: false,
      goNext: jest.fn(),
      goPrevious: jest.fn(),
      setCurrentIndex: jest.fn(),
    });

    mockUseListings.mockReturnValue({
      listings: [listing],
      totalPages: 1,
      totalElements: 1,
      loading: false,
      error: null,
    });
  });

  it("renders listing filters and listing card", async () => {
    render(<ListingsPage />);

    expect(await screen.findByPlaceholderText("Min price")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Max sqft")).toBeInTheDocument();
    expect(screen.getByText(/1 match/i)).toBeInTheDocument();
  });

  it("does not apply draft filters until Apply Filters is clicked", async () => {
    const user = userEvent.setup();

    render(<ListingsPage />);

    const initialCall = mockUseListings.mock.calls.at(-1)?.[0];
    expect(initialCall.filters).toEqual({
      minPrice: undefined,
      maxPrice: undefined,
      minBeds: undefined,
      minBaths: undefined,
      minSqft: undefined,
      maxSqft: undefined,
    });

    await user.type(screen.getByPlaceholderText("Min price"), "300000");
    await user.type(screen.getByPlaceholderText("Max sqft"), "1800");

    const afterTypingCall = mockUseListings.mock.calls.at(-1)?.[0];
    expect(afterTypingCall.filters).toEqual({
      minPrice: undefined,
      maxPrice: undefined,
      minBeds: undefined,
      minBaths: undefined,
      minSqft: undefined,
      maxSqft: undefined,
    });

    await user.click(screen.getByRole("button", { name: /apply filters/i }));

    await waitFor(() => {
      const appliedCall = mockUseListings.mock.calls.at(-1)?.[0];
      expect(appliedCall.filters).toEqual({
        minPrice: 300000,
        maxPrice: undefined,
        minBeds: undefined,
        minBaths: undefined,
        minSqft: undefined,
        maxSqft: 1800,
      });
    });
  });

  it("passes maxSqft to useListings after Apply Filters is clicked", async () => {
    const user = userEvent.setup();

    render(<ListingsPage />);

    await user.type(screen.getByPlaceholderText("Max sqft"), "1750");
    await user.click(screen.getByRole("button", { name: /apply filters/i }));

    await waitFor(() => {
      const appliedCall = mockUseListings.mock.calls.at(-1)?.[0];
      expect(appliedCall.filters.maxSqft).toBe(1750);
    });
  });

  it("clears applied filters when Clear is clicked", async () => {
    const user = userEvent.setup();

    render(<ListingsPage />);

    await user.type(screen.getByPlaceholderText("Min price"), "300000");
    await user.type(screen.getByPlaceholderText("Max sqft"), "1800");
    await user.click(screen.getByRole("button", { name: /apply filters/i }));

    await waitFor(() => {
      const appliedCall = mockUseListings.mock.calls.at(-1)?.[0];
      expect(appliedCall.filters.minPrice).toBe(300000);
      expect(appliedCall.filters.maxSqft).toBe(1800);
    });

    await user.click(screen.getByRole("button", { name: /clear/i }));

    await waitFor(() => {
      const clearedCall = mockUseListings.mock.calls.at(-1)?.[0];
      expect(clearedCall.filters).toEqual({
        minPrice: undefined,
        maxPrice: undefined,
        minBeds: undefined,
        minBaths: undefined,
        minSqft: undefined,
        maxSqft: undefined,
      });
    });
  });

  it("shows the no homes found empty state when filtered results are empty", async () => {
    const user = userEvent.setup();

    mockUseListings
      .mockReturnValueOnce({
        listings: [listing],
        totalPages: 1,
        totalElements: 1,
        loading: false,
        error: null,
      })
      .mockReturnValue({
        listings: [],
        totalPages: 0,
        totalElements: 0,
        loading: false,
        error: null,
      });

    mockUsePagedListingNavigation
      .mockReturnValueOnce({
        currentIndex: 0,
        currentListing: listing,
        isAtAbsoluteStart: true,
        isAtAbsoluteEnd: true,
        canGoPrevious: false,
        canGoNext: false,
        goNext: jest.fn(),
        goPrevious: jest.fn(),
        setCurrentIndex: jest.fn(),
      })
      .mockReturnValue({
        currentIndex: 0,
        currentListing: null,
        isAtAbsoluteStart: true,
        isAtAbsoluteEnd: true,
        canGoPrevious: false,
        canGoNext: false,
        goNext: jest.fn(),
        goPrevious: jest.fn(),
        setCurrentIndex: jest.fn(),
      });

    render(<ListingsPage />);

    await user.type(screen.getByPlaceholderText("Max sqft"), "900");
    await user.click(screen.getByRole("button", { name: /apply filters/i }));

    expect(
      await screen.findByText(/no homes found matching your criteria/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/try changing or clearing your filters/i)
    ).toBeInTheDocument();
  });
});
