import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ListingsPage from "../pages/ListingsPage";
import { FavoritesProvider } from "@/features/favorites/context/favorites-context";

const mockUseListings = jest.fn();
const mockUsePagedListingNavigation = jest.fn();
const mockUseListingsFavoriteWorkflow = jest.fn();
const mockReplace = jest.fn();
const mockSearchParamsGet = jest.fn();
const mockSearchParamsToString = jest.fn();

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
  getStoredUserId: jest.fn().mockReturnValue(null),
  getStoredUserEmail: jest.fn().mockReturnValue(null),
  clearStoredUserSession: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  usePathname: () => "/listings",
  useSearchParams: () => ({
    get: mockSearchParamsGet,
    toString: mockSearchParamsToString,
  }),
}));

describe("ListingsPage", () => {
  function renderListingsPage() {
    return render(
      <FavoritesProvider>
        <ListingsPage />
      </FavoritesProvider>
    );
  }

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
    mockSearchParamsGet.mockReturnValue(null);
    mockSearchParamsToString.mockReturnValue("");
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response);

    mockUseListingsFavoriteWorkflow.mockReturnValue({
      favoriteIds: new Set<number>(),
      syncingIds: new Set<number>(),
      handleSwipeFavorite: jest.fn().mockReturnValue(true),
      handleFavorite: jest.fn(),
      handleUndo: jest.fn(),
      handleRedo: jest.fn(),
      pendingFavorite: false,
      canUndo: false,
      canRedo: false,
      undoVisible: false,
      undoTimeLeft: 0,
      showBanner: false,
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
    renderListingsPage();

    expect(await screen.findByPlaceholderText("Min price")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Max sqft")).toBeInTheDocument();
    expect(screen.getByText(/1 match/i)).toBeInTheDocument();
  });

  it("renders only the backend-supported sort options", async () => {
    renderListingsPage();

    const sortSelect = await screen.findByLabelText(/sort results/i);
    const optionValues = Array.from(
      sortSelect.querySelectorAll("option"),
      (option) => option.getAttribute("value")
    );

    expect(optionValues).toEqual([
      "",
      "PRICE_ASC",
      "PRICE_DESC",
      "SQFT_ASC",
      "SQFT_DESC",
      "ENERGY_DESC",
    ]);
    expect(screen.queryByRole("option", { name: /energy score: low to high/i })).not.toBeInTheDocument();
  });

  it("keeps filters and the current listing visible while loading the next page", async () => {
    mockUseListings.mockReturnValue({
      listings: [listing],
      totalPages: 2,
      totalElements: 2,
      loading: true,
      error: null,
    });

    mockUsePagedListingNavigation.mockReturnValue({
      currentIndex: 0,
      currentListing: listing,
      isAtAbsoluteStart: true,
      isAtAbsoluteEnd: false,
      canGoPrevious: false,
      canGoNext: false,
      goNext: jest.fn(),
      goPrevious: jest.fn(),
      setCurrentIndex: jest.fn(),
    });

    renderListingsPage();

    expect(await screen.findByPlaceholderText("Min price")).toBeInTheDocument();
    expect(screen.getByText("123 Main St")).toBeInTheDocument();
    expect(screen.getByText("Loading more homes...")).toBeInTheDocument();
  });

  it("does not apply draft filters until Apply Filters is clicked", async () => {
    const user = userEvent.setup();

    renderListingsPage();

    const initialCall = mockUseListings.mock.calls.at(-1)?.[0];
    expect(initialCall.filters).toEqual({
      location: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      minBeds: undefined,
      minBaths: undefined,
      minSqft: undefined,
      maxSqft: undefined,
      minEnergyStarScore: undefined,
    });

    await user.type(screen.getByPlaceholderText("Min price"), "300000");
    await user.type(screen.getByPlaceholderText("Max sqft"), "1800");

    const afterTypingCall = mockUseListings.mock.calls.at(-1)?.[0];
    expect(afterTypingCall.filters).toEqual({
      location: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      minBeds: undefined,
      minBaths: undefined,
      minSqft: undefined,
      maxSqft: undefined,
      minEnergyStarScore: undefined,
    });

    await user.click(screen.getByRole("button", { name: /apply filters/i }));

    await waitFor(() => {
      const appliedCall = mockUseListings.mock.calls.at(-1)?.[0];
      expect(appliedCall.filters).toEqual({
        location: undefined,
        minPrice: 300000,
        maxPrice: undefined,
        minBeds: undefined,
        minBaths: undefined,
        minSqft: undefined,
        maxSqft: 1800,
        minEnergyStarScore: undefined,
      });
    });
  });

  it("passes maxSqft to useListings after Apply Filters is clicked", async () => {
    const user = userEvent.setup();

    renderListingsPage();

    await user.type(screen.getByPlaceholderText("Max sqft"), "1750");
    await user.click(screen.getByRole("button", { name: /apply filters/i }));

    await waitFor(() => {
      const appliedCall = mockUseListings.mock.calls.at(-1)?.[0];
      expect(appliedCall.filters.maxSqft).toBe(1750);
    });
  });

  it("clears applied filters when Clear is clicked", async () => {
    const user = userEvent.setup();

    renderListingsPage();

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
        location: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        minBeds: undefined,
        minBaths: undefined,
        minSqft: undefined,
        maxSqft: undefined,
        minEnergyStarScore: undefined,
      });
    });

    expect(mockReplace).toHaveBeenCalledWith("/listings");
  });

  it("applies a supported sort option and updates the URL query", async () => {
    const user = userEvent.setup();

    renderListingsPage();

    await user.selectOptions(
      await screen.findByLabelText(/sort results/i),
      "SQFT_DESC"
    );

    await waitFor(() => {
      const latestCall = mockUseListings.mock.calls.at(-1)?.[0];
      expect(latestCall.sort).toBe("SQFT_DESC");
    });

    expect(mockReplace).toHaveBeenCalledWith("/listings?sort=SQFT_DESC");
  });

  it("hydrates a supported sort from the URL search params", async () => {
    mockSearchParamsGet.mockImplementation((key: string) =>
      key === "sort" ? "ENERGY_DESC" : null
    );
    mockSearchParamsToString.mockReturnValue("sort=ENERGY_DESC");

    renderListingsPage();

    const sortSelect = await screen.findByLabelText(/sort results/i);

    expect(sortSelect).toHaveValue("ENERGY_DESC");

    await waitFor(() => {
      const latestCall = mockUseListings.mock.calls.at(-1)?.[0];
      expect(latestCall.sort).toBe("ENERGY_DESC");
    });
  });

  it("ignores unsupported legacy sort values from the URL", async () => {
    mockSearchParamsGet.mockImplementation((key: string) =>
      key === "sort" ? "SIZE_ASC" : null
    );
    mockSearchParamsToString.mockReturnValue("sort=SIZE_ASC");

    renderListingsPage();

    const sortSelect = await screen.findByLabelText(/sort results/i);

    expect(sortSelect).toHaveValue("");

    await waitFor(() => {
      const latestCall = mockUseListings.mock.calls.at(-1)?.[0];
      expect(latestCall.sort).toBeNull();
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

    renderListingsPage();

    await user.type(screen.getByPlaceholderText("Max sqft"), "900");
    await user.click(screen.getByRole("button", { name: /apply filters/i }));

    expect(
      await screen.findByText(/no homes found matching your criteria/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/try changing or clearing your filters/i)
    ).toBeInTheDocument();
  });

  it("shows an end-of-results message after the last available listing is swiped away", async () => {
    mockUsePagedListingNavigation.mockReturnValue({
      currentIndex: 1,
      currentListing: null,
      isAtAbsoluteStart: false,
      isAtAbsoluteEnd: true,
      canGoPrevious: true,
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

    renderListingsPage();

    expect(
      await screen.findByText(/you've reached the end of these matches/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/try different filters or go back to revisit the last home/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/adjust your filters to discover more homes/i)
    ).toBeInTheDocument();
  });

  it("applies the location from the URL search params", async () => {
    mockSearchParamsGet.mockImplementation((key: string) =>
      key === "location" ? "Pittsburgh" : null
    );

    renderListingsPage();

    await waitFor(() => {
      const latestCall = mockUseListings.mock.calls.at(-1)?.[0];
      expect(latestCall.filters.location).toBe("Pittsburgh");
    });
  });

  it("clears other filters when a new location search is loaded from the URL", async () => {
    const user = userEvent.setup();

    renderListingsPage();

    await user.type(screen.getByPlaceholderText("Min price"), "300000");
    await user.type(screen.getByPlaceholderText("Max sqft"), "1800");
    await user.click(screen.getByRole("button", { name: /apply filters/i }));

    await waitFor(() => {
      const appliedCall = mockUseListings.mock.calls.at(-1)?.[0];
      expect(appliedCall.filters.minPrice).toBe(300000);
      expect(appliedCall.filters.maxSqft).toBe(1800);
    });

    mockSearchParamsGet.mockImplementation((key: string) =>
      key === "location" ? "Pittsburgh" : null
    );

    renderListingsPage();

    await waitFor(() => {
      const latestCall = mockUseListings.mock.calls.at(-1)?.[0];
      expect(latestCall.filters).toEqual({
        location: "Pittsburgh",
        minPrice: undefined,
        maxPrice: undefined,
        minBeds: undefined,
        minBaths: undefined,
        minSqft: undefined,
        maxSqft: undefined,
        minEnergyStarScore: undefined,
      });
    });
  });

  it("advances to the next listing after a successful right swipe", async () => {
    jest.useFakeTimers();

    const handleSwipeFavorite = jest.fn().mockReturnValue(true);
    const goNext = jest.fn();

    mockUseListingsFavoriteWorkflow.mockReturnValue({
      favoriteIds: new Set<number>(),
      syncingIds: new Set<number>(),
      handleSwipeFavorite,
      handleFavorite: jest.fn(),
      handleUndo: jest.fn(),
      handleRedo: jest.fn(),
      pendingFavorite: false,
      canUndo: false,
      canRedo: false,
      undoVisible: false,
      undoTimeLeft: 0,
      showBanner: false,
    });

    mockUsePagedListingNavigation.mockReturnValue({
      currentIndex: 0,
      currentListing: listing,
      isAtAbsoluteStart: true,
      isAtAbsoluteEnd: false,
      canGoPrevious: false,
      canGoNext: true,
      goNext,
      goPrevious: jest.fn(),
      setCurrentIndex: jest.fn(),
    });

    mockUseListings.mockReturnValue({
      listings: [listing, { ...listing, id: 2, address: "40 Oak Ave" }],
      totalPages: 1,
      totalElements: 2,
      loading: false,
      error: null,
    });

    renderListingsPage();

    const card = await screen.findByTestId("listing-card");

    act(() => {
      fireEvent.touchStart(card, { touches: [{ clientX: 0 }] });
      fireEvent.touchEnd(card, { changedTouches: [{ clientX: 160 }] });
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(handleSwipeFavorite).toHaveBeenCalledWith(listing);
      expect(goNext).toHaveBeenCalledTimes(1);
    });
  });
});
