import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ListingFilters from "../components/listing-filters";

describe("ListingFilters", () => {
  const defaultProps = {
    filters: {
      location: "",
      minPrice: "",
      maxPrice: "",
      minBeds: "",
      minBaths: "",
      minSqft: "",
      maxSqft: "",
      minEnergyStarScore: "",
    },
    onFilterChange: jest.fn(),
    onApply: jest.fn(),
    onClear: jest.fn(),
    isApplyDisabled: false,
    isClearDisabled: true,
    validationErrors: {},
    matchCount: 0,
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
    expect(
      screen.getByPlaceholderText("Min Energy Star Score")
    ).toBeInTheDocument();
  });

  it("sets min=0 on all numeric inputs and max=100 on energy star", () => {
    render(<ListingFilters {...defaultProps} />);

    expect(screen.getByPlaceholderText("Min price")).toHaveAttribute(
      "min",
      "0"
    );
    expect(screen.getByPlaceholderText("Max price")).toHaveAttribute(
      "min",
      "0"
    );
    expect(screen.getByPlaceholderText("Min beds")).toHaveAttribute("min", "0");
    expect(screen.getByPlaceholderText("Min baths")).toHaveAttribute(
      "min",
      "0"
    );
    expect(screen.getByPlaceholderText("Min sqft")).toHaveAttribute("min", "0");
    expect(screen.getByPlaceholderText("Max sqft")).toHaveAttribute("min", "0");
    expect(screen.getByPlaceholderText("Min Energy Star Score")).toHaveAttribute(
      "min",
      "0"
    );
    expect(screen.getByPlaceholderText("Min Energy Star Score")).toHaveAttribute(
      "max",
      "100"
    );
  });

  it("prevents typing invalid number characters", () => {
    render(<ListingFilters {...defaultProps} />);

    const input = screen.getByPlaceholderText("Min price");
    const invalidKeyEvent = createKeyboardEvent(input, "-");

    fireEvent(input, invalidKeyEvent);

    expect(invalidKeyEvent.defaultPrevented).toBe(true);
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

    render(<ListingFilters {...defaultProps} isApplyDisabled={false} />);

    await user.click(screen.getByRole("button", { name: /apply filters/i }));

    expect(defaultProps.onApply).toHaveBeenCalledTimes(1);
  });

  it("calls onClear when Clear is clicked", async () => {
    const user = userEvent.setup();

    render(<ListingFilters {...defaultProps} isClearDisabled={false} />);

    await user.click(screen.getByRole("button", { name: /clear/i }));

    expect(defaultProps.onClear).toHaveBeenCalledTimes(1);
  });

  it("disables Clear when isClearDisabled is true", () => {
    render(<ListingFilters {...defaultProps} isClearDisabled={true} />);

    expect(screen.getByRole("button", { name: /clear/i })).toBeDisabled();
  });

  it("enables Clear when isClearDisabled is false", () => {
    render(<ListingFilters {...defaultProps} isClearDisabled={false} />);

    expect(screen.getByRole("button", { name: /clear/i })).toBeEnabled();
  });

  it("disables Apply Filters when isApplyDisabled is true", () => {
    render(<ListingFilters {...defaultProps} isApplyDisabled={true} />);

    expect(
      screen.getByRole("button", { name: /apply filters/i })
    ).toBeDisabled();
  });

  it("enables Apply Filters when isApplyDisabled is false", () => {
    render(<ListingFilters {...defaultProps} isApplyDisabled={false} />);

    expect(
      screen.getByRole("button", { name: /apply filters/i })
    ).toBeEnabled();
  });

  it("renders a price validation error message", () => {
    render(
      <ListingFilters
        {...defaultProps}
        isApplyDisabled={true}
        validationErrors={{
          minPrice: "Min price cannot be greater than max price.",
        }}
      />
    );

    expect(
      screen.getByText("Min price cannot be greater than max price.")
    ).toBeInTheDocument();
  });

  it("renders a sqft validation error message", () => {
    render(
      <ListingFilters
        {...defaultProps}
        isApplyDisabled={true}
        validationErrors={{
          minSqft: "Min sqft cannot be greater than max sqft.",
        }}
      />
    );

    expect(
      screen.getByText("Min sqft cannot be greater than max sqft.")
    ).toBeInTheDocument();
  });

  it("renders a negative value validation error message", () => {
    render(
      <ListingFilters
        {...defaultProps}
        isApplyDisabled={true}
        validationErrors={{
          minPrice: "Min price cannot be negative.",
        }}
      />
    );

    expect(
      screen.getByText("Min price cannot be negative.")
    ).toBeInTheDocument();
  });

  it("does not render validation messages when there are no validation errors", () => {
    render(<ListingFilters {...defaultProps} validationErrors={{}} />);

    expect(
      screen.queryByText(/cannot be greater than/i)
    ).not.toBeInTheDocument();

    expect(screen.queryByText(/cannot be negative/i)).not.toBeInTheDocument();
  });
});

function createKeyboardEvent(target: HTMLElement, key: string) {
  const event = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    key,
  });

  Object.defineProperty(event, "target", {
    configurable: true,
    value: target,
  });

  return event;
}
