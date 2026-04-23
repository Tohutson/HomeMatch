"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFavoritesContext } from "@/features/favorites/context/favorites-context";
import SearchBar from "@/features/search/components/SearchBar";
import NotLoggedInModal from "@/components/NotLoggedInModal";

type NavbarUser = {
  id: string;
  email: string | null;
} | null;

export default function NavbarClient({ user }: { user: NavbarUser }) {
  const router = useRouter();
  const {
    user: sessionUser,
    isUserReady,
    favoriteCount,
    signIn,
    signInWithGoogle,
    signOut,
  } = useFavoritesContext();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const currentUser = isUserReady ? sessionUser : user;

  const handleLogin = async (email: string, password: string) => {
    try {
      setIsSubmitting(true);
      setAuthError(null);

      const didSignIn = await signIn(email, password);

      if (!didSignIn) {
        setAuthError("Invalid email or password.");
        return;
      }

      setShowLoginModal(false);
      router.refresh();
    } catch {
      setAuthError("Unable to log in right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsSubmitting(true);
      setAuthError(null);

      const didStartLogin = await signInWithGoogle("/favorites");

      if (!didStartLogin) {
        setAuthError("Unable to start Google sign-in right now. Please try again.");
      }
    } catch {
      setAuthError("Unable to start Google sign-in right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsSubmitting(true);
      setAuthError(null);
      setShowLoginModal(false);
      await signOut();
      router.push("/");
      router.refresh();
    } catch {
      setAuthError("Unable to log out right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <nav className="relative z-40 w-full border-b border-sky-200/70 bg-linear-to-r from-sky-100 via-cyan-50 to-white shadow-[0_10px_35px_rgba(14,116,144,0.08)] backdrop-blur">
        <div className="flex min-h-18 w-full items-center justify-between gap-4 px-6 py-3 md:px-8">
          <Link
            href="/"
            className="text-xl font-semibold tracking-[-0.03em] text-slate-900 transition hover:opacity-80"
          >
            HomeMatch
          </Link>

          <div className="mx-4 hidden flex-1 max-w-2xl md:block">
            <SearchBar />
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/favorites"
              className="rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-rose-600"
              data-testid="favorites-nav-link"
            >
              ♥ Favorites ({favoriteCount})
            </Link>

            {currentUser ? (
              <>
                <Link
                  href="/profile"
                  className="hidden max-w-48 truncate rounded-full bg-white/80 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-white md:inline-block"
                  title={currentUser.email ?? ""}
                  data-testid="logged-in-email"
                >
                  {currentUser.email ?? "Profile"}
                </Link>

                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  data-testid="logout-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Logging Out..." : "Log Out"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthError(null);
                  setShowLoginModal(true);
                }}
                className="rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
                data-testid="login-button"
              >
                Log In
              </button>
            )}
          </div>
        </div>

        <div className="px-6 pb-3 md:hidden">
          <SearchBar />
        </div>
      </nav>

      {showLoginModal && (
        <NotLoggedInModal
          onDismiss={() => setShowLoginModal(false)}
          onLogIn={handleLogin}
          onContinueWithGoogle={handleGoogleLogin}
          isSubmitting={isSubmitting}
          error={authError}
          title="Log in to HomeMatch"
          description="Use your email and password or continue with Google."
          submitLabel="Continue"
        />
      )}
    </>
  );
}
