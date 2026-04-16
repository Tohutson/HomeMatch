import { API_BASE } from "@/lib/env";
import type { FavoriteRecord } from "./types";

export async function getFavorites(
  userId: number,
  signal?: AbortSignal
): Promise<FavoriteRecord[]> {
  const res = await fetch(`${API_BASE}/api/users/${userId}/favorites`, {
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
  userId: number,
  listingId: number
): Promise<Response> {
  return fetch(`${API_BASE}/api/users/${userId}/favorites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ listingId }),
  });
}

export async function removeFavorite(
  userId: number,
  listingId: number
): Promise<Response> {
  return fetch(`${API_BASE}/api/users/${userId}/favorites/${listingId}`, {
    method: "DELETE",
  });
}
