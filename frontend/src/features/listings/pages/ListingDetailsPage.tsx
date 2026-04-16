"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import Toast from "../../../components/Toast";
import { useListingDetails } from "@/features/listings/hooks/use-listing-details";
import { useListingsFavoriteWorkflow } from "@/features/favorites/hooks/use-listings-favorite-workflow";

export default function ListingDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [toast, setToast] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { listing, loading, error, notFound } = useListingDetails({ id });

  const {
    isFavorited,
    handleFavorite,
    handleUndo,
    handleRedo,
    pendingFavorite,
    canUndo,
    canRedo,
    undoVisible,
    undoTimeLeft,
    showBanner,
  } = useListingsFavoriteWorkflow({
    onToast: setToast,
    onRequireLogin: () => setToast("Please log in to save favorites"),
  });

  const favorited = listing ? isFavorited(listing.id) : false;
  const photoUrls = useMemo(() => listing?.photoUrls ?? [], [listing?.photoUrls]);
  const hasPhotos = photoUrls.length > 0;
  const activeLightboxUrl =
    lightboxIndex != null ? photoUrls[lightboxIndex] : null;

  useEffect(() => {
    if (lightboxIndex == null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightboxIndex(null);
        return;
      }

      if (photoUrls.length <= 1) return;

      if (event.key === "ArrowRight") {
        setLightboxIndex((currentIndex) => {
          if (currentIndex == null) return currentIndex;
          return (currentIndex + 1) % photoUrls.length;
        });
      }

      if (event.key === "ArrowLeft") {
        setLightboxIndex((currentIndex) => {
          if (currentIndex == null) return currentIndex;
          return (currentIndex - 1 + photoUrls.length) % photoUrls.length;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxIndex, photoUrls]);

  const handleFavoriteToggle = async () => {
    if (!listing) return;
    await handleFavorite(listing);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(186,230,253,0.7),_transparent_34%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-6 py-10 text-slate-950 md:px-8">
        <div className="mx-auto max-w-6xl rounded-[32px] border border-white/70 bg-white/75 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-600">
            Property details
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-900">
            Loading property details...
          </h1>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(186,230,253,0.7),_transparent_34%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-6 py-10 text-slate-950 md:px-8">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-rose-500">
            Property details
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-900">
            Unable to load property
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
            {error}
          </p>
          <Link
            href="/listings"
            className="mt-6 inline-flex items-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Back to browse
          </Link>
        </div>
      </main>
    );
  }

  if (notFound || !listing) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(186,230,253,0.7),_transparent_34%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-6 py-10 text-slate-950 md:px-8">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-sky-600">
            Property details
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-900">
            Property not found
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
            This property is no longer available in our database.
          </p>
          <Link
            href="/listings"
            className="mt-6 inline-flex items-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Back to browse
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(186,230,253,0.7),_transparent_34%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-6 py-10 text-slate-950 md:px-8">
        {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

        <div className="mx-auto max-w-6xl">
          {showBanner && (
            <div
              className="fixed top-24 left-1/2 z-50 grid w-[min(88vw,40rem)] -translate-x-1/2 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[24px] border border-white/10 bg-slate-900/72 px-4 py-3 text-white shadow-[0_18px_50px_rgba(15,23,42,0.18)] backdrop-blur-md animate-banner-fade-in"
              data-testid="detail-undo-banner"
            >
              <span className="min-w-0 text-sm font-medium text-white/90">
                {pendingFavorite
                  ? "Saving favorite..."
                  : undoVisible
                    ? `Added to favorites. Undo available for ${undoTimeLeft}s.`
                  : canRedo
                    ? "Favorite removed."
                    : ""}
              </span>

              <div className="flex min-h-10 min-w-[8.5rem] items-center justify-end gap-2">
                {undoVisible && (
                  <button
                    onClick={() => void handleUndo()}
                    disabled={!canUndo}
                    className="rounded-full bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                    data-testid="detail-undo-button"
                  >
                    {canUndo ? `Undo (${undoTimeLeft}s)` : "Undo"}
                  </button>
                )}

                {canRedo && (
                  <button
                    onClick={() => void handleRedo()}
                    disabled={!canRedo}
                    className="rounded-full border border-white/20 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                    data-testid="detail-redo-button"
                  >
                    Redo
                  </button>
                )}
              </div>
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
                  Listing details
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-slate-950">
                  {listing.address || "No address available"}
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <p className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                    {listing.price
                      ? `$${listing.price.toLocaleString()}`
                      : "Price unavailable"}
                  </p>
                  <div className="rounded-full bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600">
                    {listing.beds ?? "N/A"} bd · {listing.baths ?? "N/A"} ba
                    {" · "}
                    {listing.sqft
                      ? `${listing.sqft.toLocaleString()} sqft`
                      : "Sq ft N/A"}
                  </div>
                </div>
              </div>

              <button
                onClick={() => void handleFavoriteToggle()}
                aria-label={
                  favorited ? "Remove from favorites" : "Add to favorites"
                }
                className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition ${
                  favorited
                    ? "bg-rose-500 text-white shadow-[0_14px_30px_rgba(244,63,94,0.28)] hover:bg-rose-600"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
                data-testid="detail-favorite-button"
              >
                {favorited ? "Favorited" : "Add to Favorites"}
              </button>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.85fr)]">
              <div>
                {hasPhotos ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {photoUrls.slice(0, 5).map((url, index) => (
                      <button
                        key={`${url}-${index}`}
                        type="button"
                        onClick={() => setLightboxIndex(index)}
                        className={`group relative overflow-hidden rounded-[28px] bg-slate-100 text-left shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 ${
                          index === 0 ? "h-80 sm:col-span-2" : "h-52"
                        }`}
                        aria-label={`View property photo ${index + 1} full screen`}
                      >
                        <Image
                          src={url}
                          alt={`Property photo ${index + 1}`}
                          fill
                          className="object-cover transition duration-300 group-hover:scale-[1.03]"
                          sizes={
                            index === 0
                              ? "(min-width: 1024px) 55vw, 100vw"
                              : "(min-width: 640px) 28vw, 100vw"
                          }
                          priority={index === 0}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent opacity-80 transition group-hover:opacity-100" />
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-5 py-4 text-white">
                          <span className="text-sm font-medium">
                            Photo {index + 1}
                          </span>
                          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                            Full screen
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-80 w-full items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-100 text-sm font-medium text-slate-500">
                    No images available
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <div className="rounded-[28px] border border-slate-200/70 bg-slate-50/80 p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
                    Home snapshot
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Stat label="Bedrooms" value={listing.beds} />
                    <Stat label="Bathrooms" value={listing.baths} />
                    <Stat
                      label="Square feet"
                      value={listing.sqft?.toLocaleString()}
                    />
                    <Stat
                      label="Energy score"
                      value={listing.energyStarScore}
                    />
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
                  <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
                    About this listing
                  </p>
                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    Explore the photo gallery in full screen, compare key home
                    details at a glance, and jump to the original source when
                    you want the complete listing context.
                  </p>

                  {listing.listingUrl ? (
                    <a
                      href={listing.listingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-flex items-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                      View original listing
                    </a>
                  ) : (
                    <p className="mt-5 text-sm text-slate-400">
                      Original listing link unavailable.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {activeLightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/92 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Property photo viewer"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-5 right-5 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
            aria-label="Close full screen image viewer"
          >
            Close
          </button>

          {photoUrls.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setLightboxIndex((currentIndex) => {
                    if (currentIndex == null) return currentIndex;
                    return (
                      (currentIndex - 1 + photoUrls.length) % photoUrls.length
                    );
                  });
                }}
                className="absolute left-4 rounded-full border border-white/15 bg-white/10 p-4 text-2xl text-white transition hover:bg-white/20 md:left-8"
                aria-label="Previous photo"
              >
                ‹
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setLightboxIndex((currentIndex) => {
                    if (currentIndex == null) return currentIndex;
                    return (currentIndex + 1) % photoUrls.length;
                  });
                }}
                className="absolute right-4 rounded-full border border-white/15 bg-white/10 p-4 text-2xl text-white transition hover:bg-white/20 md:right-8"
                aria-label="Next photo"
              >
                ›
              </button>
            </>
          )}

          <div
            className="relative flex w-full max-w-6xl flex-col items-center gap-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative h-[70vh] w-full overflow-hidden rounded-[32px] border border-white/10 bg-slate-900 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
              <Image
                src={activeLightboxUrl}
                alt={`Property photo ${(lightboxIndex ?? 0) + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>

            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur">
              <span>
                Photo {(lightboxIndex ?? 0) + 1} of {photoUrls.length}
              </span>
              <span className="text-white/50">·</span>
              <span>Press Esc to close</span>
            </div>
          </div>
        </div>
      )}
    </>
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
    <div className="rounded-[22px] border border-white/70 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-slate-950">
        {value ?? "N/A"}
      </p>
    </div>
  );
}
