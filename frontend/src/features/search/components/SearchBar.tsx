"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const locationParam = searchParams?.get("location") ?? "";

  useEffect(() => {
    setQuery(locationParam);
  }, [locationParam]);

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmed = query.trim();

    if (!trimmed) {
      router.push("/listings");
      return;
    }

    router.push(`/listings?location=${encodeURIComponent(trimmed)}`);
  }

  const isListingsPage = pathname === "/listings";

  return (
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
          type="text"
          placeholder="Search by address or ZIP"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-transparent text-[15px] font-medium tracking-[-0.01em] text-slate-800 outline-none placeholder:font-normal placeholder:text-slate-400"
        />
      </label>
      <button type="submit" className="sr-only">
        {isListingsPage ? "Update search" : "Search"}
      </button>
    </form>
  );
}
