import { act, renderHook } from "@testing-library/react";
import { useFavoriteUndo } from "./use-favorite-undo";

const listing = {
  id: 1,
  address: "123 Main St",
  price: 250000,
  beds: 3,
  baths: 2,
  sqft: 1800,
  photoUrls: [],
};

describe("useFavoriteUndo", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("clears the redo banner after the redo window expires", async () => {
    const addFavorite = jest.fn().mockResolvedValue({ ok: true });
    const removeFavorite = jest.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() =>
      useFavoriteUndo({
        addFavorite,
        removeFavorite,
        undoWindowSeconds: 2,
      })
    );

    act(() => {
      result.current.recordAddedFavorite(listing);
    });

    await act(async () => {
      await result.current.handleUndo();
    });

    expect(result.current.canRedo).toBe(true);
    expect(result.current.showBanner).toBe(true);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.canRedo).toBe(false);
    expect(result.current.showBanner).toBe(false);
  });
});
