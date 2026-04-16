"use client";

import Link from "next/link";
import { useFavoritesContext } from "@/features/favorites/context/favorites-context";
import SearchBar from "@/features/search/components/SearchBar";

export default function Navbar() {
  const { favoriteCount } = useFavoritesContext();

  return (
    <nav className="relative z-40 w-full border-b border-sky-200/70 bg-linear-to-r from-sky-100 via-cyan-50 to-white shadow-[0_10px_35px_rgba(14,116,144,0.08)] backdrop-blur">
      <div className="flex min-h-18 w-full items-center justify-between gap-4 px-6 py-3 md:px-8">
        {/* Left: Logo */}
        <Link
          href="/"
          className="text-xl font-semibold tracking-[-0.03em] text-slate-900 transition hover:opacity-80"
        >
          HomeMatch
        </Link>

        {/* Center: Search */}
        <div className="mx-4 hidden flex-1 max-w-2xl md:block">
          <SearchBar />
        </div>

        {/* Right: Favorites + Auth */}
        <div className="flex items-center gap-3">
          <Link
            href="/favorites"
            className="rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-rose-600"
            data-testid="favorites-nav-link"
          >
            ♥ Favorites ({favoriteCount})
          </Link>

          <button className="rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white">
            Log In
          </button>
        </div>
      </div>
      <div className="px-6 pb-3 md:hidden">
        <SearchBar />
      </div>
    </nav>
  );
}
