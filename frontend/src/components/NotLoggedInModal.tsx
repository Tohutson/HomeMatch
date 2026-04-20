"use client";

import { type FormEvent, useState } from "react";

type Props = {
  onDismiss: () => void;
  onLogIn: (email: string, password: string) => Promise<void> | void;
  isSubmitting?: boolean;
  error?: string | null;
  title?: string;
  description?: string;
  submitLabel?: string;
};

export default function NotLoggedInModal({
  onDismiss,
  onLogIn,
  isSubmitting = false,
  error = null,
  title = "Please log in to save favorites",
  description =
    "Enter your email and password to continue. If this is your first time, we will create your account.",
  submitLabel = "Continue",
}: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

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

        {(localError || error) && (
          <p
            className="mb-4 text-sm font-medium text-rose-600"
            data-testid="modal-login-error"
          >
            {localError ?? error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 rounded-lg bg-rose-500 px-4 py-2
                       font-medium text-white hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
            data-testid="modal-login-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : submitLabel}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 rounded-lg border border-zinc-300 px-4 py-2
                       font-medium text-zinc-700 hover:bg-zinc-50"
            data-testid="modal-signup-button"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}