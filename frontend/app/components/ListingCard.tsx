"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSwipe } from "../hooks/useSwipe";

export type Listing = {
  id: number;
  address?: string;
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  photoUrls?: string[];
};

type ListingCardProps = {
  listing: Listing;
  isFavorited?: boolean;
  isSyncing?: boolean;
  onFavorite?: (listing: Listing) => void;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
};

export default function ListingCard({
  listing,
  isFavorited = false,
  isSyncing   = false,
  onFavorite,
  onSwipeRight,
  onSwipeLeft,
}: ListingCardProps) {
  const swipeHandlers = useSwipe({ onSwipeRight, onSwipeLeft });

  const [bouncing, setBouncing]   = useState(false);
  const prevFavoritedRef          = useRef(isFavorited);

  useEffect(() => {
    if (isFavorited && !prevFavoritedRef.current) {
      setBouncing(true);
      const t = setTimeout(() => setBouncing(false), 500);
      prevFavoritedRef.current = isFavorited;
      return () => clearTimeout(t);
    }
    prevFavoritedRef.current = isFavorited;
  }, [isFavorited]);

  return (
    <div
      className="relative rounded-xl border border-zinc-200 bg-white p-4
                 shadow-sm select-none"
      data-testid="listing-card"
      {...swipeHandlers}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onFavorite?.(listing);
        }}
        aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
        className="absolute top-6 right-6 z-10 rounded-full bg-white p-2
                   shadow-md transition-transform hover:scale-110"
        data-testid="favorite-button"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={isFavorited ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={2}
          className={`h-6 w-6 transition-colors
            ${isFavorited ? "text-rose-500" : "text-zinc-400"}
            ${bouncing ? "animate-heart-bounce" : ""}`}
          data-testid="heart-icon"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312
               2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0
               7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>

        {isSyncing && (
          <span
            className="absolute -top-1 -right-1 flex h-3 w-3"
            data-testid="sync-indicator"
          >
            <span className="animate-ping absolute inline-flex h-full w-full
                             rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3
                             bg-amber-500" />
          </span>
        )}
      </button>

      {listing.photoUrls?.[0] ? (
        <img
          src={listing.photoUrls[0]}
          alt={listing.address || "Property image"}
          className="mb-4 h-48 w-full rounded-lg object-cover"
          draggable={false}
        />
      ) : (
        <div className="mb-4 flex h-48 w-full items-center justify-center
                        rounded-lg bg-zinc-200 text-zinc-500">
          No Image Available
        </div>
      )}

      <h2 className="mb-1 pr-12 text-lg font-semibold">
        {listing.address || "No address available"}
      </h2>
      <p>
        <span className="font-medium">Price:</span>{" "}
        {listing.price ? `$${listing.price.toLocaleString()}` : "N/A"}
      </p>
      <p>
        <span className="font-medium">Bedrooms:</span>{" "}
        {listing.beds ?? "N/A"}
      </p>
      <p>
        <span className="font-medium">Bathrooms:</span>{" "}
        {listing.baths ?? "N/A"}
      </p>
      <p>
        <span className="font-medium">Square Feet:</span>{" "}
        {listing.sqft ?? "N/A"}
      </p>

      <Link
        href={`/listings/${listing.id}`}
        onClick={(e) => e.stopPropagation()}
        className="mt-3 inline-block text-sm font-medium
                   text-rose-500 hover:underline"
        data-testid="view-details-link"
      >
        View Details →
      </Link>
    </div>
  );
}