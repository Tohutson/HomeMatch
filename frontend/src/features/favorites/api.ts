import type { FavoriteRecord } from "./types";
import { apiFetch } from "@/lib/api";

export async function getFavorites(
  signal?: AbortSignal,
): Promise<FavoriteRecord[]> {
  const res = await apiFetch("/api/users/me/favorites", {
    method: "GET",
    cache: "no-store",
    signal,
  });

  if (!res.ok) {
    throw new Error("Failed to fetch favorites");
  }

  return (await res.json()) as FavoriteRecord[];
}

export async function addFavorite(
  listingId: number,
): Promise<Response> {
  return apiFetch("/api/users/me/favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listingId }),
  });
}

export async function removeFavorite(
  listingId: number,
): Promise<Response> {
  return apiFetch(`/api/users/me/favorites/${listingId}`, {
    method: "DELETE",
  });
}
