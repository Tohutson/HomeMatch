"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getOrCreateUserId } from "@/lib/userId";

type Listing = {
  id: number;
  address?: string;
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  photoUrls?: string[];
};

type Favorite = {
  id: number;
  listing: Listing;
  createdAt: string;
};

type SortOption = "date_desc" | "date_asc" | "price_asc" | "price_desc";

const API_BASE = "http://localhost:8081";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("date_desc");
  const [userId, setUserId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [unavailableIds, setUnavailableIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    getOrCreateUserId().then(setUserId).catch(console.error);
  }, []);

  const loadFavorites = useCallback(async (uid: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/users/${uid}/favorites`);
      if (!res.ok) throw new Error("Failed to load favorites");
      setFavorites(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) loadFavorites(userId);
  }, [userId, loadFavorites]);

  const checkAvailability = useCallback(async (favs: Favorite[]) => {
    if (favs.length === 0) return;

    const results = await Promise.all(
      favs.map(async (fav) => {
        const res = await fetch(`${API_BASE}/api/listings/${fav.listing.id}`);
        return { id: fav.listing.id, available: res.ok };
      })
    );

    setUnavailableIds(
      new Set(results.filter((r) => !r.available).map((r) => r.id))
    );
  }, []);

  useEffect(() => {
    checkAvailability(favorites);
  }, [favorites, checkAvailability]);

  const handleRemove = useCallback(
    async (listingId: number) => {
      if (!userId) return;

      try {
        const res = await fetch(
          `${API_BASE}/api/users/${userId}/favorites/${listingId}`,
          { method: "DELETE" }
        );

        if (!res.ok) {
          throw new Error("Failed to remove favorite");
        }

        setFavorites((prev) => prev.filter((f) => f.listing.id !== listingId));
      } catch (err) {
        console.error(err);
      } finally {
        setConfirmDeleteId(null);
      }
    },
    [userId]
  );

  const sorted = [...favorites].sort((a, b) => {
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
          {sorted.map((fav) => (
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
                    onClick={() => handleRemove(fav.listing.id)}
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
