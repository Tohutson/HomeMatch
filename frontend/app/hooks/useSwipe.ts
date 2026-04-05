import { useRef, useCallback } from "react";

interface UseSwipeOptions {
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  threshold?: number;
}

export interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
}

export function useSwipe({
  onSwipeRight,
  onSwipeLeft,
  threshold = 80,
}: UseSwipeOptions): SwipeHandlers {
  const startX = useRef<number | null>(null);

  const handleStart = useCallback((x: number) => {
    startX.current = x;
  }, []);

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

  return {
    onTouchStart: (e) => handleStart(e.touches[0].clientX),
    onTouchEnd:   (e) => handleEnd(e.changedTouches[0].clientX),
    onMouseDown:  (e) => handleStart(e.clientX),
    onMouseUp:    (e) => handleEnd(e.clientX),
  };
}