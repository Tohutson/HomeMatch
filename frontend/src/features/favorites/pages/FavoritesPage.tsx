"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Toast from "@/components/Toast";
import { useAuth } from "@/features/auth/context/auth-context";
import { useFavoritesContext } from "@/features/favorites/context/favorites-context";
import { useFavoriteUndo } from "@/features/favorites/hooks/use-favorite-undo";
import { useFavoritesSync } from "@/features/favorites/hooks/use-favorites-sync";
import { FavoriteRecord } from "../types";
import { useListingAvailability } from "@/features/listings/hooks/use-listing-availability";

type SortOption = "date_desc" | "date_asc" | "price_asc" | "price_desc";

export default function FavoritesPage() {
  const [toast, setToast] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("date_desc");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const { isAuthReady, user } = useAuth();
  const {
    favorites,
    loading,
    error,
    addFavorite: addFavoriteRequest,
    removeFavorite: removeFavoriteRequest,
    refetchFavorites,
  } = useFavoritesContext();

  const removeFavoriteFromPage = useCallback(
    (listingId: number) => removeFavoriteRequest(listingId),
    [removeFavoriteRequest],
  );

  const restoreFavoriteToPage = useCallback(
    (listingId: number) => addFavoriteRequest(listingId),
    [addFavoriteRequest],
  );

  const {
    recordAddedFavorite,
    handleUndo,
    handleRedo,
    handleDismissBanner,
    canUndo,
    canRedo,
    undoVisible,
    undoTimeLeft,
    showBanner,
  } = useFavoriteUndo({
    addFavorite: removeFavoriteFromPage,
    removeFavorite: restoreFavoriteToPage,
  });

  const { syncingIds } = useFavoritesSync({
    userSub: user?.id ?? null,
    refetchFavorites,
    onToast: setToast,
  });
  const { unavailableIds } = useListingAvailability(
    favorites.map((favorite) => favorite.listing.id),
  );

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
    },
    [removeFavoriteFromPage, recordAddedFavorite],
  );

  const handleShare = useCallback(async (favorite: FavoriteRecord) => {
    const shareUrl = favorite.listing.listingUrl?.trim();

    if (!shareUrl) {
      setToast("No listing link is available to share.");
      return;
    }

    const shareTitle = favorite.listing.address || "Home listing";

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: "Check out this home",
          url: shareUrl,
        });
        setToast("Listing shared.");
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
      }
    }

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setToast("Listing link copied to clipboard.");
        return;
      } catch {
        // Fall back to execCommand when clipboard permissions are unavailable.
      }
    }

    const textArea = document.createElement("textarea");
    textArea.value = shareUrl;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";

    let copied = false;
    document.body.appendChild(textArea);
    try {
      textArea.focus();
      textArea.select();
      copied = document.execCommand("copy");
    } finally {
      document.body.removeChild(textArea);
    }
    setToast(
      copied
        ? "Listing link copied to clipboard."
        : "Unable to share this listing right now.",
    );
  }, []);

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

  if ((!isAuthReady || loading) && favorites.length === 0) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(186,230,253,0.7),_transparent_34%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-6 py-10 text-slate-950 md:px-8">
        <div className="mx-auto max-w-7xl rounded-[36px] border border-white/75 bg-white/75 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-600">
            Favorites
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-950">
            Loading favorites...
          </h1>
        </div>
      </main>
    );
  }

  if (error && favorites.length === 0) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(186,230,253,0.7),_transparent_34%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-6 py-10 text-slate-950 md:px-8">
        <div className="mx-auto max-w-4xl rounded-[36px] border border-white/75 bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-rose-500">
            Favorites
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-950">
            We couldn&apos;t load your saved homes
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Error: {error}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(186,230,253,0.7),_transparent_34%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-6 py-10 text-slate-950 md:px-8">
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      <div className="mx-auto max-w-7xl">
        {showBanner && (
          <div className="fixed top-4 left-1/2 z-50 grid w-[min(86vw,30rem)] -translate-x-1/2 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded-[18px] border border-white/10 bg-slate-900/72 px-3 py-2 text-white shadow-[0_18px_50px_rgba(15,23,42,0.18)] backdrop-blur-md animate-banner-fade-in sm:top-6">
            <div className="min-w-0 text-sm font-medium text-white/90">
              {undoVisible ? (
                <p>Favorite removed. Undo available for {undoTimeLeft}s.</p>
              ) : canRedo ? (
                <p>Removal undone. Redo is available.</p>
              ) : null}
            </div>

            <div className="flex min-h-9 min-w-[8.5rem] items-center justify-end gap-2">
              <button
                onClick={() => void handleUndo()}
                disabled={!canUndo}
                className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {canUndo ? `Undo (${undoTimeLeft}s)` : "Undo"}
              </button>
              <button
                onClick={() => void handleRedo()}
                disabled={!canRedo}
                className="rounded-full border border-white/20 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Redo
              </button>
            </div>

            <button
              type="button"
              onClick={handleDismissBanner}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold leading-none text-white/75 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/60"
              aria-label="Dismiss undo notification"
            >
              x
            </button>
          </div>
        )}

        <section className="rounded-[36px] border border-white/80 bg-white/75 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 border-b border-slate-200/70 pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Link
                href="/listings"
                className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
              >
                Back to browse
              </Link>

              <p className="mt-6 text-sm font-medium uppercase tracking-[0.24em] text-sky-600">
                Saved homes
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-slate-950">
                My Favorites
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Keep track of the homes you love, revisit them quickly, and
                clear out properties that are no longer a fit.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600">
                {favorites.length} saved{" "}
                {favorites.length === 1 ? "home" : "homes"}
              </div>

              <label className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
                <span className="font-medium text-slate-500">Sort</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="bg-transparent font-medium text-slate-900 outline-none"
                  aria-label="Sort favorites"
                >
                  <option value="date_desc">Newest First</option>
                  <option value="date_asc">Oldest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </label>
            </div>
          </div>

          {favorites.length === 0 ? (
            <div className="mt-8 rounded-[32px] border border-dashed border-slate-300 bg-slate-50/90 px-6 py-16 text-center">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">
                Nothing saved yet
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                Start building your shortlist
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
                Favorite a few homes while browsing and they&apos;ll show up
                here for easy comparison.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex items-center rounded-full bg-rose-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-rose-600"
              >
                Start browsing
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {sortedFavorites.map((fav) => (
                <article
                  key={fav.id}
                  className="group relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.1)]"
                  data-testid={`favorite-card-${fav.listing.id}`}
                >
                  {unavailableIds.has(fav.listing.id) && (
                    <div
                      className="mb-3 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800"
                      data-testid={`unavailable-notice-${fav.listing.id}`}
                    >
                      This property is no longer available in the database.
                    </div>
                  )}

                  {syncingIds.has(fav.listing.id) && (
                    <div className="mb-3 rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-medium text-sky-700">
                      Syncing favorite...
                    </div>
                  )}

                  <div className="relative overflow-hidden rounded-[24px] bg-slate-100">
                    {fav.listing.photoUrls?.[0] ? (
                      <Image
                        src={fav.listing.photoUrls[0]}
                        alt={fav.listing.address || "Property image"}
                        width={1200}
                        height={900}
                        className="h-56 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-56 w-full items-center justify-center text-sm font-medium text-slate-400">
                        No image available
                      </div>
                    )}

                    <button
                      onClick={() =>
                        setConfirmDeleteId((currentId) =>
                          currentId === fav.listing.id ? null : fav.listing.id,
                        )
                      }
                      aria-label="Remove from favorites"
                      className="absolute top-4 right-4 rounded-full bg-white/90 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-white hover:text-rose-500"
                      data-testid={`remove-button-${fav.listing.id}`}
                    >
                      Remove
                    </button>

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />
                  </div>

                  <div className="mt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                          Saved {new Date(fav.createdAt).toLocaleDateString()}
                        </p>
                        <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-slate-950">
                          {fav.listing.address || "No address"}
                        </h2>
                      </div>
                    </div>

                    <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                      {fav.listing.price
                        ? `$${fav.listing.price.toLocaleString()}`
                        : "Price unavailable"}
                    </p>

                    <div className="mt-4 grid grid-cols-3 gap-3 rounded-[24px] bg-slate-50 p-3 text-sm text-slate-600">
                      <FavoriteStat
                        label="Beds"
                        value={fav.listing.beds ?? "N/A"}
                      />
                      <FavoriteStat
                        label="Baths"
                        value={fav.listing.baths ?? "N/A"}
                      />
                      <FavoriteStat
                        label="Sq Ft"
                        value={
                          fav.listing.sqft
                            ? fav.listing.sqft.toLocaleString()
                            : "N/A"
                        }
                      />
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <Link
                        href={`/listings/${fav.listing.id}`}
                        className="inline-flex items-center rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600"
                        data-testid={`details-link-${fav.listing.id}`}
                      >
                        View details
                      </Link>

                      <button
                        type="button"
                        onClick={() => void handleShare(fav)}
                        disabled={!fav.listing.listingUrl?.trim()}
                        className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        data-testid={`share-button-${fav.listing.id}`}
                      >
                        Share
                      </button>

                      {confirmDeleteId === fav.listing.id && (
                        <>
                          <button
                            onClick={() => void handleRemove(fav)}
                            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                          >
                            Confirm remove
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function FavoriteStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[18px] bg-white p-3 text-center shadow-sm shadow-slate-200/70">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-slate-950">{value}</p>
    </div>
  );
}
