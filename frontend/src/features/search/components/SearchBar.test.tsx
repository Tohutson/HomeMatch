import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchBar from "./SearchBar";

const mockPush = jest.fn();
const mockSearchParamsGet = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => "/",
  useSearchParams: () => ({
    get: mockSearchParamsGet,
  }),
}));

describe("SearchBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParamsGet.mockReturnValue(null);
  });

  it("navigates to filtered listings for a non-empty search", async () => {
    const user = userEvent.setup();

    render(<SearchBar />);

    const input = screen.getByLabelText(/search listings/i);

    await user.type(input, "  15213 ");
    fireEvent.submit(input.closest("form") as HTMLFormElement);

    expect(mockPush).toHaveBeenCalledWith("/listings?location=15213");
  });

  it("navigates to the listings page when the search is empty", async () => {
    const user = userEvent.setup();

    render(<SearchBar />);

    const input = screen.getByLabelText(/search listings/i);

    await user.type(input, "   ");
    fireEvent.submit(input.closest("form") as HTMLFormElement);

    expect(mockPush).toHaveBeenCalledWith("/listings");
  });

  it("hydrates the input from the current location query param", () => {
    mockSearchParamsGet.mockImplementation((key: string) =>
      key === "location" ? "Brooklyn" : null
    );

    render(<SearchBar />);

    expect(screen.getByLabelText(/search listings/i)).toHaveValue("Brooklyn");
  });
});
