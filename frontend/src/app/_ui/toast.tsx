"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  title?: string;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  showToast: (t: Omit<ToastItem, "id"> & { durationMs?: number }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function ToastIcon({ variant }: { variant: ToastVariant }) {
  const base = "size-4";
  if (variant === "success") {
    return (
      <svg viewBox="0 0 24 24" className={base} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }
  if (variant === "error") {
    return (
      <svg viewBox="0 0 24 24" className={base} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 6 6 18" />
        <path d="M6 6l12 12" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={base} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
      <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const showToast = useCallback(
    (t: Omit<ToastItem, "id"> & { durationMs?: number }) => {
      const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const durationMs = t.durationMs ?? 2600;

      const item: ToastItem = {
        id,
        title: t.title,
        message: t.message,
        variant: t.variant,
      };

      setItems((prev) => [item, ...prev].slice(0, 3));

      window.setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== id));
      }, durationMs);
    },
    [],
  );

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[340px] max-w-[calc(100vw-2rem)] flex-col gap-2">
        {items.map((t) => {
          const border =
            t.variant === "success"
              ? "border-emerald-500/30"
              : t.variant === "error"
                ? "border-red-500/30"
                : "border-sky-500/30";

          const bg =
            t.variant === "success"
              ? "bg-emerald-500/10"
              : t.variant === "error"
                ? "bg-red-500/10"
                : "bg-sky-500/10";

          const text =
            t.variant === "success"
              ? "text-emerald-100"
              : t.variant === "error"
                ? "text-red-100"
                : "text-sky-100";

          return (
            <div
              key={t.id}
              className={`fade-in-up pointer-events-auto rounded-xl border ${border} ${bg} px-3 py-3 shadow-lg backdrop-blur`}
            >
              <div className="flex items-start gap-2">
                <div className={`mt-0.5 ${text}`}>
                  <ToastIcon variant={t.variant} />
                </div>
                <div className="min-w-0">
                  {t.title ? (
                    <div className="text-sm font-semibold text-white">{t.title}</div>
                  ) : null}
                  <div className="mt-0.5 text-sm text-white/85">{t.message}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
