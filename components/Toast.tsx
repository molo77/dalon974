"use client";

import { useEffect, useRef } from "react";

export type ToastType = "success" | "error" | "info";

export type ToastMessage = {
  id: string;
  type?: ToastType;
  message: string;
};

export default function Toast({
  toasts,
  onRemove,
}: {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}) {
  const timers = useRef<{ [id: string]: NodeJS.Timeout }>({});

  useEffect(() => {
    // Pour chaque toast, si pas déjà timer, on en crée un
    toasts.forEach((toast) => {
      if (!timers.current[toast.id]) {
        timers.current[toast.id] = setTimeout(() => {
          onRemove(toast.id);
          delete timers.current[toast.id];
        }, 3000);
      }
    });
    // Nettoyage des timers pour les toasts supprimés
    Object.keys(timers.current).forEach((id) => {
      if (!toasts.find((t) => t.id === id)) {
        clearTimeout(timers.current[id]);
        delete timers.current[id];
      }
    });
    // Nettoyage global à l'unmount
    return () => {
      Object.values(timers.current).forEach(clearTimeout);
      timers.current = {};
    };
  }, [toasts, onRemove]);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3">
      {toasts.map((toast) => {
        const base =
          toast.type === "success"
            ? "bg-emerald-600"
            : toast.type === "error"
            ? "bg-rose-600"
            : "bg-blue-600";
        const icon =
          toast.type === "success"
            ? "✅"
            : toast.type === "error"
            ? "⚠️"
            : "ℹ️";
        return (
          <div
            key={toast.id}
            role="alert"
            className={`flex items-start gap-3 px-5 py-3 rounded-xl shadow-lg text-white ${base}`}
          >
            <span className="text-lg leading-none">{icon}</span>
            <div className="flex-1 text-sm">{toast.message}</div>
            <button
              aria-label="Fermer"
              className="opacity-80 hover:opacity-100 transition"
              onClick={() => onRemove(toast.id)}
            >
              ✖
            </button>
          </div>
        );
      })}
    </div>
  );
}
