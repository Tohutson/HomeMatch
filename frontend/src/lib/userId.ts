const USER_ID_KEY = "homematch_user_id";
const API_BASE    = "http://localhost:8081";

export async function getOrCreateUserId(): Promise<number> {
  if (typeof window === "undefined") return 0;

  const stored = localStorage.getItem(USER_ID_KEY);
  if (stored) return parseInt(stored, 10);

  const res = await fetch(`${API_BASE}/api/users`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to create user");

  const data = await res.json();
  localStorage.setItem(USER_ID_KEY, String(data.id));
  return data.id;
}