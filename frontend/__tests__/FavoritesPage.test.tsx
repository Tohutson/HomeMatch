import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FavoritesPage from "../app/favorites/page";

jest.mock("../app/lib/userId", () => ({
  getOrCreateUserId: jest.fn().mockResolvedValue(1),
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

function setupFetch(overrides: { listingId?: number } = {}) {
  (global.fetch as jest.Mock).mockImplementation(
    (url: string, opts?: RequestInit) => {
      const method = opts?.method ?? "GET";

      if (url.includes("/api/users/1/favorites") && method === "GET") {
        return createResponse(mockFavorites);
      }

      if (url.includes("/api/users/1/favorites/") && method === "DELETE") {
        return createResponse({}, { ok: true, status: 204 });
      }

      if (
        overrides.listingId &&
        url.includes(`/api/listings/${overrides.listingId}`)
      ) {
        return createResponse({}, { ok: false, status: 404 });
      }

      if (url.includes("/api/listings/")) {
        return createResponse({}, { ok: true, status: 200 });
      }

      return createResponse({});
    }
  );
}

describe("FavoritesPage", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    setupFetch();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("displays the count of saved homes in the header", async () => {
    render(<FavoritesPage />);
    expect(await screen.findByText(/My Favorites \(2\)/)).toBeInTheDocument();
  });

  it("renders all saved listings", async () => {
    render(<FavoritesPage />);
    expect(await screen.findByText("30 Pitt St")).toBeInTheDocument();
    expect(screen.getByText("40 Forbes Ave")).toBeInTheDocument();
  });

  it("renders a View Details link for each favorite", async () => {
    render(<FavoritesPage />);
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

    render(<FavoritesPage />);
    expect(await screen.findByText("No favorites yet.")).toBeInTheDocument();
    expect(screen.getByText("Start browsing →")).toBeInTheDocument();
  });

  it("shows unavailable notice when a listing no longer exists", async () => {
    setupFetch({ listingId: 1 });
    render(<FavoritesPage />);

    expect(
      await screen.findByTestId("unavailable-notice-1")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("unavailable-notice-2")).not.toBeInTheDocument();
  });

  it("does not show unavailable notice when all listings still exist", async () => {
    render(<FavoritesPage />);
    await screen.findByText("30 Pitt St");
    expect(screen.queryByTestId("unavailable-notice-1")).not.toBeInTheDocument();
  });

  it("shows confirmation prompt when remove button is clicked", async () => {
    const user = userEvent.setup();
    render(<FavoritesPage />);

    await user.click(await screen.findByTestId("remove-button-1"));

    expect(screen.getByText("Confirm Remove")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("removes the listing after confirmation is clicked", async () => {
    const user = userEvent.setup();
    render(<FavoritesPage />);

    await user.click(await screen.findByTestId("remove-button-1"));
    await user.click(screen.getByText("Confirm Remove"));

    await waitFor(() => {
      expect(screen.queryByText("30 Pitt St")).not.toBeInTheDocument();
    });

    expect(screen.getByText("40 Forbes Ave")).toBeInTheDocument();
  });

  it("cancels removal and keeps the listing visible", async () => {
    const user = userEvent.setup();
    render(<FavoritesPage />);

    await user.click(await screen.findByTestId("remove-button-1"));
    await user.click(screen.getByText("Cancel"));

    expect(screen.getByText("30 Pitt St")).toBeInTheDocument();
  });

  it("sorts by price ascending when that option is selected", async () => {
    const user = userEvent.setup();
    render(<FavoritesPage />);

    await screen.findByText("30 Pitt St");
    await user.selectOptions(screen.getByLabelText("Sort favorites"), "price_asc");

    const cards = screen.getAllByTestId(/^favorite-card-/);
    expect(cards[0]).toHaveAttribute("data-testid", "favorite-card-1");
    expect(cards[1]).toHaveAttribute("data-testid", "favorite-card-2");
  });

  it("sorts by price descending when that option is selected", async () => {
    const user = userEvent.setup();
    render(<FavoritesPage />);

    await screen.findByText("30 Pitt St");
    await user.selectOptions(screen.getByLabelText("Sort favorites"), "price_desc");

    const cards = screen.getAllByTestId(/^favorite-card-/);
    expect(cards[0]).toHaveAttribute("data-testid", "favorite-card-2");
    expect(cards[1]).toHaveAttribute("data-testid", "favorite-card-1");
  });
});