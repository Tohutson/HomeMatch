import { useRef, useCallback, useEffect } from "react";

interface UseSwipeOptions {
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  threshold?: number;
}

export interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
}

export function useSwipe({
  onSwipeRight,
  onSwipeLeft,
  threshold = 80,
}: UseSwipeOptions): SwipeHandlers {
  const startX = useRef<number | null>(null);

  const handleEnd = useCallback(
    (x: number) => {
      if (startX.current === null) return;
      const delta = x - startX.current;
      startX.current = null;
      if (delta > threshold) onSwipeRight?.();
      else if (delta < -threshold) onSwipeLeft?.();
    },
    [onSwipeRight, onSwipeLeft, threshold]
  );

  // Attach mouseup to document so swipe works even when
  // the mouse is released outside the card
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => handleEnd(e.clientX);
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [handleEnd]);

  return {
    onTouchStart: (e) => { startX.current = e.touches[0].clientX; },
    onTouchEnd:   (e) => handleEnd(e.changedTouches[0].clientX),
    onMouseDown:  (e) => { startX.current = e.clientX; },
  };
}