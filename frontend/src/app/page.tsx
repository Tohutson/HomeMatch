import Link from "next/link";
import SearchBar from "@/features/search/components/SearchBar";

export default function Page() {
  return (
    <main className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(186,230,253,0.85),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.18),_transparent_28%),linear-gradient(180deg,_#f8fcff_0%,_#eef7fb_48%,_#ffffff_100%)] px-6 py-16 text-slate-900 md:px-10 md:py-24">
      <div className="absolute inset-x-0 top-0 h-px bg-white/80" />

      <section className="mx-auto flex max-w-6xl flex-col items-center gap-14 lg:flex-row lg:items-stretch">
        <div className="flex max-w-2xl flex-1 flex-col justify-center text-center lg:text-left">
          <span className="inline-flex w-fit self-center rounded-full border border-cyan-200 bg-white/75 px-4 py-1 text-sm font-medium text-cyan-800 shadow-sm lg:self-start">
            Find your next place with less friction
          </span>

          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl md:text-6xl">
            HomeMatch, where your dream home is a swipe away.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            Search by city, neighborhood, address, or ZIP to jump straight
            into listings that feel worth your time.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row lg:justify-start">
            <Link
              href="/listings"
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:bg-slate-800"
            >
              Start browsing
            </Link>
          </div>
        </div>

        <div className="w-full max-w-2xl flex-1">
          <div className="rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-[0_30px_80px_rgba(14,116,144,0.14)] ring-1 ring-sky-100 backdrop-blur md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700">
              Start your search
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
              Discover homes in a few keystrokes
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Use the search bar to go directly to a location-based listings
              search, or browse everything first and filter from there.
            </p>

            <div className="mt-6">
              <SearchBar />
            </div>

            <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-sky-50/80 px-4 py-3 text-sm text-slate-600">
              <span>Prefer to explore first?</span>
              <Link
                href="/listings"
                className="font-semibold text-cyan-700 transition hover:text-cyan-800"
              >
                Browse all listings
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
