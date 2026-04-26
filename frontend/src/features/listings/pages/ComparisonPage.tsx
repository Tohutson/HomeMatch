"use client";

import { ComparisonTable } from "@/features/listings/components/comparison-table";
import { useComparison } from "@/features/listings/context/comparison-context";
import Link from "next/link";

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
            Back to Listings
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
              className="rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
            >
              Clear All
            </button>
          </div>
        </div>

        <ComparisonTable listings={comparedListings} onRemove={removeListing} />
      </div>
    </main>
  );
}
