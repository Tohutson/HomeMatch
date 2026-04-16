type ListingsBannerProps = {
  show: boolean;
  pendingFavorite: boolean;
  canUndo: boolean;
  canRedo: boolean;
  undoVisible: boolean;
  undoTimeLeft: number;
  onUndo: () => void;
  onRedo: () => void;
};

export function ListingsBanner({
  show,
  pendingFavorite,
  canUndo,
  canRedo,
  undoVisible,
  undoTimeLeft,
  onUndo,
  onRedo,
}: ListingsBannerProps) {
  if (!show) return null;

  return (
    <div
      className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-slate-900/10 bg-slate-900 px-5 py-4 text-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]"
      data-testid="undo-redo-banner"
    >
      <div className="text-sm font-medium text-white/90">
        {pendingFavorite ? (
          <p>Saving favorite...</p>
        ) : undoVisible ? (
          <p>Added to favorites. Undo available for {undoTimeLeft}s.</p>
        ) : canRedo ? (
          <p>Favorite removed. Redo is available.</p>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        {undoVisible && (
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            data-testid="undo-button"
          >
            {canUndo ? `Undo (${undoTimeLeft}s)` : "Undo"}
          </button>
        )}

        {canRedo && (
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            data-testid="redo-button"
          >
            Redo
          </button>
        )}
      </div>
    </div>
  );
}
