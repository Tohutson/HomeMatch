import { createClient } from "@/lib/supabase/server";
import NavbarClient from "./NavbarClient";

export default async function Navbar() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  const user = data?.claims
    ? {
        id: data.claims.sub as string,
        email: (data.claims.email as string | undefined) ?? null,
      }
    : null;

  return <NavbarClient user={user} />;
}
