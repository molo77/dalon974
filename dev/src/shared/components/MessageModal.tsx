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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="relative w-full max-w-md">
        {/* Effet de brillance animé */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-xl animate-pulse"></div>
        
        <form onSubmit={handleSend} className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Header avec gradient */}
          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-6 text-white">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-purple-600/90"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold">Envoyer un message</h2>
                  <p className="text-blue-100 text-sm">Contactez le propriétaire</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={sending}
                className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-200 disabled:opacity-50"
                aria-label="Fermer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Contenu du formulaire */}
          <div className="p-6 space-y-6">
            {/* Zone de texte avec style moderne */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Votre message
              </label>
              <div className="relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-200 resize-none min-h-[120px] placeholder-gray-400"
                  placeholder="Bonjour, je suis intéressé(e) par votre annonce..."
                  required
                  disabled={sending}
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {message.length}/500
                </div>
              </div>
            </div>

            {/* Message d'erreur avec style moderne */}
            {error && (
              <div className="relative bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Boutons avec design moderne */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="group flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg"
              >
                {sending ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Envoi...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>Envoyer</span>
                  </div>
                )}
              </button>
              
              <button
                type="button"
                onClick={onClose}
                disabled={sending}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-semibold hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
            </div>
          </div>

          {/* Footer avec conseils */}
          <div className="px-6 pb-4">
            <div className="bg-blue-50 rounded-2xl p-3">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-blue-700">
                  <strong>Conseil :</strong> Présentez-vous brièvement et mentionnez votre intérêt pour la colocation.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
