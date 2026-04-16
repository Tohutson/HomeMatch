import { API_BASE } from "@/lib/env";

const USER_ID_KEY = "homematch_user_id";

export function getStoredUserId(): number | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(USER_ID_KEY);

  if (!stored) {
    return null;
  }

  const parsed = Number.parseInt(stored, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function getOrCreateUserId(): Promise<number> {
  const stored = getStoredUserId();

  if (stored) return stored;
  if (typeof window === "undefined") return 0;

  const res = await fetch(`${API_BASE}/api/users`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to create user");

  const data = await res.json();
  localStorage.setItem(USER_ID_KEY, String(data.id));
  return data.id;
}
