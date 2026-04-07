"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Toast from "@/components/Toast";
import { getOrCreateUserId } from "@/lib/userId";
import { useFavorites } from "@/features/favorites/hooks/use-favorites";
import { useFavoriteUndo } from "@/features/favorites/hooks/use-favorite-undo";
import { useFavoritesSync } from "@/features/favorites/hooks/use-favorites-sync";
import { useFavoriteListings } from "../hooks/use-favorite-listings";
import { FavoriteRecord } from "../types";
import { API_BASE } from "@/lib/env";

type SortOption = "date_desc" | "date_asc" | "price_asc" | "price_desc";

export default function FavoritesPage() {
  const [userId, setUserId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("date_desc");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [unavailableIds, setUnavailableIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    getOrCreateUserId().then(setUserId).catch(console.error);
  }, []);

  const { favorites, loading, error, refetchFavorites } = useFavoriteListings({
    userId,
  });

  const {
    addFavorite: addFavoriteRequest,
    removeFavorite: removeFavoriteRequest,
  } = useFavorites({ userId });

  const removeFavoriteFromPage = useCallback(
    async (listingId: number) => {
      const result = await removeFavoriteRequest(listingId);

      if (result.ok) {
        await refetchFavorites();
        setUnavailableIds((prev) => {
          const next = new Set(prev);
          next.delete(listingId);
          return next;
        });
      }

      return result;
    },
    [removeFavoriteRequest, refetchFavorites]
  );

  const restoreFavoriteToPage = useCallback(
    async (listingId: number) => {
      const result = await addFavoriteRequest(listingId);

      if (result.ok) {
        await refetchFavorites();
      }

      return result;
    },
    [addFavoriteRequest, refetchFavorites]
  );

  const {
    recordAddedFavorite,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    undoVisible,
    undoTimeLeft,
    showBanner,
  } = useFavoriteUndo({
    // Inverted intentionally so the page can support:
    // remove -> undo restore -> redo remove
    addFavorite: removeFavoriteFromPage,
    removeFavorite: restoreFavoriteToPage,
  });

  const { syncingIds } = useFavoritesSync({
    refetchFavorites,
    onToast: setToast,
  });

  const checkAvailability = useCallback(async (favs: FavoriteRecord[]) => {
    if (favs.length === 0) {
      setUnavailableIds(new Set());
      return;
    }

    try {
      const results = await Promise.all(
        favs.map(async (fav) => {
          const res = await fetch(`${API_BASE}/api/listings/${fav.listing.id}`);
          return { id: fav.listing.id, available: res.ok };
        })
      );

      setUnavailableIds(
        new Set(results.filter((r) => !r.available).map((r) => r.id))
      );
    } catch (err) {
      console.error("Failed to check listing availability:", err);
    }
  }, []);

  useEffect(() => {
    void checkAvailability(favorites);
  }, [favorites, checkAvailability]);

  const handleRemove = useCallback(
    async (favorite: FavoriteRecord) => {
      const result = await removeFavoriteFromPage(favorite.listing.id);

      if (!result.ok) {
        setToast("Failed to remove favorite");
        setConfirmDeleteId(null);
        return;
      }

      recordAddedFavorite(favorite.listing);
      setConfirmDeleteId(null);
      setToast("Removed from favorites");
    },
    [removeFavoriteFromPage, recordAddedFavorite]
  );

  const sortedFavorites = useMemo(() => {
    const next = [...favorites];

    next.sort((a, b) => {
      switch (sortOption) {
        case "date_asc":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "price_asc":
          return (a.listing.price ?? 0) - (b.listing.price ?? 0);
        case "price_desc":
          return (b.listing.price ?? 0) - (a.listing.price ?? 0);
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

    return next;
  }, [favorites, sortOption]);

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50 p-8 text-black">
        <h1 className="mb-4 text-3xl font-bold">My Favorites</h1>
        <p>Loading favorites...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-zinc-50 p-8 text-black">
        <h1 className="mb-4 text-3xl font-bold">My Favorites</h1>
        <p className="text-red-600">Error: {error}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-8 text-black">
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      {showBanner && (
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              {undoVisible ? (
                <p className="text-sm text-zinc-700">
                  Favorite removed. Undo available for {undoTimeLeft}s.
                </p>
              ) : canRedo ? (
                <p className="text-sm text-zinc-700">
                  Removal undone. Redo is available.
                </p>
              ) : null}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => void handleUndo()}
                disabled={!canUndo}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Undo
              </button>
              <button
                onClick={() => void handleRedo()}
                disabled={!canRedo}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Redo
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-zinc-500 hover:text-zinc-800">
            ← Browse
          </Link>
          <h1 className="text-3xl font-bold">
            My Favorites ({favorites.length})
          </h1>
        </div>

        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as SortOption)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          aria-label="Sort favorites"
        >
          <option value="date_desc">Newest First</option>
          <option value="date_asc">Oldest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      {favorites.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center">
          <p className="mb-4 text-zinc-500">No favorites yet.</p>
          <Link href="/" className="text-rose-500 hover:underline">
            Start browsing →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sortedFavorites.map((fav) => (
            <div
              key={fav.id}
              className="relative rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
              data-testid={`favorite-card-${fav.listing.id}`}
            >
              {unavailableIds.has(fav.listing.id) && (
                <div
                  className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800"
                  data-testid={`unavailable-notice-${fav.listing.id}`}
                >
                  ⚠ This property is no longer available in the database.
                </div>
              )}

              {syncingIds.has(fav.listing.id) && (
                <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-800">
                  Syncing favorite...
                </div>
              )}

              {fav.listing.photoUrls?.[0] ? (
                <img
                  src={fav.listing.photoUrls[0]}
                  alt={fav.listing.address || "Property image"}
                  className="mb-4 h-40 w-full rounded-lg object-cover"
                />
              ) : (
                <div className="mb-4 flex h-40 w-full items-center justify-center rounded-lg bg-zinc-100 text-sm text-zinc-400">
                  No Image
                </div>
              )}

              <h2 className="mb-1 pr-8 text-base font-semibold">
                {fav.listing.address || "No address"}
              </h2>
              <p className="text-sm text-zinc-600">
                {fav.listing.price
                  ? `$${fav.listing.price.toLocaleString()}`
                  : "Price N/A"}
              </p>
              <p className="text-sm text-zinc-500">
                {fav.listing.beds ?? "?"} bd · {fav.listing.baths ?? "?"} ba ·{" "}
                {fav.listing.sqft
                  ? `${fav.listing.sqft.toLocaleString()} sqft`
                  : "? sqft"}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Saved {new Date(fav.createdAt).toLocaleDateString()}
              </p>

              <Link
                href={`/listings/${fav.listing.id}`}
                className="mt-2 inline-block text-sm font-medium text-rose-500 hover:underline"
                data-testid={`details-link-${fav.listing.id}`}
              >
                View Details →
              </Link>

              {confirmDeleteId === fav.listing.id ? (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => void handleRemove(fav)}
                    className="flex-1 rounded-md bg-red-500 px-3 py-1.5 text-sm text-white hover:bg-red-600"
                  >
                    Confirm Remove
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(fav.listing.id)}
                  aria-label="Remove from favorites"
                  className="absolute right-4 top-4 text-zinc-400 transition-colors hover:text-red-500"
                  data-testid={`remove-button-${fav.listing.id}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
