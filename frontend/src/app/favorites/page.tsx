import FavoritesPage from "@/features/favorites/pages/FavoritesPage";
import { createServerSupabaseClient } from "@/features/auth/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function Page() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/login?next=/favorites");
  }

  return <FavoritesPage />;
}
