export type ToastType = "success" | "error" | "info";

export type ToastPayload = {
  id: string;
  type: ToastType;
  message: string;
};

const EVENT_NAME = "app:toast";

/**
 * Émet un toast global. À utiliser côté client uniquement.
 */
export function showToast(type: ToastType, message: string): string | null {
  if (typeof window === "undefined") return null;
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  const payload: ToastPayload = { id, type, message };
  window.dispatchEvent(new CustomEvent<ToastPayload>(EVENT_NAME, { detail: payload }));
  return id;
}

/**
 * S’abonne aux toasts globaux. Retourne une fonction d’unsubscribe.
 */
export function onToast(listener: (toast: ToastPayload) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => {
    const ce = e as CustomEvent<ToastPayload>;
    if (ce?.detail) listener(ce.detail);
  };
  window.addEventListener(EVENT_NAME, handler as EventListener);
  return () => window.removeEventListener(EVENT_NAME, handler as EventListener);
}
