import { render, screen, waitFor } from "@testing-library/react";
import HomePage from "../src/app/page";
import NavbarClient from "../src/components/Navbar/NavbarClient";
import { FavoritesProvider } from "../src/features/favorites/context/favorites-context";

jest.mock("../src/features/search/components/SearchBar", () => ({
  __esModule: true,
  default: () => <div data-testid="search-bar" />,
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));

async function renderHomePage() {
  render(
    <FavoritesProvider>
      <NavbarClient user={null} />
      <HomePage />
    </FavoritesProvider>,
  );

  await waitFor(() => {
    expect(
      screen.getByText("HomeMatch, where your dream home is a swipe away."),
    ).toBeInTheDocument();
  });
}

describe("HomePage", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    }) as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the hero copy and primary browse action", async () => {
    await renderHomePage();

    expect(
      screen.getByText("HomeMatch, where your dream home is a swipe away."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Find your next place with less friction"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Start browsing" }),
    ).toHaveAttribute("href", "/listings");
  });

  it("renders the search experience in the navbar and hero card", async () => {
    await renderHomePage();

    expect(screen.getAllByTestId("search-bar")).toHaveLength(3);
    expect(
      screen.getByText("Discover homes in a few keystrokes"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Browse all listings" }),
    ).toHaveAttribute("href", "/listings");
  });

  it("shows the favorites nav link in the header", async () => {
    await renderHomePage();

    expect(screen.getByTestId("favorites-nav-link")).toHaveAttribute(
      "href",
      "/favorites",
    );
    expect(screen.getByText("♥ Favorites (0)")).toBeInTheDocument();
  });
});
