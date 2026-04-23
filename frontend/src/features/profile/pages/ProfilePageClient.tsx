"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ProfileUser = {
  id: number;
  supabaseUserId: string;
  email: string;
};

type Props = {
  user: ProfileUser;
  canDeleteAccount: boolean;
};

export default function ProfilePageClient({ user, canDeleteAccount }: Props) {
  const router = useRouter();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDeleteAccount() {
    setIsDeleting(true);
    setError(null);

    const res = await fetch("/api/account", {
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
          <ProfileField label="Email" value={user.email} />
          <ProfileField label="HomeMatch user id" value={String(user.id)} />
          <ProfileField label="Supabase user id" value={user.supabaseUserId} />
        </div>

        <div className="mt-10 rounded-[28px] border border-rose-200 bg-rose-50/80 p-5">
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-rose-950">
            Delete account
          </h2>
          <p className="mt-2 text-sm leading-6 text-rose-900/75">
            This removes your HomeMatch user data, favorites, and Supabase Auth
            account. This action cannot be undone.
          </p>

          {!canDeleteAccount && (
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              Account deletion needs `SUPABASE_SERVICE_ROLE_KEY` configured on
              the frontend server.
            </p>
          )}

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
                disabled={!canDeleteAccount}
                className="rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
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
