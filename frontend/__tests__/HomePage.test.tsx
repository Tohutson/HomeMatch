import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HomePage from "../app/page";

jest.mock("../app/lib/userId", () => ({
  getOrCreateUserId: jest.fn().mockResolvedValue(1),
}));

jest.mock("../app/lib/offlineQueue", () => ({
  enqueueOfflineFavorite: jest.fn(),
  flushOfflineQueue: jest.fn().mockResolvedValue(0),
  getOfflineQueue: jest.fn().mockReturnValue([]),
  removeFromOfflineQueue: jest.fn(),
  clearOfflineQueue: jest.fn(),
}));

const mockListings = [
  {
    id: 1,
    address: "30 Pitt St",
    price: 250000,
    beds: 3,
    baths: 1.5,
    sqft: 2250,
    photoUrls: [],
  },
  {
    id: 2,
    address: "40 Forbes Ave",
    price: 525000,
    beds: 4,
    baths: 3.0,
    sqft: 3100,
    photoUrls: [],
  },
];

function buildFetchMock(
  opts: { conflictOnPost?: boolean; errorOnPost?: boolean } = {}
) {
  return jest.fn().mockImplementation((url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";

    if (url.includes("/api/favorites/last") && method === "DELETE") {
      return Promise.resolve({ ok: true });
    }
    if (url.includes("/api/favorites") && method === "POST") {
      if (opts.conflictOnPost) {
        return Promise.resolve({ ok: false, status: 409 });
      }
      if (opts.errorOnPost) {
        return Promise.resolve({ ok: false, status: 503 });
      }
      return Promise.resolve({
        ok: true,
        status: 201,
        json: () =>
          Promise.resolve({
            id: 99,
            userId: 1,
            listing: mockListings[0],
            createdAt: new Date().toISOString(),
          }),
      });
    }
    if (url.includes("/api/favorites") && method === "DELETE") {
      return Promise.resolve({ ok: true });
    }
    if (url.includes("/api/favorites") && method === "GET") {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    }
    if (url.includes("/api/listings")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({ content: mockListings, totalPages: 1 }),
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
}

describe("HomePage", () => {
  beforeEach(() => {
    global.fetch = buildFetchMock();
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
  });

  afterEach(() => jest.clearAllMocks());

  it("renders listings after loading", async () => {
    render(<HomePage />);
    await waitFor(() =>
      expect(screen.getByText("30 Pitt St")).toBeInTheDocument()
    );
  });

  it("shows favorites nav link in the header", async () => {
    render(<HomePage />);
    await waitFor(() =>
      expect(
        screen.getByTestId("favorites-nav-link")
      ).toBeInTheDocument()
    );
  });

  // UC-1.4 step 13: card advances after favoriting via heart click
  it("advances to the next listing after favoriting via heart click", async () => {
    render(<HomePage />);
    await waitFor(() => screen.getByText("30 Pitt St"));
    await act(async () => {
      await userEvent.click(screen.getByTestId("favorite-button"));
    });
    await waitFor(() =>
      expect(screen.getByText("40 Forbes Ave")).toBeInTheDocument()
    );
    expect(screen.queryByText("30 Pitt St")).not.toBeInTheDocument();
  });

  // UC-1.5 step 14: undo returns card to browse stack
  it("navigates back to the undone listing card after undo", async () => {
    render(<HomePage />);
    await waitFor(() => screen.getByText("30 Pitt St"));
    await act(async () => {
      await userEvent.click(screen.getByTestId("favorite-button"));
    });
    await waitFor(() => screen.getByText("40 Forbes Ave"));
    await act(async () => {
      await userEvent.click(screen.getByTestId("undo-button"));
    });
    await waitFor(() =>
      expect(screen.getByText("30 Pitt St")).toBeInTheDocument()
    );
  });

  // UC-1.4 Exception 1: not logged in modal
  it("shows not-logged-in modal when userId is null and heart is clicked", async () => {
    const { getOrCreateUserId } =
      jest.requireMock("../app/lib/userId") as {
        getOrCreateUserId: jest.Mock;
      };
    getOrCreateUserId.mockResolvedValueOnce(null);

    render(<HomePage />);
    await waitFor(() => screen.getByTestId("favorite-button"));
    await act(async () => {
      await userEvent.click(screen.getByTestId("favorite-button"));
    });
    expect(
      screen.getByTestId("not-logged-in-modal")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Please log in to save favorites")
    ).toBeInTheDocument();
    expect(screen.getByTestId("modal-login-button")).toBeInTheDocument();
    expect(screen.getByTestId("modal-signup-button")).toBeInTheDocument();
  });

  it("dismisses the not-logged-in modal when Sign Up is clicked", async () => {
    const { getOrCreateUserId } =
      jest.requireMock("../app/lib/userId") as {
        getOrCreateUserId: jest.Mock;
      };
    getOrCreateUserId.mockResolvedValueOnce(null);

    render(<HomePage />);
    await waitFor(() => screen.getByTestId("favorite-button"));
    await act(async () => {
      await userEvent.click(screen.getByTestId("favorite-button"));
    });
    await userEvent.click(screen.getByTestId("modal-signup-button"));
    expect(
      screen.queryByTestId("not-logged-in-modal")
    ).not.toBeInTheDocument();
  });

  // UC-1.4 AF1: already in favorites
  it("shows 'This home is already in your favorites' toast on 409", async () => {
    global.fetch = buildFetchMock({ conflictOnPost: true });
    render(<HomePage />);
    await waitFor(() => screen.getByTestId("favorite-button"));
    await act(async () => {
      await userEvent.click(screen.getByTestId("favorite-button"));
    });
    await waitFor(() =>
      expect(
        screen.getByTestId("toast-notification")
      ).toHaveTextContent("This home is already in your favorites")
    );
  });

  // UC-1.4 Exception 2: backend 503
  it("shows 'Unable to save favorite' toast when backend returns 503", async () => {
    global.fetch = buildFetchMock({ errorOnPost: true });
    render(<HomePage />);
    await waitFor(() => screen.getByTestId("favorite-button"));
    await act(async () => {
      await userEvent.click(screen.getByTestId("favorite-button"));
    });
    await waitFor(() =>
      expect(
        screen.getByTestId("toast-notification")
      ).toHaveTextContent("Unable to save favorite. Please try again.")
    );
  });

  // UC-1.4 Exception 3: offline
  it("shows offline toast and sync indicator when network is offline", async () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });
    render(<HomePage />);
    await waitFor(() => screen.getByTestId("favorite-button"));
    await act(async () => {
      await userEvent.click(screen.getByTestId("favorite-button"));
    });
    await waitFor(() =>
      expect(
        screen.getByTestId("toast-notification")
      ).toHaveTextContent(
        "Saved locally. Will sync when connection restored."
      )
    );
  });

  // UC-1.4 step 12: "Added to Favorites" toast
  it("shows 'Added to Favorites' toast after favoriting", async () => {
    render(<HomePage />);
    await waitFor(() => screen.getByTestId("favorite-button"));
    await act(async () => {
      await userEvent.click(screen.getByTestId("favorite-button"));
    });
    await waitFor(() =>
      expect(
        screen.getByTestId("toast-notification")
      ).toHaveTextContent("Added to Favorites")
    );
  });

  // UC-1.5: undo banner appears
  it("shows undo banner with countdown after favoriting", async () => {
    render(<HomePage />);
    await waitFor(() => screen.getByTestId("favorite-button"));
    await act(async () => {
      await userEvent.click(screen.getByTestId("favorite-button"));
    });
    await waitFor(() =>
      expect(
        screen.getByTestId("undo-redo-banner")
      ).toBeInTheDocument()
    );
    expect(screen.getByTestId("undo-button")).not.toBeDisabled();
  });

  // UC-1.5 step 13: undo button disabled when stack empty but window open
  it("disables undo button when stack is empty but window has not expired", async () => {
    jest.useFakeTimers();
    render(<HomePage />);
    await waitFor(() => screen.getByTestId("favorite-button"));
    await act(async () => {
      await userEvent.click(screen.getByTestId("favorite-button"));
    });
    await act(async () => {
      await userEvent.click(screen.getByTestId("undo-button"));
    });
    await waitFor(() => {
      const btn = screen.getByTestId("undo-button");
      expect(btn).toBeInTheDocument();
      expect(btn).toBeDisabled();
    });
    jest.useRealTimers();
  });

  // UC-1.5 Exception 1: no recent likes to undo
  it("shows 'No recent likes to undo' when undo clicked with empty stack", async () => {
    render(<HomePage />);
    await waitFor(() => screen.getByTestId("favorite-button"));
    await act(async () => {
      await userEvent.click(screen.getByTestId("favorite-button"));
    });
    await act(async () => {
      await userEvent.click(screen.getByTestId("undo-button"));
    });
    const undoBtn = screen.getByTestId("undo-button");
    expect(undoBtn).toBeDisabled();
    await act(async () => {
      undoBtn.removeAttribute("disabled");
      await userEvent.click(undoBtn);
    });
    await waitFor(() =>
      expect(
        screen.getByTestId("toast-notification")
      ).toHaveTextContent("No recent likes to undo")
    );
  });

  // UC-1.5 Exception 2: full expiry message
  it("shows full expiry message when window expires", async () => {
    jest.useFakeTimers();
    render(<HomePage />);
    await waitFor(() => screen.getByTestId("favorite-button"));
    await act(async () => {
      await userEvent.click(screen.getByTestId("favorite-button"));
    });
    act(() => { jest.advanceTimersByTime(11_000); });
    await waitFor(() =>
      expect(
        screen.getByTestId("toast-notification")
      ).toHaveTextContent(
        "Undo window expired. Remove from Favorites page instead."
      )
    );
    jest.useRealTimers();
  });

  // UC-1.5 Exception 2: undo button hidden after window expires
  it("hides undo button after the 10-second window expires", async () => {
    jest.useFakeTimers();
    render(<HomePage />);
    await waitFor(() => screen.getByTestId("favorite-button"));
    await act(async () => {
      await userEvent.click(screen.getByTestId("favorite-button"));
    });
    expect(screen.getByTestId("undo-button")).toBeInTheDocument();
    act(() => { jest.advanceTimersByTime(11_000); });
    await waitFor(() =>
      expect(
        screen.queryByTestId("undo-button")
      ).not.toBeInTheDocument()
    );
    jest.useRealTimers();
  });

  // UC-1.5 step 12: toast with address on undo
  it("shows toast with address when undo is clicked", async () => {
    render(<HomePage />);
    await waitFor(() => screen.getByTestId("favorite-button"));
    await act(async () => {
      await userEvent.click(screen.getByTestId("favorite-button"));
    });
    await act(async () => {
      await userEvent.click(screen.getByTestId("undo-button"));
    });
    await waitFor(() =>
      expect(
        screen.getByTestId("toast-notification")
      ).toHaveTextContent(/Removed.*favorites/i)
    );
  });

  // UC-1.5 AF2: redo button appears after undo
  it("shows redo button after an undo action", async () => {
    render(<HomePage />);
    await waitFor(() => screen.getByTestId("favorite-button"));
    await act(async () => {
      await userEvent.click(screen.getByTestId("favorite-button"));
    });
    await act(async () => {
      await userEvent.click(screen.getByTestId("undo-button"));
    });
    await waitFor(() =>
      expect(screen.getByTestId("redo-button")).toBeInTheDocument()
    );
  });

  // UC-1.5 AF2: redo calls POST
  it("calls POST /api/favorites when redo is clicked", async () => {
    const fetchMock = buildFetchMock();
    global.fetch = fetchMock;
    render(<HomePage />);
    await waitFor(() => screen.getByTestId("favorite-button"));
    await act(async () => {
      await userEvent.click(screen.getByTestId("favorite-button"));
    });
    await act(async () => {
      await userEvent.click(screen.getByTestId("undo-button"));
    });
    await waitFor(() => screen.getByTestId("redo-button"));
    await act(async () => {
      await userEvent.click(screen.getByTestId("redo-button"));
    });
    const postCalls = (
      fetchMock.mock.calls as [string, RequestInit][]
    ).filter(
      ([url, init]) =>
        url.includes("/api/favorites") &&
        !url.includes("/last") &&
        init?.method === "POST"
    );
    expect(postCalls.length).toBe(2);
  });

  // UC-1.5 AF1: sequential undos
  it("supports multiple sequential undos within the window", async () => {
    const fetchMock = buildFetchMock();
    global.fetch = fetchMock;
    render(<HomePage />);
    await waitFor(() => screen.getByText("30 Pitt St"));
    await act(async () => {
      await userEvent.click(screen.getByTestId("favorite-button"));
    });
    await waitFor(() => screen.getByText("40 Forbes Ave"));
    await act(async () => {
      await userEvent.click(screen.getByTestId("favorite-button"));
    });
    await act(async () => {
      await userEvent.click(screen.getByTestId("undo-button"));
    });
    await waitFor(() => {
      const btn = screen.getByTestId("undo-button");
      expect(btn).toBeInTheDocument();
      expect(btn).not.toBeDisabled();
    });
  });

  // UC-1.5 Exception 3: undo returns 503 — property stays on stack
  it("shows 'Unable to undo' toast and keeps property in stack on 503", async () => {
    const fetchMock = jest.fn().mockImplementation(
      (url: string, init?: RequestInit) => {
        const method = init?.method ?? "GET";
        if (url.includes("/api/favorites/last") && method === "DELETE") {
          return Promise.resolve({ ok: false, status: 503 });
        }
        if (url.includes("/api/favorites") && method === "POST") {
          return Promise.resolve({
            ok: true, status: 201,
            json: () => Promise.resolve({
              id: 99, userId: 1,
              listing: mockListings[0],
              createdAt: new Date().toISOString(),
            }),
          });
        }
        if (url.includes("/api/favorites") && method === "GET") {
          return Promise.resolve({
            ok: true, json: () => Promise.resolve([]),
          });
        }
        if (url.includes("/api/listings")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ content: mockListings, totalPages: 1 }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
    );
    global.fetch = fetchMock;

    render(<HomePage />);
    await waitFor(() => screen.getByTestId("favorite-button"));
    await act(async () => {
      await userEvent.click(screen.getByTestId("favorite-button"));
    });
    await act(async () => {
      await userEvent.click(screen.getByTestId("undo-button"));
    });
    await waitFor(() =>
      expect(
        screen.getByTestId("toast-notification")
      ).toHaveTextContent("Unable to undo. Please try again.")
    );
    expect(screen.getByTestId("undo-button")).not.toBeDisabled();
  });

  // UC-1.4 AF2: clicking filled heart removes from favorites
  it("calls DELETE /api/favorites when unfavoriting", async () => {
    const fetchMock = buildFetchMock();
    global.fetch = fetchMock;
    render(<HomePage />);
    await waitFor(() => screen.getByTestId("favorite-button"));
    await act(async () => {
      await userEvent.click(screen.getByTestId("favorite-button"));
    });
    await act(async () => {
      await userEvent.click(screen.getByText("Previous"));
    });
    await act(async () => {
      await userEvent.click(screen.getByTestId("favorite-button"));
    });
    const deleteCalls = (
      fetchMock.mock.calls as [string, RequestInit][]
    ).filter(
      ([url, init]) =>
        url.includes("/api/favorites") &&
        !url.includes("/last") &&
        init?.method === "DELETE"
    );
    expect(deleteCalls.length).toBe(1);
  });
});