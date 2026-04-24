import { redirect } from "next/navigation";
import ProfilePageClient from "@/features/profile/pages/ProfilePageClient";
import { createServerSupabaseClient } from "@/features/auth/lib/supabase-server";

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/login?next=/profile");
  }

  return (
    <ProfilePageClient />
  );
}
