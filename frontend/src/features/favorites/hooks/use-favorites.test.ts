import { act, renderHook, waitFor } from "@testing-library/react";
import {
  addFavorite,
  getFavorites,
  removeFavorite,
} from "@/features/favorites/api";
import { useFavorites } from "./use-favorites";

jest.mock("@/features/favorites/api", () => ({
  addFavorite: jest.fn(),
  getFavorites: jest.fn(),
  removeFavorite: jest.fn(),
}));

const mockedAddFavorite = jest.mocked(addFavorite);
const mockedGetFavorites = jest.mocked(getFavorites);
const mockedRemoveFavorite = jest.mocked(removeFavorite);

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

describe("useFavorites", () => {
  beforeEach(() => {
    mockedAddFavorite.mockReset();
    mockedGetFavorites.mockReset();
    mockedRemoveFavorite.mockReset();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("ignores stale fetch results after a newer refetch starts", async () => {
    const firstFetch = createDeferred<Array<typeof favorite>>();
    const secondFetch = createDeferred<Array<typeof favorite>>();

    mockedGetFavorites
      .mockImplementationOnce(() => firstFetch.promise)
      .mockImplementationOnce(() => secondFetch.promise);

    const { result } = renderHook(() => useFavorites({ enabled: true }));

    act(() => {
      void result.current.refetchFavorites();
    });

    await act(async () => {
      secondFetch.resolve([
        {
          ...favorite,
          id: 2,
          listing: {
            ...favorite.listing,
            id: 84,
            address: "456 Oak Ave",
          },
        },
      ]);
      await secondFetch.promise;
    });

    await waitFor(() => {
      expect(result.current.favorites[0]?.listing.id).toBe(84);
    });

    await act(async () => {
      firstFetch.resolve([favorite]);
      await firstFetch.promise;
    });

    expect(result.current.favorites[0]?.listing.id).toBe(84);
  });

  it("keeps the current favorites visible during a failed background refetch", async () => {
    mockedGetFavorites
      .mockResolvedValueOnce([favorite])
      .mockRejectedValueOnce(new Error("network down"));

    const { result } = renderHook(() => useFavorites({ enabled: true }));

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
