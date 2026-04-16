"use client";

import { getSearchSuggestions } from "@/features/search/api";
import type { SearchSuggestion } from "@/features/search/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 180;

function SearchBarFallback() {
  return (
    <div
      className="h-[50px] w-full rounded-full bg-white/70"
      aria-hidden="true"
    />
  );
}

function SearchBarInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [hasKeyboardSelection, setHasKeyboardSelection] = useState(false);
  const locationParam = searchParams?.get("location") ?? "";
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setQuery(locationParam);
  }, [locationParam]);

  useEffect(() => {
    if (pathname !== "/listings") {
      return;
    }

    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    setHasKeyboardSelection(false);
  }, [pathname]);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setIsOpen(false);
      setLoading(false);
      setActiveIndex(-1);
      setHasKeyboardSelection(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        const nextSuggestions = await getSearchSuggestions(
          trimmedQuery,
          5,
          controller.signal
        );

        setSuggestions(nextSuggestions);
        setIsOpen(true);
        setActiveIndex(nextSuggestions.length > 0 ? 0 : -1);
        setHasKeyboardSelection(false);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        console.error("Failed to load search suggestions:", error);
        setSuggestions([]);
        setIsOpen(false);
        setActiveIndex(-1);
        setHasKeyboardSelection(false);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [query]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
        setHasKeyboardSelection(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  function closeSuggestions() {
    setIsOpen(false);
    setActiveIndex(-1);
    setHasKeyboardSelection(false);
  }

  function navigateToSearch(nextQuery: string) {
    const trimmed = nextQuery.trim();

    if (!trimmed) {
      router.push("/listings");
      return;
    }

    router.push(`/listings?location=${encodeURIComponent(trimmed)}`);
  }

  function selectSuggestion(suggestion: SearchSuggestion) {
    setQuery(suggestion.value);
    closeSuggestions();

    if (suggestion.type === "address") {
      router.push(`/listings/${suggestion.listingId}`);
      return;
    }

    navigateToSearch(suggestion.value);
  }

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmed = query.trim();

    if (
      hasKeyboardSelection &&
      activeIndex >= 0 &&
      activeIndex < suggestions.length &&
      isOpen
    ) {
      selectSuggestion(suggestions[activeIndex]);
      return;
    }

    closeSuggestions();
    navigateToSearch(trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "Escape") {
        closeSuggestions();
      }

      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHasKeyboardSelection(true);
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHasKeyboardSelection(true);
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
      return;
    }

    if (e.key === "Escape") {
      closeSuggestions();
    }
  }

  const isListingsPage = pathname === "/listings";

  return (
    <div ref={containerRef} className="relative z-50 w-full">
      <form onSubmit={handleSubmit} className="w-full">
        <label className="group flex w-full items-center gap-3 rounded-full border border-white/70 bg-white/88 px-4 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 backdrop-blur-sm transition focus-within:border-cyan-300 focus-within:ring-cyan-300/80">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5 shrink-0 text-slate-400 transition group-focus-within:text-cyan-600"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            aria-label="Search listings"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls="search-suggestions-listbox"
            type="text"
            placeholder="Search by address or ZIP"
            value={query}
            onFocus={() => {
              if (suggestions.length > 0) {
                setIsOpen(true);
              }
            }}
            onChange={(e) => {
              setQuery(e.target.value);
              setHasKeyboardSelection(false);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-[15px] font-medium tracking-[-0.01em] text-slate-800 outline-none placeholder:font-normal placeholder:text-slate-400"
          />
        </label>
        <button type="submit" className="sr-only">
          {isListingsPage ? "Update search" : "Search"}
        </button>
      </form>

      {(isOpen || loading) && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.6rem)] z-[60] overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_20px_50px_rgba(15,23,42,0.16)] ring-1 ring-slate-200/60 backdrop-blur-xl">
          {loading ? (
            <div className="px-4 py-3 text-sm text-slate-500">Searching...</div>
          ) : suggestions.length > 0 ? (
            <ul
              id="search-suggestions-listbox"
              role="listbox"
              className="py-2"
            >
              {suggestions.map((suggestion, index) => {
                const isActive = index === activeIndex;
                const icon =
                  suggestion.type === "address" ? (
                    <path d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0c0 5.65-6 10-6 10Zm0-7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                  ) : (
                    <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Zm3.5 0v9h9v-9h-9Z" />
                  );

                return (
                  <li key={`${suggestion.type}-${suggestion.value}-${index}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectSuggestion(suggestion)}
                      onMouseEnter={() => {
                        setActiveIndex(index);
                        setHasKeyboardSelection(false);
                      }}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition ${
                        isActive ? "bg-cyan-50 text-slate-900" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="mt-0.5 rounded-full bg-slate-100 p-2 text-slate-500">
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="currentColor"
                        >
                          {icon}
                        </svg>
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {suggestion.value}
                        </span>
                        <span className="block text-xs uppercase tracking-[0.18em] text-slate-400">
                          {suggestion.type === "address"
                            ? suggestion.zipCode
                              ? `Address · ${suggestion.zipCode}`
                              : "Address"
                            : "ZIP search"}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-slate-500">
              No suggestions found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchBar() {
  return (
    <Suspense fallback={<SearchBarFallback />}>
      <SearchBarInner />
    </Suspense>
  );
}
