import { redirect } from "next/navigation";
import ProfilePageClient from "@/features/profile/pages/ProfilePageClient";
import { API_BASE } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

type ProfileUser = {
  id: number;
  supabaseUserId: string;
  email: string;
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect("/login?next=/profile");
  }

  const res = await fetch(`${API_BASE}/api/users/me`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    cache: "no-store",
  });

  if (res.status === 401) {
    redirect("/login?next=/profile");
  }

  if (!res.ok) {
    throw new Error("Unable to load profile.");
  }

  const user = (await res.json()) as ProfileUser;

  return (
    <ProfilePageClient
      user={user}
      canDeleteAccount={Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)}
    />
  );
}
