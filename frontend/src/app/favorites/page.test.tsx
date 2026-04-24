import FavoritesRoutePage from "@/app/favorites/page";
import { createServerSupabaseClient } from "@/features/auth/lib/supabase-server";
import { redirect } from "next/navigation";

jest.mock("@/features/auth/lib/supabase-server", () => ({
  createServerSupabaseClient: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

describe("favorites route protection", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("redirects unauthenticated users to login", async () => {
    jest.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: {
        getClaims: jest.fn().mockResolvedValue({
          data: { claims: null },
          error: new Error("missing session"),
        }),
      },
    } as never);

    await FavoritesRoutePage();

    expect(redirect).toHaveBeenCalledWith("/login?next=/favorites");
  });
});
