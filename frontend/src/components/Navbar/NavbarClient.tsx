"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/features/auth/context/auth-context";
import { DEFAULT_POST_LOGIN_PATH } from "@/features/auth/lib/redirect-path";
import { useFavoritesContext } from "@/features/favorites/context/favorites-context";
import SearchBar from "@/features/search/components/SearchBar";

function buildLoginHref(pathname: string, search: string) {
  const currentPath = `${pathname}${search ? `?${search}` : ""}`;
  const loginNextPath =
    pathname === "/login" || pathname === "/signup" || pathname.startsWith("/auth/")
      ? DEFAULT_POST_LOGIN_PATH
      : currentPath;

  return `/login?${new URLSearchParams({
    next: loginNextPath,
  }).toString()}`;
}

function LoginLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
      data-testid="login-button"
    >
      Log In / Sign Up
    </Link>
  );
}

function LoginLinkWithSearchParams({ pathname }: { pathname: string }) {
  const searchParams = useSearchParams();

  return <LoginLink href={buildLoginHref(pathname, searchParams.toString())} />;
}

export default function NavbarClient() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthReady, isAuthenticated, logout } = useAuth();
  const { favoriteCount } = useFavoritesContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogout = async () => {
    try {
      setIsSubmitting(true);
      await logout();
      router.push("/");
      router.refresh();
    } catch {
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

            {isAuthReady && isAuthenticated ? (
              <>
                <Link
                  href="/profile"
                  className="hidden max-w-48 truncate rounded-full bg-white/80 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-white md:inline-block"
                  title={user?.email ?? ""}
                  data-testid="logged-in-email"
                >
                  {user?.email ?? "Profile"}
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
              <Suspense
                fallback={<LoginLink href={buildLoginHref(pathname, "")} />}
              >
                <LoginLinkWithSearchParams pathname={pathname} />
              </Suspense>
            )}
          </div>
        </div>

        <div className="px-6 pb-3 md:hidden">
          <SearchBar />
        </div>
      </nav>
    </>
  );
}
