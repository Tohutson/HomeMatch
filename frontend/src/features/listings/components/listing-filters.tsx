type DraftListingFilters = {
  minPrice: string;
  maxPrice: string;
  minBeds: string;
  minBaths: string;
  minSqft: string;
  maxSqft: string;
};

type ValidationErrors = Partial<Record<keyof DraftListingFilters, string>>;

type Props = {
  filters: DraftListingFilters;
  onFilterChange: (key: keyof DraftListingFilters, value: string) => void;
  onApply: () => void;
  onClear: () => void;
  isApplyDisabled: boolean;
  isClearDisabled: boolean;
  validationErrors: ValidationErrors;
  matchCount: number;
};

export default function ListingFilters({
  filters,
  onFilterChange,
  onApply,
  onClear,
  isApplyDisabled,
  isClearDisabled,
  validationErrors,
  matchCount,
}: Props) {
  return (
    <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <input
          type="number"
          min={0}
          placeholder="Min price"
          value={filters.minPrice}
          onChange={(e) => onFilterChange("minPrice", e.target.value)}
          className="rounded-lg border border-zinc-300 p-2"
        />

        <input
          type="number"
          min={0}
          placeholder="Max price"
          value={filters.maxPrice}
          onChange={(e) => onFilterChange("maxPrice", e.target.value)}
          className="rounded-lg border border-zinc-300 p-2"
        />

        <input
          type="number"
          min={0}
          placeholder="Min beds"
          value={filters.minBeds}
          onChange={(e) => onFilterChange("minBeds", e.target.value)}
          className="rounded-lg border border-zinc-300 p-2"
        />

        <input
          type="number"
          min={0}
          placeholder="Min baths"
          value={filters.minBaths}
          onChange={(e) => onFilterChange("minBaths", e.target.value)}
          className="rounded-lg border border-zinc-300 p-2"
        />

        <input
          type="number"
          min={0}
          placeholder="Min sqft"
          value={filters.minSqft}
          onChange={(e) => onFilterChange("minSqft", e.target.value)}
          className="rounded-lg border border-zinc-300 p-2"
        />

        <input
          type="number"
          min={0}
          placeholder="Max sqft"
          value={filters.maxSqft}
          onChange={(e) => onFilterChange("maxSqft", e.target.value)}
          className="rounded-lg border border-zinc-300 p-2"
        />
      </div>

      <div className="mt-2 space-y-1">
        {validationErrors.minPrice && (
          <p className="text-sm text-red-600">{validationErrors.minPrice}</p>
        )}

        {validationErrors.maxPrice && (
          <p className="text-sm text-red-600">{validationErrors.maxPrice}</p>
        )}

        {validationErrors.minBeds && (
          <p className="text-sm text-red-600">{validationErrors.minBeds}</p>
        )}

        {validationErrors.minBaths && (
          <p className="text-sm text-red-600">{validationErrors.minBaths}</p>
        )}

        {validationErrors.minSqft && (
          <p className="text-sm text-red-600">{validationErrors.minSqft}</p>
        )}

        {validationErrors.maxSqft && (
          <p className="text-sm text-red-600">{validationErrors.maxSqft}</p>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onApply}
          disabled={isApplyDisabled}
          className="rounded-lg bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Apply Filters
        </button>

        <button
          type="button"
          onClick={onClear}
          disabled={isClearDisabled}
          className="rounded-lg border border-zinc-300 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
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
