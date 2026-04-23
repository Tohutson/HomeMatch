"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

export default function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/favorites";
  const mode: AuthMode =
    searchParams.get("mode") === "signup" ? "signup" : "login";
  const oauthError =
    searchParams.get("error_description") ?? searchParams.get("error") ?? "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  function buildModeHref(nextMode: AuthMode) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextMode === "signup") {
      params.set("mode", "signup");
    } else {
      params.delete("mode");
    }

    const query = params.toString();
    return query ? `/login?${query}` : "/login";
  }

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });

      setIsSubmitting(false);

      if (error) {
        setError(error.message);
        return;
      }

      if (data.session) {
        router.push(nextPath);
        router.refresh();
        return;
      }

      setMessage(
        "If this email can be used for signup, check your inbox for the next step."
      );
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setIsSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push(nextPath);
    router.refresh();
  }

  async function handleGoogleSignIn() {
    setError("");
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
    <section className="mx-auto max-w-md rounded-[32px] border border-white/80 bg-white/85 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">
        {mode === "signup" ? "Start saving homes" : "Welcome back"}
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
        {mode === "signup" ? "Create account" : "Log in"}
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        {mode === "signup"
          ? "Create your HomeMatch account to save homes, manage favorites, and keep your shortlist synced."
          : "Use your HomeMatch account to save homes, manage favorites, and keep your shortlist synced."}
      </p>

      <div className="mt-8 space-y-4">
        <div className="grid grid-cols-2 rounded-full bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              router.replace(buildModeHref("login"));
              setError("");
              setMessage("");
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === "login"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-600 hover:text-slate-950"
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => {
              router.replace(buildModeHref("signup"));
              setError("");
              setMessage("");
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === "signup"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-600 hover:text-slate-950"
            }`}
          >
            Create account
          </button>
        </div>

        <button
          type="button"
          onClick={() => void handleGoogleSignIn()}
          disabled={isSubmitting || isGoogleSubmitting}
          className="w-full rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGoogleSubmitting ? "Redirecting to Google..." : "Continue with Google"}
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
              placeholder="Your password"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
              required
            />
          </label>

          {message && (
            <p className="text-sm font-medium text-emerald-700">{message}</p>
          )}

          {(error || oauthError) && (
            <p className="text-sm font-medium text-rose-600">
              {error || oauthError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isGoogleSubmitting}
            className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? mode === "signup"
                ? "Creating account..."
                : "Logging in..."
              : mode === "signup"
                ? "Create account"
                : "Log in"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
        <Link
          href={mode === "signup" ? "/login" : "/login?mode=signup"}
          className="font-semibold text-cyan-700"
        >
          {mode === "signup" ? "Log in" : "Create an account"}
        </Link>
      </p>
    </section>
  );
}
