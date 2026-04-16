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
      className="fixed top-24 left-1/2 z-50 grid w-[min(88vw,40rem)] -translate-x-1/2 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[24px] border border-white/10 bg-slate-900/72 px-4 py-3 text-white shadow-[0_18px_50px_rgba(15,23,42,0.18)] backdrop-blur-md animate-banner-fade-in"
      data-testid="undo-redo-banner"
    >
      <div className="min-w-0 text-sm font-medium text-white/90">
        {pendingFavorite ? (
          <p>Saving favorite...</p>
        ) : undoVisible ? (
          <p>Added to favorites. Undo available for {undoTimeLeft}s.</p>
        ) : canRedo ? (
          <p>Favorite removed. Redo is available.</p>
        ) : null}
      </div>

      <div className="flex min-h-10 min-w-[8.5rem] items-center justify-end gap-2">
        {undoVisible && (
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="rounded-full bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            data-testid="undo-button"
          >
            {canUndo ? `Undo (${undoTimeLeft}s)` : "Undo"}
          </button>
        )}

        {canRedo && (
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="rounded-full border border-white/20 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            data-testid="redo-button"
          >
            Redo
          </button>
        )}
      </div>
    </div>
  );
}
