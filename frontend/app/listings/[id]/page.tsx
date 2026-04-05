"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { getOrCreateUserId } from "../../lib/userId";
import Toast from "../../components/Toast";

type Listing = {
  id: number;
  address?: string;
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  energyStarScore?: number;
  listingUrl?: string;
  photoUrls?: string[];
};

const API_BASE = "http://localhost:8081";
const UNDO_MS = 10_000;

export default function ListingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [undoListing, setUndoListing] = useState<Listing | null>(null);
  const [undoTimeLeft, setUndoTimeLeft] = useState(0);

  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getOrCreateUserId().then(setUserId).catch(console.error);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/listings/${id}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        if (!res.ok) throw new Error("Failed to fetch listing");
        return res.json();
      })
      .then((data) => {
        if (data) setListing(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!userId || !listing) return;
    fetch(`${API_BASE}/api/favorites?userId=${userId}`)
      .then((r) => r.json())
      .then((favs: { listing: { id: number } }[]) =>
        setIsFavorited(favs.some((f) => f.listing.id === listing.id))
      )
      .catch(console.error);
  }, [userId, listing]);

  const clearUndoTimer = () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
  };

  const startUndoTimer = (favorited: Listing) => {
    clearUndoTimer();
    setUndoListing(favorited);
    setUndoTimeLeft(UNDO_MS / 1000);

    undoIntervalRef.current = setInterval(() => {
      setUndoTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(undoIntervalRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    undoTimerRef.current = setTimeout(() => {
      setUndoListing(null);
      setUndoTimeLeft(0);
      setToast("Undo window expired. Remove from Favorites page instead.");
    }, UNDO_MS);
  };

  useEffect(() => () => clearUndoTimer(), []);

  const handleFavoriteToggle = async () => {
    if (!userId || !listing) return;

    if (isFavorited) {
      await fetch(
        `${API_BASE}/api/favorites?userId=${userId}&listingId=${listing.id}`,
        { method: "DELETE" }
      );
      setIsFavorited(false);
      clearUndoTimer();
      setUndoListing(null);
      setUndoTimeLeft(0);
      setToast("Removed from Favorites");
      return;
    }

    const res = await fetch(
      `${API_BASE}/api/favorites?userId=${userId}&listingId=${listing.id}`,
      { method: "POST" }
    );

    if (res.status === 409) {
      setToast("This home is already in your favorites");
      return;
    }
    if (res.status === 503) {
      setToast("Unable to save favorite. Please try again.");
      return;
    }
    if (res.ok) {
      setIsFavorited(true);
      startUndoTimer(listing);
      setToast("Added to Favorites");
    }
  };

  const handleUndo = async () => {
    if (!userId || !undoListing) {
      setToast("No recent likes to undo");
      return;
    }

    const res = await fetch(
      `${API_BASE}/api/favorites/last?userId=${userId}`,
      { method: "DELETE" }
    );

    if (res.status === 503) {
      setToast("Unable to undo. Please try again.");
      return;
    }

    setIsFavorited(false);
    clearUndoTimer();
    setUndoListing(null);
    setUndoTimeLeft(0);
    setToast(`Removed ${undoListing.address ?? "property"} from favorites`);
  };

  const canUndo = undoListing !== null && undoTimeLeft > 0;
  const undoVisible = undoTimeLeft > 0;

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50 p-8 text-black">
        <p>Loading property details...</p>
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
        {undoVisible && (
          <div
            className="mb-4 flex items-center gap-3 rounded-lg bg-zinc-800 px-4 py-3 text-white"
            data-testid="detail-undo-banner"
          >
            <span className="flex-1">Added to favorites!</span>
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="rounded-md bg-white px-3 py-1 text-sm font-medium text-zinc-800 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
              data-testid="detail-undo-button"
            >
              {canUndo ? `Undo (${undoTimeLeft}s)` : "Undo"}
            </button>
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="text-zinc-500 hover:text-zinc-800">
            Back to Browse
          </Link>
          <button
            onClick={handleFavoriteToggle}
            aria-label={
              isFavorited ? "Remove from favorites" : "Add to favorites"
            }
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
              isFavorited
                ? "bg-rose-500 text-white hover:bg-rose-600"
                : "border border-zinc-300 bg-white hover:bg-zinc-50"
            }`}
            data-testid="detail-favorite-button"
          >
            {isFavorited ? "Favorited" : "Add to Favorites"}
          </button>
        </div>

        {listing.photoUrls && listing.photoUrls.length > 0 ? (
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {listing.photoUrls.slice(0, 4).map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Property photo ${i + 1}`}
                className={`w-full rounded-xl object-cover ${
                  i === 0 ? "h-72 sm:col-span-2" : "h-48"
                }`}
              />
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
            {listing.price
              ? `$${listing.price.toLocaleString()}`
              : "Price N/A"}
          </p>

          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Bedrooms" value={listing.beds} />
            <Stat label="Bathrooms" value={listing.baths} />
            <Stat label="Sq Ft" value={listing.sqft?.toLocaleString()} />
            <Stat label="Energy" value={listing.energyStarScore} />
          </div>

          {listing.listingUrl && (
            <a
              href={listing.listingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-lg bg-zinc-800 px-4 py-2 text-white hover:bg-zinc-700"
            >
              View Original Listing
            </a>
          )}
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
  value?: string | number | null;
}) {
  return (
    <div className="rounded-lg bg-zinc-50 p-3 text-center">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-lg font-semibold">{value ?? "N/A"}</p>
    </div>
  );
}