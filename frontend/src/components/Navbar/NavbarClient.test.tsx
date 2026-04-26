import { render, screen } from "@testing-library/react";
import NavbarClient from "./NavbarClient";

const mockUseAuth = jest.fn();
const mockUsePathname = jest.fn();
const mockUseSearchParams = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => mockUsePathname(),
  useSearchParams: () => mockUseSearchParams(),
}));

jest.mock("@/features/auth/context/auth-context", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/features/favorites/context/favorites-context", () => ({
  useFavoritesContext: () => ({
    favoriteCount: 0,
  }),
}));

jest.mock("@/features/search/components/SearchBar", () => ({
  __esModule: true,
  default: () => <div data-testid="search-bar" />,
}));

describe("NavbarClient", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthReady: true,
      isAuthenticated: false,
      logout: jest.fn(),
    });
    mockUsePathname.mockReturnValue("/listings");
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("location=Austin&sort=PRICE_ASC"),
    );
  });

  it("preserves the current page when linking to login", () => {
    render(<NavbarClient />);

    expect(screen.getByTestId("login-button")).toHaveAttribute(
      "href",
      "/login?next=%2Flistings%3Flocation%3DAustin%26sort%3DPRICE_ASC",
    );
  });

  it("does not send users back to the login page after login", () => {
    mockUsePathname.mockReturnValue("/login");
    mockUseSearchParams.mockReturnValue(new URLSearchParams());

    render(<NavbarClient />);

    expect(screen.getByTestId("login-button")).toHaveAttribute(
      "href",
      "/login?next=%2F",
    );
  });
});
