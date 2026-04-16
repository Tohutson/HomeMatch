import { useRef, useCallback, useEffect } from "react";

interface UseSwipeOptions {
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  onSwipeMove?: (delta: number) => void;
  onSwipeStart?: () => void;
  onSwipeCancel?: () => void;
  threshold?: number;
}

export interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
}

export function useSwipe({
  onSwipeRight,
  onSwipeLeft,
  onSwipeMove,
  onSwipeStart,
  onSwipeCancel,
  threshold = 80,
}: UseSwipeOptions): SwipeHandlers {
  const startX = useRef<number | null>(null);
  const dragging = useRef(false);
  const lastDelta = useRef(0);

  const isInteractiveTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest("button, a, input, textarea, select, label"));
  };

  const beginSwipe = useCallback(
    (x: number, target: EventTarget | null) => {
      if (isInteractiveTarget(target)) return;
      startX.current = x;
      dragging.current = true;
      lastDelta.current = 0;
      onSwipeStart?.();
    },
    [onSwipeStart]
  );

  const updateSwipe = useCallback(
    (x: number) => {
      if (!dragging.current || startX.current === null) return;
      lastDelta.current = x - startX.current;
      onSwipeMove?.(lastDelta.current);
    },
    [onSwipeMove]
  );

  const handleEnd = useCallback(
    (x?: number) => {
      if (!dragging.current || startX.current === null) return;
      const delta = typeof x === "number" ? x - startX.current : lastDelta.current;
      dragging.current = false;
      startX.current = null;
      lastDelta.current = 0;
      if (delta > threshold) onSwipeRight?.();
      else if (delta < -threshold) onSwipeLeft?.();
      else onSwipeCancel?.();
    },
    [onSwipeCancel, onSwipeLeft, onSwipeRight, threshold]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => updateSwipe(e.clientX);
    const handleMouseUp = (e: MouseEvent) => handleEnd(e.clientX);
    const handleTouchMove = (e: TouchEvent) => updateSwipe(e.touches[0]?.clientX ?? 0);
    const handleTouchEnd = (e: TouchEvent) =>
      handleEnd(e.changedTouches[0]?.clientX ?? undefined);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleEnd, updateSwipe]);

  return {
    onTouchStart: (e) => beginSwipe(e.touches[0].clientX, e.target),
    onTouchMove: (e) => updateSwipe(e.touches[0].clientX),
    onTouchEnd: (e) => handleEnd(e.changedTouches[0].clientX),
    onMouseDown: (e) => beginSwipe(e.clientX, e.target),
    onMouseMove: (e) => updateSwipe(e.clientX),
  };
}
