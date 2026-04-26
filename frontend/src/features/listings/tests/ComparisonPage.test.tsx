import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import {
  ComparisonProvider,
  useComparison,
} from "@/features/listings/context/comparison-context";
import ComparisonPage from "@/features/listings/pages/ComparisonPage";
import type { Listing } from "@/features/listings/types";

const selectedListings: Listing[] = [
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
];

function ComparisonSeeder({ listings }: { listings: Listing[] }) {
  const { addListing } = useComparison();

  useEffect(() => {
    listings.forEach((listing) => addListing(listing));
  }, [addListing, listings]);

  return null;
}

function renderComparisonPage(listings: Listing[] = []) {
  return render(
    <ComparisonProvider>
      <ComparisonSeeder listings={listings} />
      <ComparisonPage />
    </ComparisonProvider>
  );
}

describe("ComparisonPage", () => {
  it("shows an empty state when no listings are selected", () => {
    renderComparisonPage();

    expect(screen.getByText(/no homes selected/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /back to listings/i })
    ).toHaveAttribute("href", "/listings");
  });

  it("renders selected listings in the reusable comparison table", async () => {
    renderComparisonPage(selectedListings);

    expect(await screen.findByText("Compare Homes")).toBeInTheDocument();
    expect(screen.getByText("10 Rose Ave")).toBeInTheDocument();
    expect(screen.getByText("20 Emerald Rd")).toBeInTheDocument();
    expect(screen.getByText("Energy Rating")).toBeInTheDocument();
  });

  it("removes an individual listing from the comparison page", async () => {
    const user = userEvent.setup();

    renderComparisonPage(selectedListings);

    await screen.findByText("10 Rose Ave");
    await user.click(
      screen.getByRole("button", {
        name: /remove 10 rose ave from comparison/i,
      })
    );

    await waitFor(() => {
      expect(screen.queryByText("10 Rose Ave")).not.toBeInTheDocument();
    });
    expect(screen.getByText("20 Emerald Rd")).toBeInTheDocument();
  });

  it("clears all selected listings from the page", async () => {
    const user = userEvent.setup();

    renderComparisonPage(selectedListings);

    await screen.findByText("Compare Homes");
    await user.click(screen.getByRole("button", { name: /clear all/i }));

    expect(await screen.findByText(/no homes selected/i)).toBeInTheDocument();
  });
});
