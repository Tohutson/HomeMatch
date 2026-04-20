import { API_BASE } from "@/lib/env";

const USER_SESSION_KEY = "homematch_user_session";

type StoredUserSession = {
  id: number;
  email: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function parseStoredUserSession(value: string | null): StoredUserSession | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<StoredUserSession>;
    const id = Number(parsed.id);
    const email = typeof parsed.email === "string" ? parsed.email : "";

    if (!Number.isFinite(id) || id <= 0 || !email) {
      return null;
    }

    return {
      id,
      email,
    };
  } catch {
    return null;
  }
}

function setStoredUserSession(session: StoredUserSession): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
}

export function clearStoredUserSession(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(USER_SESSION_KEY);
}

export function getStoredUserSession(): StoredUserSession | null {
  if (typeof window === "undefined") return null;

  return parseStoredUserSession(localStorage.getItem(USER_SESSION_KEY));
}

export function getStoredUserId(): number | null {
  return getStoredUserSession()?.id ?? null;
}

export function getStoredUserEmail(): string | null {
  return getStoredUserSession()?.email ?? null;
}

export async function loginOrCreateUser(
  email: string,
  password: string
): Promise<StoredUserSession> {
  if (typeof window === "undefined") {
    throw new Error("Login is only available in the browser");
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = password.trim();

  if (!normalizedEmail) {
    throw new Error("Email is required");
  }

  if (!normalizedPassword) {
    throw new Error("Password is required");
  }

  if (normalizedPassword.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const res = await fetch(`${API_BASE}/api/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: normalizedEmail, password: normalizedPassword }),
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Invalid email or password");
    }

    throw new Error("Failed to log in");
  }

  const data = (await res.json()) as { id?: number };
  const id = Number(data.id);

  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Invalid user ID returned from server");
  }

  const session = {
    id,
    email: normalizedEmail,
  };

  setStoredUserSession(session);
  return session;
}

export async function getOrCreateUserId(
  email?: string,
  password?: string
): Promise<number> {
  const stored = getStoredUserId();

  if (stored) return stored;

  if (!email || !password) {
    throw new Error("Email and password are required to create a user");
  }

  const session = await loginOrCreateUser(email, password);
  return session.id;
}
