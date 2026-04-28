"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

type AuthMode = "login" | "signup";

type Props = {
  onDismiss: () => void;
  onLogIn: (email: string, password: string) => Promise<void> | void;
  onSignUp?: (email: string, password: string) => Promise<void> | void;
  onContinueWithGoogle?: () => Promise<void> | void;
  isSubmitting?: boolean;
  error?: string | null;
  message?: string | null;
  title?: string;
  description?: string;
  initialMode?: AuthMode;
};

export default function NotLoggedInModal({
  onDismiss,
  onLogIn,
  onSignUp,
  onContinueWithGoogle,
  isSubmitting = false,
  error = null,
  message = null,
  title = "Please log in to save favorites",
  description =
    "Log in or create an account to continue, or use Google to sign in faster.",
  initialMode = "login",
}: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [mode, setMode] = useState<AuthMode>(initialMode);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setLocalError("Please enter your email.");
      return;
    }

    if (!normalizedEmail.includes("@")) {
      setLocalError("Please enter a valid email address.");
      return;
    }

    if (!password.trim()) {
      setLocalError("Please enter your password.");
      return;
    }

    if (password.trim().length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return;
    }

    setLocalError(null);
    if (mode === "signup" && onSignUp) {
      void onSignUp(normalizedEmail, password);
      return;
    }

    void onLogIn(normalizedEmail, password);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center
                 bg-black/50 p-4"
      data-testid="not-logged-in-modal"
      onClick={onDismiss}
    >
      <form
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-2 text-lg font-bold text-zinc-900">{title}</h2>
        <p className="mb-4 text-sm text-zinc-500">{description}</p>

        {onSignUp ? (
          <div className="mb-4 grid grid-cols-2 rounded-lg bg-zinc-100 p-1">
            <button
              type="button"
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                mode === "login"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
              onClick={() => {
                setMode("login");
                setLocalError(null);
              }}
            >
              Log in
            </button>
            <button
              type="button"
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                mode === "signup"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
              onClick={() => {
                setMode("signup");
                setLocalError(null);
              }}
            >
              Create account
            </button>
          </div>
        ) : null}

        <label
          htmlFor="login-email"
          className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500"
        >
          Email
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (localError) {
              setLocalError(null);
            }
          }}
          placeholder="you@example.com"
          className="mb-3 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-0 transition focus:border-rose-400"
          data-testid="modal-email-input"
          disabled={isSubmitting}
          autoFocus
        />

        <label
          htmlFor="login-password"
          className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500"
        >
          Password
        </label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            if (localError) {
              setLocalError(null);
            }
          }}
          placeholder="At least 6 characters"
          className="mb-3 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-0 transition focus:border-rose-400"
          data-testid="modal-password-input"
          disabled={isSubmitting}
        />

        {message ? (
          <p className="mb-4 text-sm font-medium text-emerald-700">{message}</p>
        ) : null}

        {(localError || error) && (
          <p
            className="mb-4 text-sm font-medium text-rose-600"
            data-testid="modal-login-error"
          >
            {localError ?? error}
          </p>
        )}

        {onContinueWithGoogle ? (
          <>
            <button
              type="button"
              onClick={() => void onContinueWithGoogle()}
              className="mb-4 w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-70"
              data-testid="modal-google-login-button"
              disabled={isSubmitting}
            >
              Continue with Google
            </button>

            <div className="mb-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
              <span className="h-px flex-1 bg-zinc-200" />
              <span>or</span>
              <span className="h-px flex-1 bg-zinc-200" />
            </div>
          </>
        ) : null}

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 rounded-lg bg-rose-500 px-4 py-2
                       font-medium text-white hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
            data-testid="modal-login-button"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? mode === "signup"
                ? "Creating..."
                : "Saving..."
              : mode === "signup"
                ? "Create account"
                : "Continue"}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 rounded-lg border border-zinc-300 px-4 py-2
                       font-medium text-zinc-700 hover:bg-zinc-50"
            data-testid="modal-cancel-button"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>

        {!onSignUp ? (
          <p className="mt-4 text-center text-sm text-zinc-500">
            Need an account?{" "}
            <Link
              href="/login?mode=signup"
              className="font-semibold text-cyan-700"
              onClick={onDismiss}
            >
              Create one
            </Link>
          </p>
        ) : null}
      </form>
    </div>
  );
}
