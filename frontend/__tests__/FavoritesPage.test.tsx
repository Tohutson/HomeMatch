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

function setupFetch(
  overrides: { listingId?: number; available?: boolean } = {}
) {
  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    if (url.includes("/api/favorites")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockFavorites),
      });
    }
    if (
      overrides.listingId &&
      url.includes(`/api/listings/${overrides.listingId}`)
    ) {
      return Promise.resolve({ ok: false, status: 404 });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
}

describe("FavoritesPage", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    setupFetch();
  });

  afterEach(() => jest.clearAllMocks());

  it("displays the count of saved homes in the header", async () => {
    render(<FavoritesPage />);
    await waitFor(() =>
      expect(screen.getByText(/My Favorites \(2\)/)).toBeInTheDocument()
    );
  });

  it("renders all saved listings", async () => {
    render(<FavoritesPage />);
    await waitFor(() => {
      expect(screen.getByText("30 Pitt St")).toBeInTheDocument();
      expect(screen.getByText("40 Forbes Ave")).toBeInTheDocument();
    });
  });

  it("renders a View Details link for each favorite", async () => {
    render(<FavoritesPage />);
    await waitFor(() => screen.getByTestId("details-link-1"));
    expect(screen.getByTestId("details-link-1")).toHaveAttribute(
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
      if (url.includes("/api/favorites")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({ ok: true });
    });
    render(<FavoritesPage />);
    await waitFor(() =>
      expect(screen.getByText("No favorites yet.")).toBeInTheDocument()
    );
    expect(screen.getByText("Start browsing →")).toBeInTheDocument();
  });

  it("shows unavailable notice when a listing no longer exists", async () => {
    setupFetch({ listingId: 1, available: false });
    render(<FavoritesPage />);
    await waitFor(() =>
      expect(
        screen.getByTestId("unavailable-notice-1")
      ).toBeInTheDocument()
    );
    expect(
      screen.queryByTestId("unavailable-notice-2")
    ).not.toBeInTheDocument();
  });

  it("does not show unavailable notice when all listings still exist", async () => {
    render(<FavoritesPage />);
    await waitFor(() => screen.getByText("30 Pitt St"));
    expect(
      screen.queryByTestId("unavailable-notice-1")
    ).not.toBeInTheDocument();
  });

  it("shows confirmation prompt when remove button is clicked", async () => {
    render(<FavoritesPage />);
    await waitFor(() => screen.getByTestId("remove-button-1"));
    await userEvent.click(screen.getByTestId("remove-button-1"));
    expect(screen.getByText("Confirm Remove")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("removes the listing after confirmation is clicked", async () => {
    (global.fetch as jest.Mock).mockImplementation(
      (url: string, opts?: RequestInit) => {
        if (url.includes("/api/favorites") && !opts?.method) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockFavorites),
          });
        }
        if (url.includes("/api/listings/")) {
          return Promise.resolve({ ok: true });
        }
        return Promise.resolve({ ok: true });
      }
    );

    render(<FavoritesPage />);
    await waitFor(() => screen.getByTestId("remove-button-1"));
    await userEvent.click(screen.getByTestId("remove-button-1"));
    await userEvent.click(screen.getByText("Confirm Remove"));

    await waitFor(() =>
      expect(screen.queryByText("30 Pitt St")).not.toBeInTheDocument()
    );
    expect(screen.getByText("40 Forbes Ave")).toBeInTheDocument();
  });

  it("cancels removal and keeps the listing visible", async () => {
    render(<FavoritesPage />);
    await waitFor(() => screen.getByTestId("remove-button-1"));
    await userEvent.click(screen.getByTestId("remove-button-1"));
    await userEvent.click(screen.getByText("Cancel"));
    expect(screen.getByText("30 Pitt St")).toBeInTheDocument();
  });

  it("sorts by price ascending when that option is selected", async () => {
    render(<FavoritesPage />);
    await waitFor(() => screen.getAllByText(/\$/));
    await userEvent.selectOptions(
      screen.getByLabelText("Sort favorites"),
      "price_asc"
    );
    const cards = screen.getAllByTestId(/^favorite-card-/);
    expect(cards[0]).toHaveAttribute("data-testid", "favorite-card-1");
    expect(cards[1]).toHaveAttribute("data-testid", "favorite-card-2");
  });

  it("sorts by price descending when that option is selected", async () => {
    render(<FavoritesPage />);
    await waitFor(() => screen.getAllByText(/\$/));
    await userEvent.selectOptions(
      screen.getByLabelText("Sort favorites"),
      "price_desc"
    );
    const cards = screen.getAllByTestId(/^favorite-card-/);
    expect(cards[0]).toHaveAttribute("data-testid", "favorite-card-2");
    expect(cards[1]).toHaveAttribute("data-testid", "favorite-card-1");
  });
});