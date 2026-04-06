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

function createResponse(body: unknown, init?: Partial<Response>) {
  return Promise.resolve({
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    json: async () => body,
  });
}

function buildFetchMock(
  opts: {
    conflictOnPost?: boolean;
    errorOnPost?: boolean;
    errorOnUndo?: boolean;
  } = {}
) {
  return jest.fn().mockImplementation((url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";

    if (url.includes("/api/users/1/favorites") && method === "GET") {
      return createResponse([]);
    }

    if (url.includes("/api/listings") && method === "GET") {
      return createResponse({ content: mockListings, totalPages: 1 });
    }

    if (url.includes("/api/users/1/favorites") && method === "POST") {
      if (opts.conflictOnPost) {
        return createResponse({}, { ok: false, status: 409 });
      }
      if (opts.errorOnPost) {
        return createResponse({}, { ok: false, status: 503 });
      }

      const listingId =
        init?.body && typeof init.body === "string"
          ? JSON.parse(init.body).listingId
          : 1;

      const listing =
        mockListings.find((item) => item.id === listingId) ?? mockListings[0];

      return createResponse(
        {
          id: 99,
          userId: 1,
          listing,
          createdAt: new Date().toISOString(),
        },
        { ok: true, status: 201 }
      );
    }

    if (url.includes("/api/users/1/favorites/") && method === "DELETE") {
      if (opts.errorOnUndo) {
        return createResponse({}, { ok: false, status: 503 });
      }
      return createResponse({}, { ok: true, status: 204 });
    }

    return createResponse({});
  });
}

async function renderHomePage() {
  render(<HomePage />);
  await screen.findByText("30 Pitt St");
}

describe("HomePage", () => {
  beforeEach(() => {
    global.fetch = buildFetchMock() as jest.Mock;
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("renders listings after loading", async () => {
    await renderHomePage();
    expect(screen.getByText("30 Pitt St")).toBeInTheDocument();
  });

  it("shows favorites nav link in the header", async () => {
    await renderHomePage();
    expect(screen.getByTestId("favorites-nav-link")).toBeInTheDocument();
  });

  it("advances to the next listing after favoriting via heart click", async () => {
    const user = userEvent.setup();
    await renderHomePage();

    await user.click(screen.getByTestId("favorite-button"));

    expect(await screen.findByText("40 Forbes Ave")).toBeInTheDocument();
    expect(screen.queryByText("30 Pitt St")).not.toBeInTheDocument();
  });

  it("navigates back to the undone listing card after undo", async () => {
    const user = userEvent.setup();
    await renderHomePage();

    await user.click(screen.getByTestId("favorite-button"));
    expect(await screen.findByText("40 Forbes Ave")).toBeInTheDocument();

    await user.click(screen.getByTestId("undo-button"));

    expect(await screen.findByText("30 Pitt St")).toBeInTheDocument();
  });

  it("shows not-logged-in modal when userId is null and heart is clicked", async () => {
    const user = userEvent.setup();
    const { getOrCreateUserId } =
      jest.requireMock("../app/lib/userId") as {
        getOrCreateUserId: jest.Mock;
      };

    getOrCreateUserId.mockResolvedValueOnce(null);

    await renderHomePage();
    await user.click(screen.getByTestId("favorite-button"));

    expect(screen.getByTestId("not-logged-in-modal")).toBeInTheDocument();
    expect(
      screen.getByText("Please log in to save favorites")
    ).toBeInTheDocument();
    expect(screen.getByTestId("modal-login-button")).toBeInTheDocument();
    expect(screen.getByTestId("modal-signup-button")).toBeInTheDocument();
  });

  it("dismisses the not-logged-in modal when Sign Up is clicked", async () => {
    const user = userEvent.setup();
    const { getOrCreateUserId } =
      jest.requireMock("../app/lib/userId") as {
        getOrCreateUserId: jest.Mock;
      };

    getOrCreateUserId.mockResolvedValueOnce(null);

    await renderHomePage();
    await user.click(screen.getByTestId("favorite-button"));
    await user.click(screen.getByTestId("modal-signup-button"));

    await waitFor(() => {
      expect(
        screen.queryByTestId("not-logged-in-modal")
      ).not.toBeInTheDocument();
    });
  });

  it("shows 'This home is already in your favorites' toast on 409", async () => {
    const user = userEvent.setup();
    global.fetch = buildFetchMock({ conflictOnPost: true }) as jest.Mock;

    await renderHomePage();
    await user.click(screen.getByTestId("favorite-button"));

    expect(await screen.findByTestId("toast-notification")).toHaveTextContent(
      "This home is already in your favorites"
    );
  });

  it("shows 'Unable to save favorite' toast when backend returns 503", async () => {
    const user = userEvent.setup();
    global.fetch = buildFetchMock({ errorOnPost: true }) as jest.Mock;

    await renderHomePage();
    await user.click(screen.getByTestId("favorite-button"));

    expect(await screen.findByTestId("toast-notification")).toHaveTextContent(
      "Unable to save favorite. Please try again."
    );
  });

  it("shows offline toast when network is offline", async () => {
    const user = userEvent.setup();

    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });

    await renderHomePage();
    await user.click(screen.getByTestId("favorite-button"));

    expect(await screen.findByTestId("toast-notification")).toHaveTextContent(
      "Saved locally. Will sync when connection restored."
    );
  });

  it("shows 'Added to Favorites' toast after favoriting", async () => {
    const user = userEvent.setup();
    await renderHomePage();

    await user.click(screen.getByTestId("favorite-button"));

    expect(await screen.findByTestId("toast-notification")).toHaveTextContent(
      "Added to Favorites"
    );
  });

  it("shows undo banner with countdown after favoriting", async () => {
    const user = userEvent.setup();
    await renderHomePage();

    await user.click(screen.getByTestId("favorite-button"));

    expect(await screen.findByTestId("undo-redo-banner")).toBeInTheDocument();
    expect(screen.getByTestId("undo-button")).toBeEnabled();
  });

  it("disables undo button when stack is empty but the window has not expired", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await renderHomePage();

    await user.click(screen.getByTestId("favorite-button"));
    await user.click(await screen.findByTestId("undo-button"));

    await waitFor(() => {
      expect(screen.getByTestId("undo-button")).toBeDisabled();
    });
  });

  it("shows full expiry message when window expires", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await renderHomePage();
    await user.click(screen.getByTestId("favorite-button"));

    await act(async () => {
      jest.advanceTimersByTime(11_000);
    });

    expect(await screen.findByTestId("toast-notification")).toHaveTextContent(
      "Undo window expired. Remove from Favorites page instead."
    );
  });

  it("hides undo button after the 10-second window expires", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await renderHomePage();
    await user.click(screen.getByTestId("favorite-button"));

    expect(await screen.findByTestId("undo-button")).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(11_000);
    });

    await waitFor(() => {
      expect(screen.queryByTestId("undo-button")).not.toBeInTheDocument();
    });
  });

  it("shows toast with address when undo is clicked", async () => {
    const user = userEvent.setup();
    await renderHomePage();

    await user.click(screen.getByTestId("favorite-button"));
    await user.click(await screen.findByTestId("undo-button"));

    expect(await screen.findByTestId("toast-notification")).toHaveTextContent(
      /Removed.*favorites/i
    );
  });

  it("shows redo button after an undo action", async () => {
    const user = userEvent.setup();
    await renderHomePage();

    await user.click(screen.getByTestId("favorite-button"));
    await user.click(await screen.findByTestId("undo-button"));

    expect(await screen.findByTestId("redo-button")).toBeInTheDocument();
  });

  it("calls POST again when redo is clicked", async () => {
    const user = userEvent.setup();
    const fetchMock = buildFetchMock();
    global.fetch = fetchMock as jest.Mock;

    await renderHomePage();

    await user.click(screen.getByTestId("favorite-button"));
    await user.click(await screen.findByTestId("undo-button"));
    await user.click(await screen.findByTestId("redo-button"));

    const postCalls = (fetchMock.mock.calls as [string, RequestInit][]).filter(
      ([url, init]) =>
        url.includes("/api/users/1/favorites") && init?.method === "POST"
    );

    expect(postCalls).toHaveLength(2);
  });

  it("shows 'Unable to undo' toast and keeps property in stack on 503", async () => {
    const user = userEvent.setup();
    global.fetch = buildFetchMock({ errorOnUndo: true }) as jest.Mock;

    await renderHomePage();

    await user.click(screen.getByTestId("favorite-button"));
    await user.click(screen.getByTestId("undo-button"));

    expect(await screen.findByTestId("toast-notification")).toHaveTextContent(
      "Unable to undo. Please try again."
    );
    expect(screen.getByTestId("undo-button")).toBeEnabled();
  });

  it("calls DELETE when unfavoriting a previously favorited listing", async () => {
    const user = userEvent.setup();
    const fetchMock = buildFetchMock();
    global.fetch = fetchMock as jest.Mock;

    await renderHomePage();

    await user.click(screen.getByTestId("favorite-button"));
    await user.click(screen.getByText("Previous"));
    await user.click(screen.getByTestId("favorite-button"));

    const deleteCalls = (fetchMock.mock.calls as [string, RequestInit][]).filter(
      ([url, init]) =>
        url.includes("/api/users/1/favorites/") && init?.method === "DELETE"
    );

    expect(deleteCalls).toHaveLength(1);
  });
});