import Link from "next/link";

type ListingsHeaderProps = {
  favoriteCount: number;
};

export function ListingsHeader({ favoriteCount }: ListingsHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-3xl font-bold">HomeMatch Listings</h1>
      <Link
        href="/favorites"
        className="rounded-lg bg-rose-500 px-4 py-2 text-white transition-colors hover:bg-rose-600"
        data-testid="favorites-nav-link"
      >
        ♥ Favorites ({favoriteCount})
      </Link>
    </div>
  );
}
