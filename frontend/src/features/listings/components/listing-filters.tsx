import type { KeyboardEvent } from "react";
import { DraftListingFilters } from "../types";

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

const INVALID_NUMBER_KEYS = new Set(["-", "+", ".", "e", "E"]);

function handleNumberKeyDown(event: KeyboardEvent<HTMLInputElement>) {
  if (
    INVALID_NUMBER_KEYS.has(event.key) &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  ) {
    event.preventDefault();
  }
}

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
    <aside className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">
          Refine Results
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">
          Filter homes faster
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {matchCount} match{matchCount === 1 ? "" : "es"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <input
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          placeholder="Min price"
          value={filters.minPrice}
          onChange={(e) => onFilterChange("minPrice", e.target.value)}
          onKeyDown={handleNumberKeyDown}
          className="rounded-lg border border-zinc-300 p-2"
        />

        <input
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          placeholder="Max price"
          value={filters.maxPrice}
          onChange={(e) => onFilterChange("maxPrice", e.target.value)}
          onKeyDown={handleNumberKeyDown}
          className="rounded-lg border border-zinc-300 p-2"
        />

        <input
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          placeholder="Min beds"
          value={filters.minBeds}
          onChange={(e) => onFilterChange("minBeds", e.target.value)}
          onKeyDown={handleNumberKeyDown}
          className="rounded-lg border border-zinc-300 p-2"
        />

        <input
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          placeholder="Min baths"
          value={filters.minBaths}
          onChange={(e) => onFilterChange("minBaths", e.target.value)}
          onKeyDown={handleNumberKeyDown}
          className="rounded-lg border border-zinc-300 p-2"
        />

        <input
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          placeholder="Min sqft"
          value={filters.minSqft}
          onChange={(e) => onFilterChange("minSqft", e.target.value)}
          onKeyDown={handleNumberKeyDown}
          className="rounded-lg border border-zinc-300 p-2"
        />

        <input
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          placeholder="Max sqft"
          value={filters.maxSqft}
          onChange={(e) => onFilterChange("maxSqft", e.target.value)}
          onKeyDown={handleNumberKeyDown}
          className="rounded-lg border border-zinc-300 p-2"
        />

        <input
          type="number"
          min={0}
          max={100}
          step={1}
          inputMode="numeric"
          placeholder="Min Energy Star Score"
          value={filters.minEnergyStarScore}
          onChange={(e) => onFilterChange("minEnergyStarScore", e.target.value)}
          onKeyDown={handleNumberKeyDown}
          className="rounded-lg border border-zinc-300 p-2"
        />
      </div>

      <div className="mt-3 min-h-0 space-y-1">
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

        {validationErrors.minEnergyStarScore && (
          <p className="text-sm text-red-600">
            {validationErrors.minEnergyStarScore}
          </p>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onApply}
          disabled={isApplyDisabled}
          className="rounded-full bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Apply Filters
        </button>

        <button
          type="button"
          onClick={onClear}
          disabled={isClearDisabled}
          className="rounded-full border border-zinc-300 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear
        </button>
      </div>
    </aside>
  );
}
