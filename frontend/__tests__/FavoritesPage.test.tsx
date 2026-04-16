import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FavoritesPage from "../src/app/favorites/page";
import { FavoritesProvider } from "../src/features/favorites/context/favorites-context";

jest.mock("../src/lib/userId", () => ({
  getOrCreateUserId: jest.fn().mockResolvedValue(1),
  getStoredUserId: jest.fn().mockReturnValue(1),
}));

const mockFavorites = [
  {
    id: 1,
    userId: 1,
    listing: {
      id: 1,
      address: "30 Pitt St",
      price: 250000,
      beds: 3,
      baths: 1.5,
      sqft: 2250,
      photoUrls: [],
    },
    createdAt: "2026-01-01T10:00:00",
  },
  {
    id: 2,
    userId: 1,
    listing: {
      id: 2,
      address: "40 Forbes Ave",
      price: 525000,
      beds: 4,
      baths: 3.0,
      sqft: 3100,
      photoUrls: [],
    },
    createdAt: "2026-01-02T10:00:00",
  },
];

function createResponse(body: unknown, init?: Partial<Response>) {
  return Promise.resolve({
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    json: async () => body,
  });
}

function setupFetch(
  overrides: {
    unavailableListingIds?: number[];
    favoritesAfterDelete?: typeof mockFavorites;
  } = {}
) {
  let deletedListingId: number | null = null;

  (global.fetch as jest.Mock).mockImplementation(
    (url: string, opts?: RequestInit) => {
      const method = opts?.method ?? "GET";

      if (url.includes("/api/users/1/favorites") && method === "GET") {
        if (deletedListingId !== null) {
          return createResponse(
            overrides.favoritesAfterDelete ??
              mockFavorites.filter((fav) => fav.listing.id !== deletedListingId)
          );
        }

        return createResponse(mockFavorites);
      }

      if (url.includes("/api/users/1/favorites/") && method === "DELETE") {
        const match = url.match(/\/api\/users\/1\/favorites\/(\d+)/);
        deletedListingId = match ? Number(match[1]) : null;
        return createResponse({}, { ok: true, status: 204 });
      }

      if (url.includes("/api/listings/availability")) {
        const query = new URL(url).searchParams;
        const requestedIds = query.getAll("ids").map(Number);
        const availableIds = requestedIds.filter(
          (listingId) => !overrides.unavailableListingIds?.includes(listingId)
        );
        return createResponse(availableIds);
      }

      return createResponse({});
    }
  );
}

describe("FavoritesPage", () => {
  function renderFavoritesPage() {
    return render(
      <FavoritesProvider>
        <FavoritesPage />
      </FavoritesProvider>
    );
  }

  beforeEach(() => {
    global.fetch = jest.fn();
    setupFetch();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("displays the count of saved homes in the header", async () => {
    renderFavoritesPage();
    await screen.findByText("30 Pitt St");
    expect(screen.getByText("My Favorites")).toBeInTheDocument();
    expect(screen.getByText(/2\s+saved\s+homes/)).toBeInTheDocument();
  });

  it("renders all saved listings", async () => {
    renderFavoritesPage();
    expect(await screen.findByText("30 Pitt St")).toBeInTheDocument();
    expect(screen.getByText("40 Forbes Ave")).toBeInTheDocument();
  });

  it("renders a View Details link for each favorite", async () => {
    renderFavoritesPage();
    expect(await screen.findByTestId("details-link-1")).toHaveAttribute(
      "href",
      "/listings/1"
    );
    expect(screen.getByTestId("details-link-2")).toHaveAttribute(
      "href",
      "/listings/2"
    );
  });

  it("shows empty state with browse link when no favorites exist", async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/api/users/1/favorites")) {
        return createResponse([]);
      }
      return createResponse({});
    });

    renderFavoritesPage();
    expect(await screen.findByText("Start building your shortlist")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start browsing" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("shows unavailable notice when a listing no longer exists", async () => {
    setupFetch({ unavailableListingIds: [1] });
    renderFavoritesPage();

    expect(
      await screen.findByTestId("unavailable-notice-1")
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("unavailable-notice-2")
    ).not.toBeInTheDocument();
  });

  it("does not show unavailable notice when all listings still exist", async () => {
    renderFavoritesPage();
    await screen.findByText("30 Pitt St");
    expect(
      screen.queryByTestId("unavailable-notice-1")
    ).not.toBeInTheDocument();
  });

  it("shows confirmation prompt when remove button is clicked", async () => {
    const user = userEvent.setup();
    renderFavoritesPage();

    await user.click(await screen.findByTestId("remove-button-1"));

    expect(screen.getByText("Confirm remove")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("removes the listing after confirmation is clicked", async () => {
    const user = userEvent.setup();
    renderFavoritesPage();

    await user.click(await screen.findByTestId("remove-button-1"));
    await user.click(screen.getByText("Confirm remove"));

    await waitFor(() => {
      expect(screen.queryByText("30 Pitt St")).not.toBeInTheDocument();
    });

    expect(screen.getByText("40 Forbes Ave")).toBeInTheDocument();
  });

  it("cancels removal and keeps the listing visible", async () => {
    const user = userEvent.setup();
    renderFavoritesPage();

    await user.click(await screen.findByTestId("remove-button-1"));
    await user.click(screen.getByText("Cancel"));

    expect(screen.getByText("30 Pitt St")).toBeInTheDocument();
  });

  it("sorts by price ascending when that option is selected", async () => {
    const user = userEvent.setup();
    renderFavoritesPage();

    await screen.findByText("30 Pitt St");
    await user.selectOptions(
      screen.getByLabelText("Sort favorites"),
      "price_asc"
    );

    const cards = screen.getAllByTestId(/^favorite-card-/);
    expect(cards[0]).toHaveAttribute("data-testid", "favorite-card-1");
    expect(cards[1]).toHaveAttribute("data-testid", "favorite-card-2");
  });

  it("sorts by price descending when that option is selected", async () => {
    const user = userEvent.setup();
    renderFavoritesPage();

    await screen.findByText("30 Pitt St");
    await user.selectOptions(
      screen.getByLabelText("Sort favorites"),
      "price_desc"
    );

    const cards = screen.getAllByTestId(/^favorite-card-/);
    expect(cards[0]).toHaveAttribute("data-testid", "favorite-card-2");
    expect(cards[1]).toHaveAttribute("data-testid", "favorite-card-1");
  });
});
