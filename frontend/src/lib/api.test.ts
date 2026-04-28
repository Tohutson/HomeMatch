import { apiFetch } from "@/lib/api";
import { createBrowserSupabaseClient } from "@/features/auth/lib/supabase-browser";

jest.mock("@/features/auth/lib/supabase-browser", () => ({
  createBrowserSupabaseClient: jest.fn(),
}));

describe("apiFetch", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
    } as Response);

    jest.mocked(createBrowserSupabaseClient).mockReturnValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: {
            session: {
              access_token: "test-access-token",
            },
          },
        }),
      },
    } as never);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("attaches the Supabase access token to API requests", async () => {
    await apiFetch("/api/users/me/favorites", {
      method: "GET",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/users/me/favorites"),
      expect.objectContaining({
        headers: expect.any(Headers),
        method: "GET",
      }),
    );

    const [, options] = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      { headers: Headers }
    ];
    expect(options.headers.get("Authorization")).toBe(
      "Bearer test-access-token",
    );
  });
});
