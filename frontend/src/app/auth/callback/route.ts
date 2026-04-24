import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/features/auth/lib/supabase-server";

function getSafeNextPath(nextPath: string | null) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/favorites";
  }

  return nextPath;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = getSafeNextPath(requestUrl.searchParams.get("next"));
  const errorDescription =
    requestUrl.searchParams.get("error_description") ??
    requestUrl.searchParams.get("error");

  if (errorDescription) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("error", errorDescription);
    loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl);
  }

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const loginUrl = new URL("/login", requestUrl.origin);
      loginUrl.searchParams.set("error", error.message);
      loginUrl.searchParams.set("next", nextPath);
      return NextResponse.redirect(loginUrl);
    }
  }

  const redirectUrl = new URL(nextPath, requestUrl.origin);
  return NextResponse.redirect(redirectUrl);
}
