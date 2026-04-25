"use client";

import { useComparison } from "@/features/listings/context/comparison-context";
import Link from "next/link";

function formatMoney(value?: number | null) {
  if (value == null) return "N/A";
  return `$${value.toLocaleString()}`;
}

export default function ComparisonPage() {
  const { comparedListings, removeListing, clearComparison } = useComparison();

  if (comparedListings.length === 0) {
    return (
      <main className="min-h-screen bg-zinc-50 p-8 text-black">
        <div className="mx-auto max-w-5xl rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <h1 className="mb-3 text-2xl font-semibold">No homes selected</h1>
          <p className="mb-6 text-zinc-500">
            Go back to the listings page and choose up to 4 homes to compare.
          </p>

          <Link
            href="/listings"
            className="inline-flex rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
          >
            Back to Browse
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-8 text-black">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Compare Homes</h1>
            <p className="text-zinc-500">
              Side-by-side comparison for your selected properties
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/listings"
              className="rounded-full bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-300"
            >
              Back to Browse
            </Link>

            <button
              type="button"
              onClick={clearComparison}
              className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="p-4 text-left text-sm font-semibold text-zinc-700">
                  Feature
                </th>
                {comparedListings.map((listing) => (
                  <th
                    key={listing.id}
                    className="min-w-[220px] p-4 text-left align-top"
                  >
                    <div className="space-y-2">
                      <div className="font-semibold text-zinc-950">
                        {listing.address}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeListing(listing.id)}
                        className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-600"
                      >
                        Remove
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              <tr className="border-b border-zinc-200">
                <td className="p-4 font-medium">Price</td>
                {comparedListings.map((listing) => (
                  <td key={listing.id} className="p-4">
                    {formatMoney(listing.price)}
                  </td>
                ))}
              </tr>

              <tr className="border-b border-zinc-200">
                <td className="p-4 font-medium">Beds</td>
                {comparedListings.map((listing) => (
                  <td key={listing.id} className="p-4">
                    {listing.beds ?? "N/A"}
                  </td>
                ))}
              </tr>

              <tr className="border-b border-zinc-200">
                <td className="p-4 font-medium">Baths</td>
                {comparedListings.map((listing) => (
                  <td key={listing.id} className="p-4">
                    {listing.baths ?? "N/A"}
                  </td>
                ))}
              </tr>

              <tr className="border-b border-zinc-200">
                <td className="p-4 font-medium">Square Footage</td>
                {comparedListings.map((listing) => (
                  <td key={listing.id} className="p-4">
                    {listing.sqft ?? "N/A"}
                  </td>
                ))}
              </tr>

              <tr className="border-b border-zinc-200">
                <td className="p-4 font-medium">Energy Rating</td>
                {comparedListings.map((listing) => (
                  <td key={listing.id} className="p-4">
                    {"energyStarScore" in listing
                      ? String((listing as { energyStarScore?: number }).energyStarScore ?? "N/A")
                      : "N/A"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}