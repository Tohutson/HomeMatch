"use client";

import Link from "next/link";

type ComparisonBarProps = {
  selectedCount: number;
  onClear: () => void;
};

export default function ComparisonBar({
  selectedCount,
  onClear,
}: ComparisonBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="mx-auto mb-6 flex max-w-7xl items-center justify-between rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">
      <div>
        <p className="text-sm font-medium text-zinc-900">
          {selectedCount} of 4 homes selected for comparison
        </p>
        <p className="text-sm text-zinc-500">
          Select up to 4 homes, then compare them side by side
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          href="/compare"
          className="rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
        >
          Compare Now
        </Link>

        <button
          type="button"
          onClick={onClear}
          className="rounded-full bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-300"
        >
          Clear
        </button>
      </div>
    </div>
  );
}