type ListingsBannerProps = {
    show: boolean;
    canUndo: boolean;
    canRedo: boolean;
    undoVisible: boolean;
    undoTimeLeft: number;
    onUndo: () => void;
    onRedo: () => void;
  };
  
  export function ListingsBanner({
    show,
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
        className="mb-4 flex items-center gap-3 rounded-lg bg-zinc-800 px-4 py-3 text-white"
        data-testid="undo-redo-banner"
      >
        <span className="flex-1">
          {canUndo
            ? "Added to favorites!"
            : canRedo
            ? "Property removed — redo available."
            : "Undo window expired."}
        </span>
  
        {canRedo && (
          <button
            onClick={onRedo}
            className="rounded-md border border-white px-3 py-1 text-sm font-medium hover:bg-zinc-700"
            data-testid="redo-button"
          >
            Redo
          </button>
        )}
  
        {undoVisible && (
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="rounded-md bg-white px-3 py-1 text-sm font-medium text-zinc-800 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
            data-testid="undo-button"
          >
            {canUndo ? `Undo (${undoTimeLeft}s)` : "Undo"}
          </button>
        )}
      </div>
    );
  }