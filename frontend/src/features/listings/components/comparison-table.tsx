"use client";

import type { Listing } from "../types";

type ComparisonTableProps = {
  listings: Listing[];
  onRemove: (listingId: number) => void;
};

type ComparisonRow = {
  label: string;
  format: (listing: Listing) => string;
  getValue: (listing: Listing) => number | null | undefined;
  best: "min" | "max";
};

function formatPrice(price?: number | null) {
  if (price === undefined || price === null) {
    return "N/A";
  }

  return `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function formatValue(value?: number | null) {
  if (value === undefined || value === null) {
    return "N/A";
  }

  return String(value);
}

function getBestValue(listings: Listing[], row: ComparisonRow) {
  const values = listings
    .map(row.getValue)
    .filter((value): value is number => value !== undefined && value !== null);

  if (values.length === 0) {
    return null;
  }

  return row.best === "min" ? Math.min(...values) : Math.max(...values);
}

function isBestValue(listing: Listing, row: ComparisonRow, bestValue: number | null) {
  const value = row.getValue(listing);

  return bestValue !== null && value !== undefined && value !== null && value === bestValue;
}

const rows: ComparisonRow[] = [
  {
    label: "Price",
    format: (listing) => formatPrice(listing.price),
    getValue: (listing) => listing.price,
    best: "min",
  },
  {
    label: "Beds",
    format: (listing) => formatValue(listing.beds),
    getValue: (listing) => listing.beds,
    best: "max",
  },
  {
    label: "Baths",
    format: (listing) => formatValue(listing.baths),
    getValue: (listing) => listing.baths,
    best: "max",
  },
  {
    label: "Square Footage",
    format: (listing) => formatValue(listing.sqft),
    getValue: (listing) => listing.sqft,
    best: "max",
  },
  {
    label: "Energy Rating",
    format: (listing) => formatValue(listing.energyStarScore),
    getValue: (listing) => listing.energyStarScore,
    best: "max",
  },
];

export function ComparisonTable({ listings, onRemove }: ComparisonTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-zinc-200">
            <th className="p-4 font-semibold text-zinc-700">Feature</th>

            {listings.map((listing) => (
              <th key={listing.id} className="p-4 align-top font-semibold text-zinc-900">
                <div className="space-y-3">
                  <div>{listing.address ?? "Unknown Address"}</div>

                  <button
                    type="button"
                    onClick={() => onRemove(listing.id)}
                    aria-label={`Remove ${listing.address ?? "home"} from comparison`}
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
          {rows.map((row, rowIndex) => {
            const bestValue = getBestValue(listings, row);

            return (
              <tr
                key={row.label}
                className={rowIndex === rows.length - 1 ? "" : "border-b border-zinc-200"}
              >
                <td className="p-4 font-semibold text-zinc-900">{row.label}</td>
                {listings.map((listing) => {
                  const isBest = isBestValue(listing, row, bestValue);

                  return (
                    <td key={listing.id} className="p-4">
                      <span
                        data-testid={isBest ? "best-value" : undefined}
                        className={
                          isBest
                            ? "inline-block rounded-lg bg-emerald-100 px-2 py-1 font-bold text-emerald-700"
                            : undefined
                        }
                      >
                        {row.format(listing)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
