"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/auth-context";
import { apiFetch } from "@/lib/api";

type ProfileUser = {
  supabaseUserId: string;
};

export default function ProfilePageClient() {
  const router = useRouter();
  const { user: authUser, logout } = useAuth();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setLoadingProfile(true);
        const response = await apiFetch("/api/users/me", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load profile.");
        }

        const data = (await response.json()) as ProfileUser;

        if (!cancelled) {
          setProfile(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load profile.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingProfile(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDeleteAccount() {
    setIsDeleting(true);
    setError(null);

    const res = await apiFetch("/api/users/me", {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "Unable to delete your account right now.");
      setIsDeleting(false);
      return;
    }

    await logout();
    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[radial-gradient(circle_at_top,_rgba(186,230,253,0.75),_transparent_34%),linear-gradient(180deg,_#f8fafc_0%,_#eef7fb_100%)] px-6 py-12 text-slate-950">
      <section className="mx-auto max-w-4xl rounded-[36px] border border-white/80 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">
          Account
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
          Your profile
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Your HomeMatch profile is linked to Supabase Auth. Favorites and
          saved-home actions use this account automatically.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <ProfileField
            label="Email"
            value={authUser?.email ?? "No email available"}
          />
          <ProfileField
            label="Supabase user id"
            value={profile?.supabaseUserId ?? authUser?.id ?? "Loading..."}
          />
        </div>

        {loadingProfile && (
          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading profile details...
          </p>
        )}

        <div className="mt-10 rounded-[28px] border border-rose-200 bg-rose-50/80 p-5">
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-rose-950">
            Delete account
          </h2>
          <p className="mt-2 text-sm leading-6 text-rose-900/75">
            This removes your HomeMatch user data, favorites, and Supabase Auth
            account. This action cannot be undone.
          </p>

          {error && (
            <p className="mt-4 rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            {!isConfirmingDelete ? (
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Delete account
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => void handleDeleteAccount()}
                  disabled={isDeleting}
                  className="rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Yes, delete my account"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsConfirmingDelete(false);
                    setError(null);
                  }}
                  disabled={isDeleting}
                  className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-all text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}
