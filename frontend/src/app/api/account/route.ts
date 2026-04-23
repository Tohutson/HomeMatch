import { NextResponse } from "next/server";
import { API_BASE } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json(
      {
        error:
          "Account deletion is not configured. Missing Supabase service role settings.",
      },
      { status: 500 }
    );
  }

  const appUserDelete = await fetch(`${API_BASE}/api/users/me`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!appUserDelete.ok && appUserDelete.status !== 404) {
    return NextResponse.json(
      { error: "Unable to delete HomeMatch account data." },
      { status: 502 }
    );
  }

  const authDelete = await fetch(
    `${supabaseUrl}/auth/v1/admin/users/${session.user.id}`,
    {
      method: "DELETE",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    }
  );

  if (!authDelete.ok) {
    return NextResponse.json(
      { error: "Unable to delete Supabase Auth account." },
      { status: 502 }
    );
  }

  await supabase.auth.signOut();

  return new NextResponse(null, { status: 204 });
}
