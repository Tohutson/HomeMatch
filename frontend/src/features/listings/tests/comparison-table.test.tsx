import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ComparisonTable } from "@/features/listings/components/comparison-table";
import type { Listing } from "@/features/listings/types";

const listings: Listing[] = [
  {
    id: 1,
    address: "10 Rose Ave",
    price: 450000,
    beds: 3,
    baths: 2,
    sqft: 1600,
    energyStarScore: 75,
    photoUrls: [],
  },
  {
    id: 2,
    address: "20 Emerald Rd",
    price: 425000,
    beds: 4,
    baths: 3,
    sqft: 2100,
    energyStarScore: 88,
    photoUrls: [],
  },
  {
    id: 3,
    address: "30 Zinc St",
    price: null,
    beds: null,
    baths: undefined,
    sqft: 1900,
    energyStarScore: null,
    photoUrls: [],
  },
];

describe("ComparisonTable", () => {
  it("renders selected listings", () => {
    render(<ComparisonTable listings={listings} onRemove={jest.fn()} />);

    expect(screen.getByText("10 Rose Ave")).toBeInTheDocument();
    expect(screen.getByText("20 Emerald Rd")).toBeInTheDocument();
    expect(screen.getByText("30 Zinc St")).toBeInTheDocument();
  });

  it("displays N/A for missing values", () => {
    render(<ComparisonTable listings={listings} onRemove={jest.fn()} />);

    expect(screen.getAllByText("N/A")).toHaveLength(4);
  });

  it("highlights the best value per category without counting missing values", () => {
    render(<ComparisonTable listings={listings} onRemove={jest.fn()} />);

    const priceRow = screen.getByRole("row", { name: /price/i });
    const bedsRow = screen.getByRole("row", { name: /beds/i });
    const bathsRow = screen.getByRole("row", { name: /baths/i });
    const sqftRow = screen.getByRole("row", { name: /square footage/i });
    const energyRow = screen.getByRole("row", { name: /energy rating/i });

    expect(within(priceRow).getByText("$425,000")).toHaveClass("bg-emerald-100");
    expect(within(bedsRow).getByText("4")).toHaveClass("bg-emerald-100");
    expect(within(bathsRow).getByText("3")).toHaveClass("bg-emerald-100");
    expect(within(sqftRow).getByText("2100")).toHaveClass("bg-emerald-100");
    expect(within(energyRow).getByText("88")).toHaveClass("bg-emerald-100");

    expect(within(priceRow).getByText("N/A")).not.toHaveClass("bg-emerald-100");
  });

  it("calls onRemove when a remove button is clicked", async () => {
    const user = userEvent.setup();
    const onRemove = jest.fn();

    render(<ComparisonTable listings={listings} onRemove={onRemove} />);

    await user.click(
      screen.getByRole("button", {
        name: /remove 20 emerald rd from comparison/i,
      })
    );

    expect(onRemove).toHaveBeenCalledWith(2);
  });
});
