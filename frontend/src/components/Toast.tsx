"use client";

import { useEffect } from "react";

type ToastProps = {
  message: string;
  onDismiss: () => void;
  duration?: number;
};

export default function Toast({
  message,
  onDismiss,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [onDismiss, duration]);

  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 rounded-lg bg-zinc-900
                 px-5 py-3 text-sm font-medium text-white shadow-lg
                 animate-fade-in-up"
      data-testid="toast-notification"
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}