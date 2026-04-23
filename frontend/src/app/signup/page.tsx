"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/favorites";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });

    setIsSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Check your email to confirm your account.");
    router.push("/login");
  }

  async function handleGoogleSignUp() {
    setError("");
    setMessage("");
    setIsGoogleSubmitting(true);

    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", nextPath);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectTo.toString(),
      },
    });

    setIsGoogleSubmitting(false);

    if (error) {
      setError(error.message);
    }
  }

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[radial-gradient(circle_at_top,_rgba(186,230,253,0.75),_transparent_34%),linear-gradient(180deg,_#f8fafc_0%,_#eef7fb_100%)] px-6 py-12 text-slate-950">
      <section className="mx-auto max-w-md rounded-[32px] border border-white/80 bg-white/85 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">
          Start saving homes
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
          Create account
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Create a Supabase-backed HomeMatch account for favorites and profile
          management.
        </p>

        <div className="mt-8 space-y-4">
          <button
            type="button"
            onClick={() => void handleGoogleSignUp()}
            disabled={isSubmitting || isGoogleSubmitting}
            className="w-full rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGoogleSubmitting
              ? "Redirecting to Google..."
              : "Sign up with Google"}
          </button>

          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            <span>or</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
                required
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
                required
                minLength={6}
              />
            </label>

            {message && (
              <p className="text-sm font-medium text-emerald-700">{message}</p>
            )}
            {error && (
              <p className="text-sm font-medium text-rose-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isGoogleSubmitting}
              className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-cyan-700">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}
