"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Listing } from "@/features/listings/types";
import { useSwipe } from "@/app/hooks/useSwipe";

type ListingCardProps = {
  listing: Listing;
  isFavorited?: boolean;
  isSyncing?: boolean;
  interactive?: boolean;
  onFavorite?: (listing: Listing) => unknown;
  onSwipeRight?: () => boolean | Promise<boolean>;
  onSwipeLeft?: () => boolean | Promise<boolean>;
};

const SWIPE_EXIT_DISTANCE = 420;
const SWIPE_EXIT_DURATION_MS = 260;
const SWIPE_TRIGGER_THRESHOLD = 110;

export default function ListingCard({
  listing,
  isFavorited = false,
  isSyncing = false,
  interactive = true,
  onFavorite,
  onSwipeRight,
  onSwipeLeft,
}: ListingCardProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);
  const swipeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const photoUrls = listing.photoUrls ?? [];
  const hasPhotos = photoUrls.length > 0;
  const activePhotoUrl = hasPhotos ? photoUrls[activePhotoIndex] : null;
  const swipeProgress = Math.min(Math.abs(dragX) / SWIPE_TRIGGER_THRESHOLD, 1);
  const swipeDirection = dragX === 0 ? null : dragX > 0 ? "right" : "left";
  const cardRotation = Math.max(Math.min(dragX / 18, 14), -14);
  const cardScale = isDragging ? 1.02 : 1;

  const resetSwipeState = () => {
    setExitDirection(null);
    setIsDragging(false);
    setDragX(0);
  };

  const scheduleSwipeAction = (direction: "left" | "right") => {
    if (exitDirection) return;

    setExitDirection(direction);
    setIsDragging(false);
    setDragX(direction === "right" ? SWIPE_EXIT_DISTANCE : -SWIPE_EXIT_DISTANCE);

    if (swipeTimeoutRef.current) {
      clearTimeout(swipeTimeoutRef.current);
    }

    swipeTimeoutRef.current = setTimeout(() => {
      const swipeAction = direction === "right" ? onSwipeRight : onSwipeLeft;

      Promise.resolve(swipeAction?.()).then((result) => {
        if (result === false) {
          resetSwipeState();
        }
      });
    }, SWIPE_EXIT_DURATION_MS);
  };

  const swipeHandlers = useSwipe({
    threshold: SWIPE_TRIGGER_THRESHOLD,
    onSwipeStart: () => {
      if (exitDirection || !interactive) return;
      setIsDragging(true);
    },
    onSwipeMove: (delta) => {
      if (exitDirection || !interactive) return;
      setDragX(delta);
    },
    onSwipeCancel: () => {
      if (exitDirection || !interactive) return;
      setIsDragging(false);
      setDragX(0);
    },
    onSwipeRight: () => scheduleSwipeAction("right"),
    onSwipeLeft: () => scheduleSwipeAction("left"),
  });

  const goToPreviousPhoto = () => {
    if (!hasPhotos) return;
    setActivePhotoIndex((currentIndex) =>
      currentIndex === 0 ? photoUrls.length - 1 : currentIndex - 1
    );
  };

  const goToNextPhoto = () => {
    if (!hasPhotos) return;
    setActivePhotoIndex((currentIndex) =>
      currentIndex === photoUrls.length - 1 ? 0 : currentIndex + 1
    );
  };

  useEffect(() => {
    return () => {
      if (swipeTimeoutRef.current) {
        clearTimeout(swipeTimeoutRef.current);
      }

    };
  }, []);

  return (
    <div
      className={`relative select-none [touch-action:pan-y] ${
        interactive ? "" : "pointer-events-none"
      }`}
      style={{
        filter:
          interactive && isDragging
            ? "drop-shadow(0 30px 50px rgba(24, 24, 27, 0.18))"
            : undefined,
      }}
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 -left-24 -right-24 flex items-center justify-between transition-opacity duration-150 ${
          swipeDirection ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-full border-2 border-zinc-800/15 bg-zinc-900/85 text-white transition-all duration-150 ${
            swipeDirection === "left" ? "scale-100 opacity-100" : "scale-75 opacity-0"
          }`}
          style={{ transform: `scale(${0.8 + swipeProgress * 0.35})` }}
          data-testid="swipe-left-indicator"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-7 w-7"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 6V4h8v2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14H6L5 6" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v5M14 11v5" />
          </svg>
        </div>

        <div
          className={`flex h-16 w-16 items-center justify-center rounded-full border-2 border-rose-200 bg-rose-500 text-white shadow-lg shadow-rose-500/30 transition-all duration-150 ${
            swipeDirection === "right" ? "scale-100 opacity-100" : "scale-75 opacity-0"
          }`}
          style={{ transform: `scale(${0.8 + swipeProgress * 0.35})` }}
          data-testid="swipe-right-indicator"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-7 w-7"
          >
            <path d="M12 21s-6.716-4.37-9-8.344C1.347 9.774 2.142 6.54 4.707 4.82a5.29 5.29 0 0 1 6.64.72l.653.645.652-.645a5.29 5.29 0 0 1 6.64-.72c2.565 1.72 3.36 4.954 1.707 7.836C18.716 16.63 12 21 12 21Z" />
          </svg>
        </div>
      </div>

      <div
        className={`relative overflow-hidden rounded-[28px] border border-zinc-200 bg-white p-4 shadow-sm ${
          !interactive
            ? ""
            : isDragging
              ? "cursor-grabbing"
              : "cursor-grab"
        } ${exitDirection === "right" ? "animate-card-swipe-right" : ""} ${
          exitDirection === "left" ? "animate-card-swipe-left" : ""
        }`}
        data-testid={interactive ? "listing-card" : "listing-card-preview"}
        style={{
          transform: `translateX(${dragX}px) rotate(${cardRotation}deg) scale(${cardScale})`,
          transition: exitDirection
            ? `transform ${SWIPE_EXIT_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${SWIPE_EXIT_DURATION_MS}ms ease`
            : isDragging
              ? "none"
              : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 220ms ease",
        }}
        {...swipeHandlers}
      >
      {interactive && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            void onFavorite?.(listing);
          }}
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          className="absolute top-6 right-6 z-10 rounded-full bg-white p-2 shadow-md transition-transform hover:scale-110"
          data-testid="favorite-button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={isFavorited ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={2}
            className={`h-6 w-6 transition-colors ${
              isFavorited ? "text-rose-500" : "text-zinc-400"
            }`}
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
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
            </span>
          )}
        </button>
      )}

      {activePhotoUrl ? (
        <div className="relative mb-5 overflow-hidden rounded-[24px] bg-zinc-100">
          <Image
            src={activePhotoUrl}
            alt={listing.address || "Property image"}
            width={1280}
            height={960}
            className="h-[24rem] w-full object-contain sm:h-[28rem]"
            draggable={false}
            priority={activePhotoIndex === 0}
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {photoUrls.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPreviousPhoto();
                }}
                aria-label="Previous photo"
                className="absolute top-1/2 left-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl text-zinc-900 shadow-lg transition hover:scale-105 hover:bg-white"
              >
                ‹
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNextPhoto();
                }}
                aria-label="Next photo"
                className="absolute top-1/2 right-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl text-zinc-900 shadow-lg transition hover:scale-105 hover:bg-white"
              >
                ›
              </button>

              <div className="absolute right-4 bottom-4 rounded-full bg-black/70 px-3 py-1 text-xs font-medium tracking-wide text-white">
                {activePhotoIndex + 1} / {photoUrls.length}
              </div>

              <div className="absolute bottom-4 left-4 flex max-w-[65%] gap-1.5">
                {photoUrls.slice(0, 6).map((photoUrl, index) => (
                  <button
                    key={`${photoUrl}-${index}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhotoIndex(index);
                    }}
                    aria-label={`View photo ${index + 1}`}
                    aria-pressed={activePhotoIndex === index}
                    className={`h-2.5 rounded-full transition ${
                      activePhotoIndex === index
                        ? "w-8 bg-white"
                        : "w-2.5 bg-white/50 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="mb-5 flex h-[24rem] w-full items-center justify-center rounded-[24px] bg-zinc-200 text-zinc-500 sm:h-[28rem]">
          No Image Available
        </div>
      )}

      <h2 className="mb-2 pr-12 text-xl font-semibold tracking-tight text-zinc-950">
        {listing.address || "No address available"}
      </h2>

      <p className="mb-4 text-2xl font-semibold text-zinc-950">
        {listing.price != null ? `$${listing.price.toLocaleString()}` : "Price unavailable"}
      </p>

      <div className="grid grid-cols-3 gap-3 rounded-2xl bg-zinc-50 p-3 text-sm text-zinc-600">
        <div className="rounded-xl bg-white p-3 shadow-sm shadow-zinc-200/60">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
            Beds
          </p>
          <p className="mt-1 text-lg font-semibold text-zinc-950">
            {listing.beds ?? "N/A"}
          </p>
        </div>

        <div className="rounded-xl bg-white p-3 shadow-sm shadow-zinc-200/60">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
            Baths
          </p>
          <p className="mt-1 text-lg font-semibold text-zinc-950">
            {listing.baths ?? "N/A"}
          </p>
        </div>

        <div className="rounded-xl bg-white p-3 shadow-sm shadow-zinc-200/60">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
            Sq Ft
          </p>
          <p className="mt-1 text-lg font-semibold text-zinc-950">
            {listing.sqft ?? "N/A"}
          </p>
        </div>
      </div>

      {interactive ? (
        <Link
          href={`/listings/${listing.id}`}
          onClick={(e) => e.stopPropagation()}
          className="mt-4 inline-flex items-center rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600"
          data-testid="view-details-link"
        >
          View Details
        </Link>
      ) : (
        <div className="mt-4 h-10 rounded-full bg-zinc-100" aria-hidden="true" />
      )}
      </div>
    </div>
  );
}
