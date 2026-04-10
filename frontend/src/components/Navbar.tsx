// src/components/layout/Navbar.tsx

import Link from "next/link";
import SearchBar from "@/features/search/components/SearchBar";

export default function Navbar() {
  return (
    <nav className="w-full bg-blue-300 text-white shadow-md">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left: Logo */}
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight text-gray-900 hover:opacity-80 transition"
        >
          HomeMatch
        </Link>

        {/* Center: Search */}
        <div className="flex-1 mx-8 max-w-xl">
          <SearchBar />
        </div>

        {/* Right: Auth */}
        <button className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-100">
          Log In
        </button>
      </div>
    </nav>
  );
}
