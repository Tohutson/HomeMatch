import type { Listing } from "@/features/listings/types";

type ComparisonTableProps = {
  listings: Listing[];
  onRemove: (listingId: string) => void;
};

type RowConfig = {
  label: string;
  getValue: (listing: Listing) => number | string | null | undefined;
  bestValue: "lowest" | "highest";
  format?: (value: number | string | null | undefined) => string;
};

function formatMoney(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return "N/A";
  }

  return `$${numberValue.toLocaleString()}`;
}

function formatNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  return String(value);
}

function getBestValue(
  listings: Listing[],
  row: RowConfig
): number | null {
  const values = listings
    .map((listing) => Number(row.getValue(listing)))
    .filter((value) => !Number.isNaN(value));

  if (values.length === 0) {
    return null;
  }

  if (row.bestValue === "lowest") {
    return Math.min(...values);
  }

  return Math.max(...values);
}

export default function ComparisonTable({
  listings,
  onRemove,
}: ComparisonTableProps) {
  const rows: RowConfig[] = [
    {
      label: "Price",
      getValue: (listing) => listing.price,
      bestValue: "lowest",
      format: formatMoney,
    },
    {
      label: "Beds",
      getValue: (listing) => listing.bedrooms,
      bestValue: "highest",
      format: formatNumber,
    },
    {
      label: "Baths",
      getValue: (listing) => listing.bathrooms,
      bestValue: "highest",
      format: formatNumber,
    },
    {
      label: "Square Footage",
      getValue: (listing) => listing.squareFootage,
      bestValue: "highest",
      format: formatNumber,
    },
    {
      label: "Energy Rating",
      getValue: (listing) => listing.energyStarScore,
      bestValue: "highest",
      format: formatNumber,
    },
  ];

  if (listings.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">
          No homes selected
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Go back to browse and select homes to compare.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <table className="w-full min-w-[900px] border-collapse text-left">
        <thead>
          <tr className="border-b border-zinc-200">
            <th className="w-40 px-5 py-4 text-sm font-semibold text-zinc-700">
              Feature
            </th>

            {listings.map((listing) => (
              <th
                key={listing.id}
                className="min-w-56 px-5 py-4 align-top text-sm font-semibold text-zinc-900"
              >
                <div className="space-y-3">
                  <p>
                    {listing.address}
                    {listing.city ? `, ${listing.city}` : ""}
                    {listing.state ? `, ${listing.state}` : ""}
                    {listing.zipCode ? ` ${listing.zipCode}` : ""}
                  </p>

                  <button
                    type="button"
                    onClick={() => onRemove(String(listing.id))}
                    className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
                  >
                    Remove
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const bestValue = getBestValue(listings, row);

            return (
              <tr key={row.label} className="border-b border-zinc-100">
                <td className="px-5 py-5 text-sm font-semibold text-zinc-900">
                  {row.label}
                </td>

                {listings.map((listing) => {
                  const rawValue = row.getValue(listing);
                  const numericValue = Number(rawValue);
                  const isBest =
                    bestValue !== null &&
                    !Number.isNaN(numericValue) &&
                    numericValue === bestValue;

                  return (
                    <td
                      key={`${listing.id}-${row.label}`}
                      className={`px-5 py-5 text-sm ${
                        isBest
                          ? "bg-green-100 font-bold text-green-800"
                          : "text-zinc-900"
                      }`}
                    >
                      {row.format ? row.format(rawValue) : formatNumber(rawValue)}
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