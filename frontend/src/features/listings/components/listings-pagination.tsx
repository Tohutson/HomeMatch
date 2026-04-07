type ListingsPaginationProps = {
  currentPage: number;
  totalPages: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export function ListingsPagination({
  currentPage,
  totalPages,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
}: ListingsPaginationProps) {
  return (
    <div className="mt-6 flex items-center justify-between">
      <button
        onClick={onPrevious}
        disabled={!canGoPrevious}
        className="rounded-lg bg-zinc-800 px-4 py-2 text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        Previous
      </button>

      <p className="text-sm text-zinc-600">
        Page {currentPage + 1} of {Math.max(totalPages, 1)}
      </p>

      <button
        onClick={onNext}
        disabled={!canGoNext}
        className="rounded-lg bg-zinc-800 px-4 py-2 text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        Next
      </button>
    </div>
  );
}
