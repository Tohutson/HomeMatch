const QUEUE_KEY = "homematch_offline_favorite_queue";

export type QueuedFavorite = {
  userId: number;
  listingId: number;
};

export function enqueueOfflineFavorite(item: QueuedFavorite): void {
  const existing = getOfflineQueue();
  const already = existing.some(
    (q) => q.userId === item.userId && q.listingId === item.listingId
  );

  if (!already) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify([...existing, item]));
  }
}

export function getOfflineQueue(): QueuedFavorite[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedFavorite[]) : [];
  } catch {
    return [];
  }
}

export function removeFromOfflineQueue(item: QueuedFavorite): void {
  const updated = getOfflineQueue().filter(
    (q) => !(q.userId === item.userId && q.listingId === item.listingId)
  );
  localStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
}

export function clearOfflineQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}

export async function flushOfflineQueue(apiBase: string): Promise<number> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return 0;

  let synced = 0;

  for (const item of queue) {
    try {
      const res = await fetch(
        `${apiBase}/api/users/${item.userId}/favorites`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId: item.listingId }),
        }
      );

      if (res.ok || res.status === 409) {
        removeFromOfflineQueue(item);
        synced++;
      }
    } catch {
      // Network still down — leave in queue
    }
  }

  return synced;
}