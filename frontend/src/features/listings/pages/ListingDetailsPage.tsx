"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import Toast from "../../../components/Toast";
import { useFavoritesContext } from "@/features/favorites/context/favorites-context";
import { useFavoriteUndo } from "@/features/favorites/hooks/use-favorite-undo";
import { useListingDetails } from "@/features/listings/hooks/use-listing-details";

export default function ListingDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [toast, setToast] = useState<string | null>(null);

  const { listing, loading, error, notFound } = useListingDetails({ id });

  const { userId, isFavorited, addFavorite, removeFavorite } =
    useFavoritesContext();

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
    addFavorite,
    removeFavorite,
    onToast: setToast,
  });

  const favorited = listing ? isFavorited(listing.id) : false;

  const handleFavoriteToggle = async () => {
    if (!listing || !userId) return;

    if (favorited) {
      const result = await removeFavorite(listing.id);

      if (!result.ok) {
        setToast("Unable to remove favorite. Please try again.");
        return;
      }

      setToast("Removed from Favorites");
      return;
    }

    const result = await addFavorite(listing.id);

    if (!result.ok) {
      if (result.reason === "already_exists") {
        setToast("This home is already in your favorites");
      } else if (result.reason === "missing_user") {
        setToast("Please log in to save favorites");
      } else {
        setToast("Unable to save favorite. Please try again.");
      }
      return;
    }

    recordAddedFavorite(listing);
    setToast("Added to Favorites");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50 p-8 text-black">
        <p>Loading property details...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-zinc-50 p-8 text-black">
        <h1 className="mb-4 text-2xl font-bold">Unable to Load Property</h1>
        <p className="mb-4 text-zinc-500">{error}</p>
        <Link href="/" className="text-rose-500 hover:underline">
          Back to Browse
        </Link>
      </main>
    );
  }

  if (notFound || !listing) {
    return (
      <main className="min-h-screen bg-zinc-50 p-8 text-black">
        <h1 className="mb-4 text-2xl font-bold">Property Not Found</h1>
        <p className="mb-4 text-zinc-500">
          This property is no longer available in our database.
        </p>
        <Link href="/" className="text-rose-500 hover:underline">
          Back to Browse
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-8 text-black">
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      <div className="mx-auto max-w-3xl">
        {showBanner && (
          <div
            className="mb-4 flex items-center gap-3 rounded-lg bg-zinc-800 px-4 py-3 text-white"
            data-testid="detail-undo-banner"
          >
            <span className="flex-1">
              {undoVisible
                ? "Added to favorites!"
                : canRedo
                ? "Favorite removed."
                : ""}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => void handleUndo()}
                disabled={!canUndo}
                className="rounded-md bg-white px-3 py-1 text-sm font-medium text-zinc-800 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                data-testid="detail-undo-button"
              >
                {canUndo ? `Undo (${undoTimeLeft}s)` : "Undo"}
              </button>

              <button
                onClick={() => void handleRedo()}
                disabled={!canRedo}
                className="rounded-md border border-white/30 px-3 py-1 text-sm font-medium text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                data-testid="detail-redo-button"
              >
                Redo
              </button>
            </div>
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="text-zinc-500 hover:text-zinc-800">
            Back to Browse
          </Link>
          <button
            onClick={() => void handleFavoriteToggle()}
            aria-label={
              favorited ? "Remove from favorites" : "Add to favorites"
            }
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
              favorited
                ? "bg-rose-500 text-white hover:bg-rose-600"
                : "border border-zinc-300 bg-white hover:bg-zinc-50"
            }`}
            data-testid="detail-favorite-button"
          >
            {favorited ? "Favorited" : "Add to Favorites"}
          </button>
        </div>

        {listing.photoUrls && listing.photoUrls.length > 0 ? (
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {listing.photoUrls.slice(0, 4).map((url, i) => (
              <div
                key={i}
                className={`relative overflow-hidden rounded-xl ${
                  i === 0 ? "h-72 sm:col-span-2" : "h-48"
                }`}
              >
                <Image
                  src={url}
                  alt={`Property photo ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes={
                    i === 0
                      ? "(min-width: 640px) 100vw, 100vw"
                      : "(min-width: 640px) 50vw, 100vw"
                  }
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-6 flex h-72 w-full items-center justify-center rounded-xl bg-zinc-200 text-zinc-500">
            No Images Available
          </div>
        )}

        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h1 className="mb-2 text-2xl font-bold">
            {listing.address || "No address available"}
          </h1>
          <p className="mb-4 text-2xl font-semibold text-rose-500">
            {listing.price ? `$${listing.price.toLocaleString()}` : "Price N/A"}
          </p>

          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Bedrooms" value={listing.beds} />
            <Stat label="Bathrooms" value={listing.baths} />
            <Stat label="Sq Ft" value={listing.sqft?.toLocaleString()} />
            <Stat label="Energy" value={listing.energyStarScore} />
          </div>

          {listing.listingUrl ? (
            <a
              href={listing.listingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-lg bg-zinc-800 px-4 py-2 text-white hover:bg-zinc-700"
            >
              View Original Listing
            </a>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="rounded-lg bg-zinc-50 p-4 text-center">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="text-lg font-semibold">{value ?? "N/A"}</p>
    </div>
  );
}
