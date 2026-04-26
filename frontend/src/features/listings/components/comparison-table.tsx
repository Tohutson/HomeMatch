"use client";

import type { Listing } from "../types";

type ComparisonTableProps = {
  listings: Listing[];
  onRemove: (listingId: number) => void;
};

function formatPrice(price?: number | null) {
  if (price === undefined || price === null) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatValue(value?: number | null) {
  if (value === undefined || value === null) {
    return "N/A";
  }

  return String(value);
}

function toNumber(value: number | string | null | undefined) {
    if (value === undefined || value === null || value === "") {
      return null;
    }
  
    const numericValue = Number(value);
  
    if (Number.isNaN(numericValue)) {
      return null;
    }
  
    return numericValue;
  }
  
  function getBestValue(
    listings: Listing[],
    getValue: (listing: Listing) => number | string | null | undefined,
    mode: "min" | "max"
  ) {
    const values = listings
      .map((listing) => toNumber(getValue(listing)))
      .filter((value): value is number => value !== null);
  
    if (values.length === 0) {
      return null;
    }
  
    return mode === "min" ? Math.min(...values) : Math.max(...values);
  }
  
  function isBestValue(
    listing: Listing,
    bestValue: number | null,
    getValue: (listing: Listing) => number | string | null | undefined
  ) {
    const value = toNumber(getValue(listing));
  
    if (bestValue === null || value === null) {
      return false;
    }
  
    return value === bestValue;
  }
  
  function bestStyle(isBest: boolean) {
    if (!isBest) {
      return {};
    }
  
    return {
      backgroundColor: "#bbf7d0",
      color: "#166534",
      fontWeight: 700,
      borderRadius: "8px",
      padding: "4px 8px",
      display: "inline-block",
    };
  }

export function ComparisonTable({ listings, onRemove }: ComparisonTableProps) {
  const bestPrice = getBestValue(listings, (listing) => listing.price, "min");
  const bestBeds = getBestValue(listings, (listing) => listing.beds, "max");
  const bestBaths = getBestValue(listings, (listing) => listing.baths, "max");
  const bestSqft = getBestValue(listings, (listing) => listing.sqft, "max");
  const bestEnergy = getBestValue(
    listings,
    (listing) => listing.energyStarScore,
    "max"
  );

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="p-4 font-semibold text-gray-700">Feature</th>

            {listings.map((listing) => (
              <th key={listing.id} className="p-4 align-top font-semibold text-gray-900">
                <div className="space-y-3">
                  <div>
                    {listing.address ?? "Unknown Address"}
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemove(listing.id)}
                    className="rounded-full bg-emerald-500 px-4 py-1 text-sm font-semibold text-white hover:bg-emerald-600"
                  >
                    Remove
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          <tr className="border-b border-gray-200">
            <td className="p-4 font-semibold text-gray-900">Price</td>
            {listings.map((listing) => (
              <td key={listing.id} className="p-4">
                <span style={bestStyle(isBestValue(listing, bestPrice, (item) => item.price))}>
                    {formatPrice(listing.price)}
                </span>
              </td>
            ))}
          </tr>

          <tr className="border-b border-gray-200">
            <td className="p-4 font-semibold text-gray-900">Beds</td>
            {listings.map((listing) => (
              <td key={listing.id} className="p-4">
                <span style={bestStyle(isBestValue(listing, bestBeds, (item) => item.beds))}>
                    {formatValue(listing.beds)}
                </span>
              </td>
            ))}
          </tr>

          <tr className="border-b border-gray-200">
            <td className="p-4 font-semibold text-gray-900">Baths</td>
            {listings.map((listing) => (
              <td key={listing.id} className="p-4">
                <span style={bestStyle(isBestValue(listing, bestBaths, (item) => item.baths))}>
                    {formatValue(listing.baths)}
                </span>
              </td>
            ))}
          </tr>

          <tr className="border-b border-gray-200">
            <td className="p-4 font-semibold text-gray-900">Square Footage</td>
            {listings.map((listing) => (
              <td key={listing.id} className="p-4">
                <span style={bestStyle(isBestValue(listing, bestSqft, (item) => item.sqft))}>
                    {formatValue(listing.sqft)}
                </span>
              </td>
            ))}
          </tr>

          <tr>
            <td className="p-4 font-semibold text-gray-900">Energy Rating</td>
            {listings.map((listing) => (
              <td key={listing.id} className="p-4">
                <span
                    style={bestStyle(
                        isBestValue(listing, bestEnergy, (item) => item.energyStarScore)
                    )}
                >
                    {formatValue(listing.energyStarScore)}
                </span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}