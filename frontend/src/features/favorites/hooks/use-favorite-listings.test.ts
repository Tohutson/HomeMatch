import { act, renderHook, waitFor } from "@testing-library/react";
import { getFavorites } from "@/features/favorites/api";
import { useFavoriteListings } from "./use-favorite-listings";

jest.mock("@/features/favorites/api", () => ({
  getFavorites: jest.fn(),
}));

const mockedGetFavorites = jest.mocked(getFavorites);

const favorite = {
  id: 1,
  createdAt: "2026-04-16T12:00:00.000Z",
  listing: {
    id: 42,
    address: "123 Main St",
    price: 425000,
    beds: 3,
    baths: 2,
    sqft: 1800,
    photoUrls: [],
  },
};

function createDeferred<T>() {
  let resolve!: (value: T) => void;

  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
}

describe("useFavoriteListings", () => {
  beforeEach(() => {
    mockedGetFavorites.mockReset();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("keeps existing favorites visible during a background refetch", async () => {
    const initialFetch = createDeferred<Array<typeof favorite>>();
    const backgroundFetch = createDeferred<Array<typeof favorite>>();

    mockedGetFavorites
      .mockImplementationOnce(() => initialFetch.promise)
      .mockImplementationOnce(() => backgroundFetch.promise);

    const { result } = renderHook(() => useFavoriteListings({ userId: 7 }));

    expect(result.current.loading).toBe(true);

    await act(async () => {
      initialFetch.resolve([favorite]);
      await initialFetch.promise;
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.favorites).toEqual([favorite]);

    act(() => {
      void result.current.refetchFavorites({ background: true });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.favorites).toEqual([favorite]);

    await act(async () => {
      backgroundFetch.resolve([favorite]);
      await backgroundFetch.promise;
    });

    await waitFor(() => {
      expect(result.current.favorites).toEqual([favorite]);
    });
  });

  it("preserves existing favorites when a background refetch fails", async () => {
    mockedGetFavorites
      .mockResolvedValueOnce([favorite])
      .mockRejectedValueOnce(new Error("network down"));

    const { result } = renderHook(() => useFavoriteListings({ userId: 7 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.favorites).toEqual([favorite]);
    expect(result.current.error).toBeNull();

    await act(async () => {
      await result.current.refetchFavorites({ background: true });
    });

    expect(result.current.favorites).toEqual([favorite]);
    expect(result.current.error).toBeNull();
  });
});
