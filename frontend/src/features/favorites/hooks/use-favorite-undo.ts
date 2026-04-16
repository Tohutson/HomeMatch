import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Listing } from "@/features/listings/types";

type FavoriteMutationResult =
  | { ok: true }
  | {
      ok: false;
      reason: "missing_user" | "already_exists" | "request_failed";
    };

type UseFavoriteUndoParams = {
  addFavorite: (listingId: number) => Promise<FavoriteMutationResult>;
  removeFavorite: (listingId: number) => Promise<FavoriteMutationResult>;
  onToast?: (message: string) => void;
  undoWindowSeconds?: number;
};

type UseFavoriteUndoResult = {
  recordAddedFavorite: (listing: Listing) => void;
  handleUndo: () => Promise<void>;
  handleRedo: () => Promise<void>;
  canUndo: boolean;
  canRedo: boolean;
  undoVisible: boolean;
  undoTimeLeft: number;
  showBanner: boolean;
};

type FavoriteUndoEntry = {
  listing: Listing;
};

export function useFavoriteUndo({
  addFavorite,
  removeFavorite,
  onToast,
  undoWindowSeconds = 10,
}: UseFavoriteUndoParams): UseFavoriteUndoResult {
  const [undoStack, setUndoStack] = useState<FavoriteUndoEntry[]>([]);
  const [redoStack, setRedoStack] = useState<FavoriteUndoEntry[]>([]);
  const [undoTimeLeft, setUndoTimeLeft] = useState(0);
  const [redoVisible, setRedoVisible] = useState(false);

  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const redoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearUndoTimer = useCallback(() => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }

    if (undoIntervalRef.current) {
      clearInterval(undoIntervalRef.current);
      undoIntervalRef.current = null;
    }
  }, []);

  const clearRedoTimer = useCallback(() => {
    if (redoTimerRef.current) {
      clearTimeout(redoTimerRef.current);
      redoTimerRef.current = null;
    }
  }, []);

  const startUndoTimer = useCallback(() => {
    clearUndoTimer();
    setUndoTimeLeft(undoWindowSeconds);

    undoIntervalRef.current = setInterval(() => {
      setUndoTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    undoTimerRef.current = setTimeout(() => {
      setUndoTimeLeft(0);
      clearUndoTimer();
    }, undoWindowSeconds * 1000);
  }, [clearUndoTimer, undoWindowSeconds]);

  const startRedoTimer = useCallback(() => {
    clearRedoTimer();
    setRedoVisible(true);

    redoTimerRef.current = setTimeout(() => {
      setRedoStack([]);
      setRedoVisible(false);
      clearRedoTimer();
    }, undoWindowSeconds * 1000);
  }, [clearRedoTimer, undoWindowSeconds]);

  useEffect(() => {
    return () => {
      clearUndoTimer();
      clearRedoTimer();
    };
  }, [clearRedoTimer, clearUndoTimer]);

  const recordAddedFavorite = useCallback(
    (listing: Listing) => {
      setUndoStack([{ listing }]);
      setRedoStack([]);
      setRedoVisible(false);
      clearRedoTimer();
      startUndoTimer();
    },
    [clearRedoTimer, startUndoTimer]
  );

  const handleUndo = useCallback(async () => {
    const latest = undoStack[undoStack.length - 1];
    if (!latest || undoTimeLeft <= 0) return;

    const result = await removeFavorite(latest.listing.id);

    if (!result.ok) {
      onToast?.("Failed to undo favorite");
      return;
    }

    setUndoStack([]);
    setRedoStack([latest]);
    startRedoTimer();
    setUndoTimeLeft(0);
    clearUndoTimer();
    onToast?.(`Removed ${latest.listing.address ?? "listing"} from favorites`);
  }, [
    undoStack,
    undoTimeLeft,
    removeFavorite,
    clearUndoTimer,
    onToast,
    startRedoTimer,
  ]);

  const handleRedo = useCallback(async () => {
    const latest = redoStack[redoStack.length - 1];
    if (!latest) return;

    const result = await addFavorite(latest.listing.id);

    if (!result.ok) {
      if (result.reason === "already_exists") {
        setRedoStack([]);
        setRedoVisible(false);
        clearRedoTimer();
        onToast?.("Listing is already in favorites");
        return;
      }

      onToast?.("Failed to redo favorite");
      return;
    }

    setRedoStack([]);
    setRedoVisible(false);
    clearRedoTimer();
    setUndoStack([latest]);
    startUndoTimer();
    onToast?.("Favorite restored");
  }, [redoStack, addFavorite, clearRedoTimer, startUndoTimer, onToast]);

  const canUndo = undoStack.length > 0 && undoTimeLeft > 0;
  const canRedo = redoStack.length > 0 && redoVisible;
  const undoVisible = undoStack.length > 0 && undoTimeLeft > 0;
  const showBanner = undoVisible || redoVisible;

  return {
    recordAddedFavorite,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    undoVisible,
    undoTimeLeft,
    showBanner,
  };
}
