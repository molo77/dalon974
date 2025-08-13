"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";

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
  const [user] = useAuthState(auth);
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
    // Vérification simple pour éviter l'envoi de mots de passe dans le message
    if (/password|mot de passe|mdp/i.test(message)) {
      setError("Le message ne doit pas contenir de mot de passe ou d'informations sensibles.");
      return;
    }
    setSending(true);
    try {
      await addDoc(collection(db, "messages"), {
        annonceId,
        annonceOwnerId,
        fromUserId: user.uid,
        fromEmail: user.email,
        content: message,
        createdAt: serverTimestamp(),
        read: false,
      });
      setMessage("");
      if (onSent) onSent();
      onClose();
    } catch (err: any) {
      setError(
        err?.message
          ? `Erreur lors de l'envoi du message : ${err.message}`
          : "Erreur lors de l'envoi du message."
      );
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <form
        onSubmit={handleSend}
        className="bg-white rounded shadow p-6 w-full max-w-md flex flex-col gap-4"
      >
        <h2 className="text-xl font-bold mb-2 text-center">Envoyer un message</h2>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="border rounded px-3 py-2 min-h-[100px]"
          placeholder="Votre message..."
          required
        />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex-1"
            disabled={sending}
          >
            Envoyer
          </button>
          <button
            type="button"
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded flex-1"
            onClick={onClose}
            disabled={sending}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
