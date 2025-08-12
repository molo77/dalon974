"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";

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
    surface?: string;
    nbChambres?: string;
    equipements?: string;
    description?: string;
  }) => void;
  annonce?: any | null;
}) {
  const [titre, setTitre] = useState("");
  const [ville, setVille] = useState("");
  const [prix, setPrix] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [surface, setSurface] = useState("");
  const [nbChambres, setNbChambres] = useState("");
  const [equipements, setEquipements] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (annonce) {
      setTitre(annonce.titre || "");
      setVille(annonce.ville || "");
      setPrix(annonce.prix?.toString() || "");
      setImageUrl(annonce.imageUrl || "");
      setSurface(annonce.surface?.toString() || "");
      setNbChambres(annonce.nbChambres?.toString() || "");
      // Correction : évite .join si ce n'est pas un tableau
      if (Array.isArray(annonce.equipements)) {
        setEquipements(annonce.equipements.join(", "));
      } else {
        setEquipements(annonce.equipements || "");
      }
      setDescription(annonce.description || "");
    } else {
      setTitre("");
      setVille("");
      setPrix("");
      setImageUrl("");
      setSurface("");
      setNbChambres("");
      setEquipements("");
      setDescription("");
    }
  }, [annonce]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      titre,
      ville,
      prix,
      imageUrl,
      surface,
      nbChambres,
      equipements,
      description,
    });
    onClose();
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="scale-95 opacity-0"
            enterTo="scale-100 opacity-100"
            leave="ease-in duration-200"
            leaveFrom="scale-100 opacity-100"
            leaveTo="scale-95 opacity-0"
          >
            <Dialog.Panel className="bg-white rounded-lg max-w-2xl w-full p-6 shadow-lg">
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

                <input
                  type="number"
                  name="surface"
                  placeholder="Surface (m²)"
                  value={surface}
                  onChange={(e) => setSurface(e.target.value)}
                  className="w-full p-2 border rounded"
                />

                <input
                  type="number"
                  name="nbChambres"
                  placeholder="Nombre de chambres"
                  value={nbChambres}
                  onChange={(e) => setNbChambres(e.target.value)}
                  className="w-full p-2 border rounded"
                />

                <input
                  type="text"
                  name="equipements"
                  placeholder="Équipements (séparés par des virgules)"
                  value={equipements}
                  onChange={(e) => setEquipements(e.target.value)}
                  className="w-full p-2 border rounded"
                />

                <textarea
                  name="description"
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border rounded"
                  style={{ minHeight: "9em" }} // Hauteur triplée (~3x la hauteur standard)
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
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
