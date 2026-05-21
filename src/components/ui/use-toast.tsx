"use client";

import * as React from "react";

type Toast = {
  id: string;
  title?: string;
  description?: string;
};

type ToastContextValue = {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

function generateId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = generateId();
      setToasts((current) => [...current, { id, ...toast }]);
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== id));
      }, 4000);
    },
    [],
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const value = React.useMemo<ToastContextValue>(
    () => ({
      toasts,
      addToast,
      removeToast,
    }),
    [toasts, addToast, removeToast],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = React.useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  const { addToast } = context;

  return {
    toast: addToast,
  };
}

export function Toaster() {
  const context = React.useContext(ToastContext);

  if (!context) return null;

  const { toasts, removeToast } = context;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className="flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto overflow-hidden rounded-2xl border border-white/15 bg-slate-900/90 px-4 py-3 text-sm text-slate-50 shadow-xl backdrop-blur-2xl"
            onAnimationEnd={() => {
              // Auto-remove after CSS animation completes.
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                {toast.title && (
                  <p className="text-sm font-semibold tracking-tight">{toast.title}</p>
                )}
                {toast.description && (
                  <p className="text-sm text-slate-300">{toast.description}</p>
                )}
              </div>
              <button
                type="button"
                className="text-sm text-slate-400 hover:text-slate-200"
                onClick={() => removeToast(toast.id)}
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
