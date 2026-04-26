import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AuthProvider,
  useAuth,
} from "@/features/auth/context/auth-context";
import { createBrowserSupabaseClient } from "@/features/auth/lib/supabase-browser";

jest.mock("@/features/auth/lib/supabase-browser", () => ({
  createBrowserSupabaseClient: jest.fn(),
}));

describe("AuthProvider", () => {
  const getSession = jest.fn();
  const onAuthStateChange = jest.fn();
  const signInWithPassword = jest.fn();
  const signUp = jest.fn();
  const signInWithOAuth = jest.fn();
  const signOut = jest.fn();

  beforeEach(() => {
    getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: jest.fn(),
        },
      },
    });
    signInWithPassword.mockResolvedValue({
      data: {
        session: {
          access_token: "test-access-token",
          user: {
            id: "supabase-user-1",
            email: "test@example.com",
          },
        },
        user: {
          id: "supabase-user-1",
          email: "test@example.com",
        },
      },
      error: null,
    });
    signUp.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    signInWithOAuth.mockResolvedValue({
      data: { url: "http://localhost:3000/auth/callback" },
      error: null,
    });
    signOut.mockResolvedValue({ error: null });

    jest.mocked(createBrowserSupabaseClient).mockReturnValue({
      auth: {
        getSession,
        onAuthStateChange,
        signInWithPassword,
        signUp,
        signInWithOAuth,
        signOut,
      },
    } as never);
  });

  afterEach(() => {
    jest.resetAllMocks();
    localStorage.clear();
  });

  it("updates UI after login", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Signed out")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Log In" }));

    await waitFor(() => {
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
    });
  });

  it("clears the current user's offline queue on logout", async () => {
    const user = userEvent.setup();

    getSession.mockResolvedValue({
      data: {
        session: {
          access_token: "test-access-token",
          user: {
            id: "supabase-user-1",
            email: "test@example.com",
          },
        },
      },
      error: null,
    });

    localStorage.setItem(
      "favorites_queue_supabase-user-1",
      JSON.stringify([{ listingId: 42 }]),
    );

    render(
      <AuthProvider>
        <AuthHarness />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Log Out" }));

    await waitFor(() => {
      expect(screen.getByText("Signed out")).toBeInTheDocument();
    });

    expect(localStorage.getItem("favorites_queue_supabase-user-1")).toBeNull();
  });
});

function AuthHarness() {
  const { user, login, logout } = useAuth();

  return (
    <div>
      <p>{user?.email ?? "Signed out"}</p>
      <button
        type="button"
        onClick={() => void login("test@example.com", "secret123")}
      >
        Log In
      </button>
      <button type="button" onClick={() => void logout()}>
        Log Out
      </button>
    </div>
  );
}
