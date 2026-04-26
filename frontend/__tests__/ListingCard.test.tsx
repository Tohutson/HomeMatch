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

  it("calls onToggleCompare with the listing when compare is clicked", async () => {
    const user = userEvent.setup();
    const onToggleCompare = jest.fn();

    render(
      <ListingCard listing={listing} onToggleCompare={onToggleCompare} />
    );

    await user.click(screen.getByTestId("compare-button"));

    expect(onToggleCompare).toHaveBeenCalledWith(listing);
  });

  it("disables adding to comparison when the max is reached", () => {
    render(<ListingCard listing={listing} disableCompare />);

    expect(screen.getByTestId("compare-button")).toBeDisabled();
  });

  it("allows a selected listing to be removed even when comparison is full", async () => {
    const user = userEvent.setup();
    const onToggleCompare = jest.fn();

    render(
      <ListingCard
        listing={listing}
        isCompared
        onToggleCompare={onToggleCompare}
        disableCompare={false}
      />
    );

    const compareButton = screen.getByTestId("compare-button");

    expect(compareButton).not.toBeDisabled();
    expect(compareButton).toHaveTextContent(/remove compare/i);

    await user.click(compareButton);

    expect(onToggleCompare).toHaveBeenCalledWith(listing);
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
    jest.useFakeTimers();
    const onSwipeRight = jest.fn();

    render(<ListingCard listing={listing} onSwipeRight={onSwipeRight} />);
    const card = screen.getByTestId("listing-card");

    fireEvent.touchStart(card, { touches: [{ clientX: 0 }] });
    fireEvent.touchEnd(card, { changedTouches: [{ clientX: 120 }] });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(onSwipeRight).toHaveBeenCalledTimes(1);
  });

  it("fires onSwipeLeft after a leftward touch swipe past the threshold", () => {
    jest.useFakeTimers();
    const onSwipeLeft = jest.fn();

    render(<ListingCard listing={listing} onSwipeLeft={onSwipeLeft} />);
    const card = screen.getByTestId("listing-card");

    fireEvent.touchStart(card, { touches: [{ clientX: 200 }] });
    fireEvent.touchEnd(card, { changedTouches: [{ clientX: 60 }] });
    act(() => {
      jest.advanceTimersByTime(300);
    });

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
    jest.useFakeTimers();
    const onSwipeRight = jest.fn();

    render(<ListingCard listing={listing} onSwipeRight={onSwipeRight} />);
    const card = screen.getByTestId("listing-card");

    fireEvent.mouseDown(card, { clientX: 0 });
    fireEvent.mouseUp(card, { clientX: 120 });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(onSwipeRight).toHaveBeenCalledTimes(1);
  });

  it("restores the card when a swipe action reports failure", async () => {
    jest.useFakeTimers();

    render(
      <ListingCard
        listing={listing}
        onSwipeRight={jest.fn().mockResolvedValue(false)}
      />
    );

    const card = screen.getByTestId("listing-card");

    fireEvent.touchStart(card, { touches: [{ clientX: 0 }] });
    fireEvent.touchEnd(card, { changedTouches: [{ clientX: 140 }] });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await act(async () => {});

    expect(card).toHaveStyle("transform: translateX(0px) rotate(0deg) scale(1)");
  });

  it("renders a non-interactive preview card without action controls", () => {
    render(<ListingCard listing={listing} interactive={false} />);

    expect(screen.getByTestId("listing-card-preview")).toBeInTheDocument();
    expect(screen.queryByTestId("favorite-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("view-details-link")).not.toBeInTheDocument();
  });

  it("moves the card and shows the heart indicator while swiping right", () => {
    render(<ListingCard listing={listing} onSwipeRight={jest.fn()} />);
    const card = screen.getByTestId("listing-card");

    fireEvent.touchStart(card, { touches: [{ clientX: 0 }] });
    fireEvent.touchMove(card, { touches: [{ clientX: 70 }] });

    expect(card).toHaveStyle("transform: translateX(70px) rotate(3.888888888888889deg) scale(1.02)");
    expect(screen.getByTestId("swipe-right-indicator")).toHaveClass("opacity-100");
  });

  it("moves the card and shows the trash indicator while swiping left", () => {
    render(<ListingCard listing={listing} onSwipeLeft={jest.fn()} />);
    const card = screen.getByTestId("listing-card");

    fireEvent.touchStart(card, { touches: [{ clientX: 160 }] });
    fireEvent.touchMove(card, { touches: [{ clientX: 80 }] });

    expect(card).toHaveStyle("transform: translateX(-80px) rotate(-4.444444444444445deg) scale(1.02)");
    expect(screen.getByTestId("swipe-left-indicator")).toHaveClass("opacity-100");
  });
});
