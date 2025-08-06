"use client";

import { Dialog } from "@headlessui/react";
import { useState, useEffect } from "react";

export default function AnnonceModal({
  isOpen,
  onClose,
  onSubmit,
  annonce,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: {
    titre: string;
    ville: string;
    prix: string;
    imageUrl: string;
  }) => void;
  annonce?: any | null;
}) {
  const [titre, setTitre] = useState("");
  const [ville, setVille] = useState("");
  const [prix, setPrix] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (annonce) {
      setTitre(annonce.titre || "");
      setVille(annonce.ville || "");
      setPrix(annonce.prix?.toString() || "");
      setImageUrl(annonce.imageUrl || "");
    } else {
      setTitre("");
      setVille("");
      setPrix("");
      setImageUrl("");
    }
  }, [annonce]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ titre, ville, prix, imageUrl });
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-lg max-w-md w-full p-6 shadow-lg">
          <Dialog.Title className="text-xl font-bold mb-4">
            {annonce ? "✏️ Modifier l’annonce" : "➕ Nouvelle annonce"}
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Titre"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />

            <input
              type="text"
              placeholder="Ville"
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />

            <input
              type="number"
              placeholder="Prix (€)"
              value={prix}
              onChange={(e) => setPrix(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />

            <input
              type="text"
              placeholder="URL de l’image"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full p-2 border rounded"
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="text-gray-600 hover:underline"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Publier
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
