"use client";

import { useEffect, useState } from "react";

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
  const [visibleToasts, setVisibleToasts] = useState(toasts);

  useEffect(() => {
    setVisibleToasts(toasts);
  }, [toasts]);

  useEffect(() => {
    const timers = visibleToasts.map((toast) =>
      setTimeout(() => onRemove(toast.id), 3000)
    );
    return () => timers.forEach(clearTimeout);
  }, [visibleToasts, onRemove]);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3">
      {visibleToasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-6 py-3 rounded-lg shadow-lg text-white animate-fade transition-all ${
            toast.type === "success"
              ? "bg-green-600"
              : toast.type === "error"
              ? "bg-red-600"
              : "bg-blue-600"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
