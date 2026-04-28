import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchBar from "./SearchBar";
import { getSearchSuggestions } from "../api";

const mockPush = jest.fn();
const mockSearchParamsGet = jest.fn();

jest.mock("../api", () => ({
  getSearchSuggestions: jest.fn(),
}));

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
  async function flushSuggestions() {
    await act(async () => {
      jest.advanceTimersByTime(200);
      await Promise.resolve();
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParamsGet.mockReturnValue(null);
    jest.useFakeTimers();
    (getSearchSuggestions as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("navigates to filtered listings for a non-empty search", async () => {
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    render(<SearchBar />);

    const input = screen.getByLabelText(/search listings/i);

    await user.type(input, "  15213 ");
    await flushSuggestions();
    fireEvent.submit(input.closest("form") as HTMLFormElement);

    expect(mockPush).toHaveBeenCalledWith("/listings?location=15213");
  });

  it("navigates to the listings page when the search is empty", async () => {
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

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

  it("shows suggestions as the user types", async () => {
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    (getSearchSuggestions as jest.Mock).mockResolvedValue([
      {
        type: "address",
        value: "123 Main St",
        listingId: 42,
        zipCode: "15213",
      },
      {
        type: "zip",
        value: "15213",
      },
    ]);

    render(<SearchBar />);

    const input = screen.getByLabelText(/search listings/i);

    await user.type(input, "15");
    await flushSuggestions();

    expect(getSearchSuggestions).toHaveBeenCalledWith("15", 5, expect.any(AbortSignal));
    expect(await screen.findByRole("option", { name: /123 main st/i })).toBeInTheDocument();
    expect(screen.getByText("15213")).toBeInTheDocument();
  });

  it("routes to a listing details page when an address suggestion is clicked", async () => {
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    (getSearchSuggestions as jest.Mock).mockResolvedValue([
      {
        type: "address",
        value: "123 Main St",
        listingId: 42,
        zipCode: "15213",
      },
    ]);

    render(<SearchBar />);

    const input = screen.getByLabelText(/search listings/i);

    await user.type(input, "12");
    await flushSuggestions();

    await user.click(await screen.findByRole("option", { name: /123 main st/i }));

    expect(mockPush).toHaveBeenCalledWith("/listings/42");
  });

  it("submits the typed query on enter even when suggestions are open", async () => {
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    (getSearchSuggestions as jest.Mock).mockResolvedValue([
      {
        type: "address",
        value: "example 1",
        listingId: 42,
        zipCode: "15213",
      },
    ]);

    render(<SearchBar />);

    const input = screen.getByLabelText(/search listings/i);

    await user.type(input, "example");
    await flushSuggestions();
    fireEvent.submit(input.closest("form") as HTMLFormElement);

    expect(mockPush).toHaveBeenCalledWith("/listings?location=example");
  });

  it("selects the highlighted suggestion when using keyboard navigation", async () => {
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    (getSearchSuggestions as jest.Mock).mockResolvedValue([
      {
        type: "address",
        value: "example 1",
        listingId: 42,
        zipCode: "15213",
      },
    ]);

    render(<SearchBar />);

    const input = screen.getByLabelText(/search listings/i);

    await user.type(input, "example");
    await flushSuggestions();
    await user.keyboard("{ArrowDown}");
    fireEvent.submit(input.closest("form") as HTMLFormElement);

    expect(mockPush).toHaveBeenCalledWith("/listings/42");
  });

  it("routes to a listings search when a zip suggestion is clicked", async () => {
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    (getSearchSuggestions as jest.Mock).mockResolvedValue([
      {
        type: "zip",
        value: "15213",
      },
    ]);

    render(<SearchBar />);

    const input = screen.getByLabelText(/search listings/i);

    await user.type(input, "15");
    await flushSuggestions();

    await user.click(await screen.findByRole("option", { name: /15213/i }));

    expect(mockPush).toHaveBeenCalledWith("/listings?location=15213");
  });
});
