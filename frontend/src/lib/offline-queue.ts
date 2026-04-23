import { apiFetch } from "@/lib/api";

const QUEUE_KEY = "homematch_offline_favorite_queue";

export type QueuedFavorite = {
  listingId: number;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function enqueueOfflineFavorite(item: QueuedFavorite): void {
  if (!isBrowser()) return;

  const existing = getOfflineQueue();
  const already = existing.some(
    (q) => q.listingId === item.listingId
  );

  if (!already) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify([...existing, item]));
  }
}

export function getOfflineQueue(): QueuedFavorite[] {
  if (!isBrowser()) return [];

  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedFavorite[]) : [];
  } catch {
    return [];
  }
}

export function removeFromOfflineQueue(item: QueuedFavorite): void {
  if (!isBrowser()) return;

  const updated = getOfflineQueue().filter(
    (q) => q.listingId !== item.listingId
  );
  localStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
}

export function clearOfflineQueue(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(QUEUE_KEY);
}

export async function flushOfflineQueue(): Promise<number> {
  if (!isBrowser()) return 0;

  const queue = getOfflineQueue();
  if (queue.length === 0) return 0;

  let synced = 0;

  for (const item of queue) {
    try {
      const res = await apiFetch("/api/users/me/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: item.listingId }),
      });

      if (res.ok || res.status === 409) {
        removeFromOfflineQueue(item);
        synced++;
      }
    } catch {
      // Leave item in queue for a later retry
    }
  }

  return synced;
}
