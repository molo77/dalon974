"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";

export default function MessageModal({
  annonceId,
  annonceOwnerId,
  isOpen,
  onClose,
  onSent,
}: {
  annonceId: string;
  annonceOwnerId: string;
  isOpen: boolean;
  onClose: () => void;
  onSent?: () => void;
}) {
  const { data } = useSession();
  const user = data?.user as any;
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user) {
      setError("Vous devez être connecté pour envoyer un message.");
      return;
    }
    if (!message.trim()) {
      setError("Le message ne peut pas être vide.");
      return;
    }
    if (/password|mot de passe|mdp/i.test(message)) {
      setError("Le message ne doit pas contenir de mot de passe ou d'informations sensibles.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ annonceId, annonceOwnerId, content: message }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Erreur API");
      }
      setMessage("");
      onSent?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'envoi du message.");
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <form onSubmit={handleSend} className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Envoyer un message</h2>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="border rounded px-3 py-2 min-h-[100px]"
          placeholder="Votre message..."
          required
        />
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="flex gap-2">
          <button type="submit" disabled={sending} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex-1">
            Envoyer
          </button>
          <button type="button" onClick={onClose} disabled={sending} className="bg-gray-200 text-gray-800 px-4 py-2 rounded flex-1">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
