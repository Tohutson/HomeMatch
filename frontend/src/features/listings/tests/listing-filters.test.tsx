import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ListingFilters from "../components/listing-filters";

describe("ListingFilters", () => {
  const defaultProps = {
    filters: {
      minPrice: "",
      maxPrice: "",
      minBeds: "",
      minBaths: "",
      minSqft: "",
      maxSqft: "",
    },
    onFilterChange: jest.fn(),
    onApply: jest.fn(),
    onClear: jest.fn(),
    hasActiveFilters: false,
    matchCount: 0,
    isApplyDisabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all filter inputs", () => {
    render(<ListingFilters {...defaultProps} />);

    expect(screen.getByPlaceholderText("Min price")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Max price")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Min beds")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Min baths")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Min sqft")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Max sqft")).toBeInTheDocument();
  });

  it("renders the singular match count correctly", () => {
    render(<ListingFilters {...defaultProps} matchCount={1} />);

    expect(screen.getByText("1 match")).toBeInTheDocument();
  });

  it("renders the plural match count correctly", () => {
    render(<ListingFilters {...defaultProps} matchCount={2} />);

    expect(screen.getByText("2 matches")).toBeInTheDocument();
  });

  it("calls onFilterChange with minPrice when the min price input changes", () => {
    render(<ListingFilters {...defaultProps} />);

    fireEvent.change(screen.getByPlaceholderText("Min price"), {
      target: { value: "250000" },
    });

    expect(defaultProps.onFilterChange).toHaveBeenCalledTimes(1);
    expect(defaultProps.onFilterChange).toHaveBeenLastCalledWith(
      "minPrice",
      "250000"
    );
  });

  it("calls onFilterChange with maxSqft when the max sqft input changes", () => {
    render(<ListingFilters {...defaultProps} />);

    fireEvent.change(screen.getByPlaceholderText("Max sqft"), {
      target: { value: "1800" },
    });

    expect(defaultProps.onFilterChange).toHaveBeenCalledTimes(1);
    expect(defaultProps.onFilterChange).toHaveBeenLastCalledWith(
      "maxSqft",
      "1800"
    );
  });

  it("calls onApply when Apply Filters is clicked", async () => {
    const user = userEvent.setup();

    render(<ListingFilters {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /apply filters/i }));

    expect(defaultProps.onApply).toHaveBeenCalledTimes(1);
  });

  it("calls onClear when Clear is clicked", async () => {
    const user = userEvent.setup();

    render(<ListingFilters {...defaultProps} hasActiveFilters={true} />);

    await user.click(screen.getByRole("button", { name: /clear/i }));

    expect(defaultProps.onClear).toHaveBeenCalledTimes(1);
  });

  it("disables Clear when there are no active filters", () => {
    render(<ListingFilters {...defaultProps} hasActiveFilters={false} />);

    expect(screen.getByRole("button", { name: /clear/i })).toBeDisabled();
  });

  it("enables Clear when there are active filters", () => {
    render(<ListingFilters {...defaultProps} hasActiveFilters={true} />);

    expect(screen.getByRole("button", { name: /clear/i })).toBeEnabled();
  });

  it("disables Apply Filters when the current draft filters are invalid", () => {
    render(<ListingFilters {...defaultProps} isApplyDisabled={true} />);

    expect(
      screen.getByRole("button", { name: /apply filters/i })
    ).toBeDisabled();
  });

  it("enables Apply Filters when the current draft filters are valid", () => {
    render(<ListingFilters {...defaultProps} isApplyDisabled={false} />);

    expect(
      screen.getByRole("button", { name: /apply filters/i })
    ).toBeEnabled();
  });
});
