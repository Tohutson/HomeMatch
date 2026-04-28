import { apiFetch } from "@/lib/api";

export type QueuedFavorite = {
  listingId: number;
};

function queueKey(userSub: string): string {
  return `favorites_queue_${userSub}`;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function enqueueOfflineFavorite(userSub: string, item: QueuedFavorite): void {
  if (!isBrowser()) return;

  const existing = getOfflineQueue(userSub);
  const already = existing.some(
    (q) => q.listingId === item.listingId
  );

  if (!already) {
    localStorage.setItem(queueKey(userSub), JSON.stringify([...existing, item]));
  }
}

export function getOfflineQueue(userSub: string): QueuedFavorite[] {
  if (!isBrowser()) return [];

  try {
    const raw = localStorage.getItem(queueKey(userSub));
    return raw ? (JSON.parse(raw) as QueuedFavorite[]) : [];
  } catch {
    return [];
  }
}

export function removeFromOfflineQueue(userSub: string, item: QueuedFavorite): void {
  if (!isBrowser()) return;

  const updated = getOfflineQueue(userSub).filter(
    (q) => q.listingId !== item.listingId
  );
  localStorage.setItem(queueKey(userSub), JSON.stringify(updated));
}

export function clearOfflineQueue(userSub: string): void {
  if (!isBrowser()) return;
  localStorage.removeItem(queueKey(userSub));
}

export async function flushOfflineQueue(userSub: string): Promise<number> {
  if (!isBrowser()) return 0;

  const queue = getOfflineQueue(userSub);
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
        removeFromOfflineQueue(userSub, item);
        synced++;
      }
    } catch {
      // Leave item in queue for a later retry
    }
  }

  return synced;
}
