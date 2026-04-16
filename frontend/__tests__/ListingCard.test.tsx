import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ListingCard from "@/features/listings/components/listing-card";

const listing = {
  id: 1,
  address: "30 Pitt St",
  price: 250000,
  beds: 3,
  baths: 1.5,
  sqft: 2250,
  photoUrls: [] as string[],
};

describe("ListingCard", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders listing address and price", () => {
    render(<ListingCard listing={listing} />);
    expect(screen.getByText("30 Pitt St")).toBeInTheDocument();
    expect(screen.getByText(/\$250,000/)).toBeInTheDocument();
  });

  it("renders bed, bath and sqft details", () => {
    render(<ListingCard listing={listing} />);
    expect(screen.getByText("Beds")).toBeInTheDocument();
    expect(screen.getByText("Baths")).toBeInTheDocument();
    expect(screen.getByText("Sq Ft")).toBeInTheDocument();
  });

  it("shows placeholder when no photo is available", () => {
    render(<ListingCard listing={listing} />);
    expect(screen.getByText("No Image Available")).toBeInTheDocument();
  });

  it("renders View Details link pointing to /listings/{id}", () => {
    render(<ListingCard listing={listing} />);
    expect(screen.getByTestId("view-details-link")).toHaveAttribute(
      "href",
      "/listings/1"
    );
  });

  it("shows 'Add to favorites' aria-label when not favorited", () => {
    render(<ListingCard listing={listing} isFavorited={false} />);
    expect(screen.getByTestId("favorite-button")).toHaveAttribute(
      "aria-label",
      "Add to favorites"
    );
  });

  it("shows 'Remove from favorites' aria-label when favorited", () => {
    render(<ListingCard listing={listing} isFavorited />);
    expect(screen.getByTestId("favorite-button")).toHaveAttribute(
      "aria-label",
      "Remove from favorites"
    );
  });

  it("calls onFavorite with the listing when the heart button is clicked", async () => {
    const user = userEvent.setup();
    const onFavorite = jest.fn();

    render(<ListingCard listing={listing} onFavorite={onFavorite} />);
    await user.click(screen.getByTestId("favorite-button"));

    expect(onFavorite).toHaveBeenCalledTimes(1);
    expect(onFavorite).toHaveBeenCalledWith(listing);
  });

  it("applies animate-heart-bounce when transitioning from unfavorited to favorited", () => {
    const { rerender } = render(
      <ListingCard listing={listing} isFavorited={false} />
    );

    expect(screen.getByTestId("heart-icon")).not.toHaveClass(
      "animate-heart-bounce"
    );

    rerender(<ListingCard listing={listing} isFavorited />);

    expect(screen.getByTestId("heart-icon")).toHaveClass(
      "animate-heart-bounce"
    );
  });

  it("does not apply heart-bounce when card initially renders already favorited", () => {
    render(<ListingCard listing={listing} isFavorited />);
    expect(screen.getByTestId("heart-icon")).not.toHaveClass(
      "animate-heart-bounce"
    );
  });

  it("removes animate-heart-bounce class after animation completes", () => {
    jest.useFakeTimers();

    const { rerender } = render(
      <ListingCard listing={listing} isFavorited={false} />
    );

    rerender(<ListingCard listing={listing} isFavorited />);

    expect(screen.getByTestId("heart-icon")).toHaveClass(
      "animate-heart-bounce"
    );

    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(screen.getByTestId("heart-icon")).not.toHaveClass(
      "animate-heart-bounce"
    );
  });

  it("shows sync indicator when isSyncing is true", () => {
    render(<ListingCard listing={listing} isFavorited isSyncing />);
    expect(screen.getByTestId("sync-indicator")).toBeInTheDocument();
  });

  it("does not show sync indicator when isSyncing is false", () => {
    render(<ListingCard listing={listing} isFavorited isSyncing={false} />);
    expect(screen.queryByTestId("sync-indicator")).not.toBeInTheDocument();
  });

  it("fires onSwipeRight after a rightward touch swipe past the threshold", () => {
    const onSwipeRight = jest.fn();

    render(<ListingCard listing={listing} onSwipeRight={onSwipeRight} />);
    const card = screen.getByTestId("listing-card");

    fireEvent.touchStart(card, { touches: [{ clientX: 0 }] });
    fireEvent.touchEnd(card, { changedTouches: [{ clientX: 120 }] });

    expect(onSwipeRight).toHaveBeenCalledTimes(1);
  });

  it("fires onSwipeLeft after a leftward touch swipe past the threshold", () => {
    const onSwipeLeft = jest.fn();

    render(<ListingCard listing={listing} onSwipeLeft={onSwipeLeft} />);
    const card = screen.getByTestId("listing-card");

    fireEvent.touchStart(card, { touches: [{ clientX: 200 }] });
    fireEvent.touchEnd(card, { changedTouches: [{ clientX: 60 }] });

    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
  });

  it("does not fire swipe callbacks when movement is below the threshold", () => {
    const onSwipeRight = jest.fn();
    const onSwipeLeft = jest.fn();

    render(
      <ListingCard
        listing={listing}
        onSwipeRight={onSwipeRight}
        onSwipeLeft={onSwipeLeft}
      />
    );

    const card = screen.getByTestId("listing-card");

    fireEvent.touchStart(card, { touches: [{ clientX: 0 }] });
    fireEvent.touchEnd(card, { changedTouches: [{ clientX: 40 }] });

    expect(onSwipeRight).not.toHaveBeenCalled();
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it("fires onSwipeRight on a mouse drag past the threshold", () => {
    const onSwipeRight = jest.fn();

    render(<ListingCard listing={listing} onSwipeRight={onSwipeRight} />);
    const card = screen.getByTestId("listing-card");

    fireEvent.mouseDown(card, { clientX: 0 });
    fireEvent.mouseUp(card, { clientX: 120 });

    expect(onSwipeRight).toHaveBeenCalledTimes(1);
  });
});
