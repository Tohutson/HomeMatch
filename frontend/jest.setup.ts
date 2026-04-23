import "@testing-library/jest-dom";

const mockSupabaseSession = {
  access_token: "test-access-token",
  user: {
    id: "supabase-user-1",
    email: "test@example.com",
  },
};

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: mockSupabaseSession },
      }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      }),
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: mockSupabaseSession.user },
        error: null,
      }),
      signInWithOAuth: jest.fn().mockResolvedValue({
        data: { url: "http://localhost:3000/auth/callback" },
        error: null,
      }),
      exchangeCodeForSession: jest.fn().mockResolvedValue({
        data: { session: mockSupabaseSession },
        error: null,
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  }),
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: {
      getClaims: jest.fn().mockResolvedValue({
        data: {
          claims: {
            sub: mockSupabaseSession.user.id,
            email: mockSupabaseSession.user.email,
          },
        },
        error: null,
      }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: mockSupabaseSession },
      }),
    },
  }),
}));

(
  globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  }
).IS_REACT_ACT_ENVIRONMENT = true;

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "0px";
  readonly thresholds = [0];

  disconnect() {}
  observe() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  unobserve() {}
}

Object.defineProperty(global, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

Object.defineProperty(global, "matchMedia", {
  writable: true,
  configurable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }),
});

Object.defineProperty(global, "scrollTo", {
  writable: true,
  configurable: true,
  value: jest.fn(),
});
