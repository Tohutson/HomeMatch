import type { ListingFilters as ListingFiltersType } from "@/features/listings/types";

type DraftListingFilters = {
  minPrice: string;
  maxPrice: string;
  minBeds: string;
  minBaths: string;
  minSqft: string;
  maxSqft: string;
};

type Props = {
  filters: DraftListingFilters;
  onFilterChange: (key: keyof ListingFiltersType, value: string) => void;
  onApply: () => void;
  onClear: () => void;
  hasActiveFilters: boolean;
  matchCount: number;
};

export default function ListingFilters({
  filters,
  onFilterChange,
  onApply,
  onClear,
  hasActiveFilters,
  matchCount,
}: Props) {
  return (
    <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <input
          type="number"
          placeholder="Min price"
          value={filters.minPrice}
          onChange={(e) => onFilterChange("minPrice", e.target.value)}
          className="rounded-lg border border-zinc-300 p-2"
        />

        <input
          type="number"
          placeholder="Max price"
          value={filters.maxPrice}
          onChange={(e) => onFilterChange("maxPrice", e.target.value)}
          className="rounded-lg border border-zinc-300 p-2"
        />

        <input
          type="number"
          placeholder="Min beds"
          value={filters.minBeds}
          onChange={(e) => onFilterChange("minBeds", e.target.value)}
          className="rounded-lg border border-zinc-300 p-2"
        />

        <input
          type="number"
          placeholder="Min baths"
          value={filters.minBaths}
          onChange={(e) => onFilterChange("minBaths", e.target.value)}
          className="rounded-lg border border-zinc-300 p-2"
        />

        <input
          type="number"
          placeholder="Min sqft"
          value={filters.minSqft}
          onChange={(e) => onFilterChange("minSqft", e.target.value)}
          className="rounded-lg border border-zinc-300 p-2"
        />

        <input
          type="number"
          placeholder="Max sqft"
          value={filters.maxSqft}
          onChange={(e) => onFilterChange("maxSqft", e.target.value)}
          className="rounded-lg border border-zinc-300 p-2"
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onApply}
          className="rounded-lg bg-black px-4 py-2 text-white"
        >
          Apply Filters
        </button>

        <button
          type="button"
          onClick={onClear}
          className="rounded-lg border border-zinc-300 px-4 py-2"
        >
          Clear
        </button>

        <p className="text-sm text-zinc-500">
          {matchCount} match{matchCount === 1 ? "" : "es"}
        </p>
      </div>
    </div>
  );
}