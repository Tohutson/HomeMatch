"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import ListingCard, { Listing } from "./components/ListingCard";
import Toast from "./components/Toast";
import NotLoggedInModal from "./components/NotLoggedInModal";
import { getOrCreateUserId } from "./lib/userId";
import {
  enqueueOfflineFavorite,
  flushOfflineQueue,
  getOfflineQueue,
} from "./lib/offlineQueue";

type ListingsResponse = {
  content: Listing[];
  totalPages: number;
};

const API_BASE  = "http://localhost:8081";
const PAGE_SIZE = 12;
const UNDO_MS   = 10_000;

export default function Home() {
  const [listings, setListings]         = useState<Listing[]>([]);
  const [currentPage, setCurrentPage]   = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalPages, setTotalPages]     = useState(0);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");

  const [userId, setUserId]             = useState<number | null>(null);
  const [favoriteIds, setFavoriteIds]   = useState<Set<number>>(new Set());
  const [undoStack, setUndoStack]       = useState<Listing[]>([]);
  const [undoTimeLeft, setUndoTimeLeft] = useState(0);
  const [redoStack, setRedoStack]       = useState<Listing[]>([]);
  const [toast, setToast]               = useState<string | null>(null);
  const [showNotLoggedIn, setShowNotLoggedIn] = useState(false);
  const [syncingIds, setSyncingIds]     = useState<Set<number>>(new Set());

  const undoTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getOrCreateUserId().then(setUserId).catch(console.error);
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetch(`${API_BASE}/api/users/${userId}/favorites`)
      .then((r) => r.json())
      .then((data: { listing: Listing }[]) =>
        setFavoriteIds(new Set(data.map((f) => f.listing.id)))
      )
      .catch(console.error);
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`${API_BASE}/api/listings?page=${currentPage}&size=${PAGE_SIZE}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch listings");
        return res.json();
      })
      .then((data: ListingsResponse) => {
        setListings(data.content || []);
        setTotalPages(data.totalPages || 0);
        setLoading(false);
      })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [currentPage]);

  useEffect(() => {
    if (!userId) return;
    const handleOnline = async () => {
      const queued = getOfflineQueue();
      if (queued.length === 0) return;
      setToast("Connection restored. Syncing your favorites...");
      const synced = await flushOfflineQueue(API_BASE);
      if (synced > 0) {
        const res = await fetch(`${API_BASE}/api/users/${userId}/favorites`);
        if (res.ok) {
          const data: { listing: Listing }[] = await res.json();
          setFavoriteIds(new Set(data.map((f) => f.listing.id)));
        }
        setSyncingIds(new Set());
        setToast("Favorites synced!");
      }
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [userId]);

  const clearUndoTimer = useCallback(() => {
    if (undoTimerRef.current)    clearTimeout(undoTimerRef.current);
    if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
  }, []);

  const startUndoTimer = useCallback(() => {
    clearUndoTimer();
    setUndoTimeLeft(UNDO_MS / 1000);
    undoIntervalRef.current = setInterval(() => {
      setUndoTimeLeft((t) => {
        if (t <= 1) { clearInterval(undoIntervalRef.current!); return 0; }
        return t - 1;
      });
    }, 1000);
    undoTimerRef.current = setTimeout(() => {
      setUndoStack([]);
      setUndoTimeLeft(0);
      setToast("Undo window expired. Remove from Favorites page instead.");
    }, UNDO_MS);
  }, [clearUndoTimer]);

  useEffect(() => () => clearUndoTimer(), [clearUndoTimer]);

  const handleNext = useCallback(() => {
    if (currentIndex < listings.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else if (currentPage < totalPages - 1) {
      setCurrentPage((p) => p + 1);
      setCurrentIndex(0);
    }
  }, [currentIndex, listings.length, currentPage, totalPages]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    } else if (currentPage > 0) {
      setCurrentPage((p) => p - 1);
      setCurrentIndex(0);
    }
  }, [currentIndex, currentPage]);

  const handleFavorite = useCallback(
    async (listing: Listing) => {
      if (!userId) {
        setShowNotLoggedIn(true);
        return;
      }

      if (favoriteIds.has(listing.id)) {
        await fetch(
          `${API_BASE}/api/users/${userId}/favorites/${listing.id}`,
          { method: "DELETE" }
        );
        setFavoriteIds((prev) => {
          const n = new Set(prev); n.delete(listing.id); return n;
        });
        setUndoStack((prev) => prev.filter((l) => l.id !== listing.id));
        setToast("Removed from Favorites");
        return;
      }

      if (!navigator.onLine) {
        enqueueOfflineFavorite({ userId, listingId: listing.id });
        setSyncingIds((prev) => new Set(prev).add(listing.id));
        setFavoriteIds((prev) => new Set(prev).add(listing.id));
        setToast("Saved locally. Will sync when connection restored.");
        handleNext();
        return;
      }

      let res: Response;
      try {
        res = await fetch(
          `${API_BASE}/api/users/${userId}/favorites`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ listingId: listing.id }),
          }
        );
      } catch {
        enqueueOfflineFavorite({ userId, listingId: listing.id });
        setSyncingIds((prev) => new Set(prev).add(listing.id));
        setFavoriteIds((prev) => new Set(prev).add(listing.id));
        setToast("Saved locally. Will sync when connection restored.");
        handleNext();
        return;
      }

      if (res.status === 409) {
        setToast("This home is already in your favorites");
        return;
      }
      if (!res.ok) {
        setToast("Unable to save favorite. Please try again.");
        return;
      }
      if (res.ok) {
        setFavoriteIds((prev) => new Set(prev).add(listing.id));
        setUndoStack((prev) => [...prev, listing]);
        setRedoStack([]);
        startUndoTimer();
        setToast("Added to Favorites");
        handleNext();
      }
    },
    [userId, favoriteIds, startUndoTimer, handleNext]
  );

  const handleUndo = useCallback(async () => {
    if (!userId) return;

    if (undoStack.length === 0) {
      setToast("No recent likes to undo");
      return;
    }

    const poppedListing = undoStack[undoStack.length - 1];

    let failed = false;
    try {
      const res = await fetch(
        `${API_BASE}/api/users/${userId}/favorites/${poppedListing.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        failed = true;
        setToast("Unable to undo. Please try again.");
      }
    } catch {
      failed = true;
      setToast("Unable to undo. Please try again.");
    }

    if (failed) return;

    setFavoriteIds((prev) => {
      const n = new Set(prev); n.delete(poppedListing.id); return n;
    });
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, poppedListing]);

    const indexInPage = listings.findIndex((l) => l.id === poppedListing.id);
    if (indexInPage !== -1) setCurrentIndex(indexInPage);

    setToast(
      `Removed ${poppedListing.address ?? "property"} from favorites`
    );

    if (undoStack.length > 1) startUndoTimer();
  }, [userId, undoStack, listings, startUndoTimer]);

  const handleRedo = useCallback(async () => {
    if (!userId || redoStack.length === 0) return;
    const listingToRedo = redoStack[redoStack.length - 1];
    const res = await fetch(
      `${API_BASE}/api/users/${userId}/favorites`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listingToRedo.id }),
      }
    );
    if (res.ok) {
      setFavoriteIds((prev) => new Set(prev).add(listingToRedo.id));
      setRedoStack((prev) => prev.slice(0, -1));
      setUndoStack((prev) => [...prev, listingToRedo]);
      startUndoTimer();
      setToast("Added back to Favorites");
    }
    if (res.status === 409) {
      setToast("This home is already in your favorites");
      return;
    }
    if (!res.ok) {
      setToast("Unable to add back to favorites. Please try again.");
      return;
    }
  }, [userId, redoStack, startUndoTimer]);

  const handleSwipeRight = useCallback(() => {
    const current = listings[currentIndex];
    if (current && !favoriteIds.has(current.id)) {
      handleFavorite(current);
    } else {
      handleNext();
    }
  }, [listings, currentIndex, favoriteIds, handleFavorite, handleNext]);

  const handleSwipeLeft = useCallback(() => handleNext(), [handleNext]);

  const canUndo     = undoStack.length > 0 && undoTimeLeft > 0;
  const undoVisible = undoTimeLeft > 0;
  const canRedo     = redoStack.length > 0;
  const showBanner  = undoVisible || canRedo;

  if (loading) return (
    <main className="min-h-screen p-8 bg-zinc-50 text-black">
      <h1 className="text-3xl font-bold mb-4">HomeMatch Listings</h1>
      <p>Loading listings...</p>
    </main>
  );

  if (error) return (
    <main className="min-h-screen p-8 bg-zinc-50 text-black">
      <h1 className="text-3xl font-bold mb-4">HomeMatch Listings</h1>
      <p>Error: {error}</p>
    </main>
  );

  if (listings.length === 0) return (
    <main className="min-h-screen bg-zinc-50 p-8 text-black">
      <h1 className="mb-4 text-3xl font-bold">HomeMatch Listings</h1>
      <p>No listings found.</p>
    </main>
  );

  const currentListing = listings[currentIndex];
  const isFirst = currentPage === 0 && currentIndex === 0;
  const isLast  = currentPage === totalPages - 1 &&
                  currentIndex === listings.length - 1;

  return (
    <main className="min-h-screen bg-zinc-50 p-8 text-black">
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      {showNotLoggedIn && (
        <NotLoggedInModal
          onDismiss={() => setShowNotLoggedIn(false)}
          onLogIn={() => {
            setShowNotLoggedIn(false);
            getOrCreateUserId().then(setUserId).catch(console.error);
          }}
        />
      )}

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">HomeMatch Listings</h1>
        <Link
          href="/favorites"
          className="rounded-lg bg-rose-500 px-4 py-2 text-white
                     hover:bg-rose-600 transition-colors"
          data-testid="favorites-nav-link"
        >
          ♥ Favorites ({favoriteIds.size})
        </Link>
      </div>

      {showBanner && (
        <div
          className="mb-4 flex items-center gap-3 rounded-lg bg-zinc-800
                     px-4 py-3 text-white"
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
              onClick={handleRedo}
              className="rounded-md border border-white px-3 py-1 text-sm
                         font-medium hover:bg-zinc-700"
              data-testid="redo-button"
            >
              Redo
            </button>
          )}

          {undoVisible && (
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="rounded-md bg-white px-3 py-1 text-sm font-medium
                         text-zinc-800 hover:bg-zinc-100
                         disabled:cursor-not-allowed disabled:opacity-40"
              data-testid="undo-button"
            >
              {canUndo ? `Undo (${undoTimeLeft}s)` : "Undo"}
            </button>
          )}
        </div>
      )}

      <div className="mx-auto max-w-2xl">
        <ListingCard
          listing={currentListing}
          isFavorited={favoriteIds.has(currentListing.id)}
          isSyncing={syncingIds.has(currentListing.id)}
          onFavorite={handleFavorite}
          onSwipeRight={handleSwipeRight}
          onSwipeLeft={handleSwipeLeft}
        />

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={isFirst}
            className="rounded-lg bg-zinc-800 px-4 py-2 text-white
                       disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            Previous
          </button>
          <p className="text-sm text-zinc-600">
            Page {currentPage + 1} of {Math.max(totalPages, 1)}
          </p>
          <button
            onClick={handleNext}
            disabled={isLast}
            className="rounded-lg bg-zinc-800 px-4 py-2 text-white
                       disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            Next
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-zinc-400">
          Swipe right to favorite · Swipe left to skip
        </p>
      </div>
    </main>
  );
}