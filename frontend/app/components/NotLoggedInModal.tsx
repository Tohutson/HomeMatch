"use client";

type Props = {
  onDismiss: () => void;
  onLogIn: () => void;
};

export default function NotLoggedInModal({ onDismiss, onLogIn }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center
                 bg-black/50 p-4"
      data-testid="not-logged-in-modal"
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-2 text-lg font-bold text-zinc-900">
          Please log in to save favorites
        </h2>
        <p className="mb-6 text-sm text-zinc-500">
          Create a free account or log in to start saving homes you love.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onLogIn}
            className="flex-1 rounded-lg bg-rose-500 px-4 py-2
                       font-medium text-white hover:bg-rose-600"
            data-testid="modal-login-button"
          >
            Log In
          </button>
          <button
            onClick={onDismiss}
            className="flex-1 rounded-lg border border-zinc-300 px-4 py-2
                       font-medium text-zinc-700 hover:bg-zinc-50"
            data-testid="modal-signup-button"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}