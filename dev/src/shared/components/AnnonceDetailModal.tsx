"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { toast as appToast } from "./feedback/Toast";

const MessageModal = dynamic(() => import("./MessageModal"), { ssr: false });

interface AnnonceDetailModalProps {
  open: boolean;
  onClose: () => void;
  annonce: any;
  isAdmin?: boolean;
  onEdit?: (annonce: any) => void;
  onDelete?: (id: string) => void;
}

export default function AnnonceDetailModal({ open, onClose, annonce, isAdmin, onEdit, onDelete }: AnnonceDetailModalProps) {
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const { data: session } = useSession();
  const currentUser = session?.user as any;

  // Debug: vérifier les données de l'annonce
  console.log("[AnnonceDetailModal] Annonce reçue:", { 
    id: annonce?.id, 
    userId: annonce?.userId, 
    currentUserId: currentUser?.id,
    session: !!session,
    annonceComplete: !!annonce
  });

  // Vérifier que l'annonce a les données nécessaires
  if (!open || !annonce || !annonce.id) {
    console.log("[AnnonceDetailModal] Modal fermé ou annonce incomplète:", { open, annonce: !!annonce, annonceId: annonce?.id });
    return null;
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-600 hover:text-slate-900"
          aria-label="Fermer"
        >
          ✖
        </button>
  <h3 className="text-xl font-semibold mb-4">Détail de l’annonce</h3>
        <div className="flex flex-col gap-4">
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-44 h-44 rounded-lg overflow-hidden bg-gray-100 relative">
              {annonce.imageUrl && annonce.imageUrl.trim() !== "" ? (
                <Image src={annonce.imageUrl} alt={annonce.titre} fill className="object-cover" sizes="176px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                  📷 Aucune image
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold">{annonce.titre}</div>
              <div className="text-slate-700">{annonce.ville} {annonce.surface && <span>• {annonce.surface} m²</span>} {annonce.prix && <span className="ml-2 text-blue-700 font-semibold">• {annonce.prix} €</span>}</div>
              <div className="text-slate-600 text-sm mt-1">{annonce.createdAt ? new Date(annonce.createdAt).toLocaleDateString() : null}</div>
            </div>
          </div>
          {annonce.description && (
            <div>
              <div className="text-sm font-medium text-slate-700 mb-1">Description</div>
              <p className="text-slate-800 whitespace-pre-line">{annonce.description}</p>
            </div>
          )}
          {/* Attributs détaillés */}
          {(annonce.typeBien || annonce.meuble != null || annonce.nbPieces || annonce.nbSdb || annonce.natureBien || annonce.caracteristiques || annonce.exposition || annonce.exterieur || annonce.placesParking || annonce.disponibleAPartir || annonce.typeLocation || annonce.nombreColocataires || annonce.statutFumeur) && (
            <div>
              <div className="text-sm font-medium text-slate-700 mb-2">Caractéristiques</div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {annonce.typeBien && <div><span className="font-semibold">Type:</span> {annonce.typeBien}</div>}
                {annonce.meuble != null && <div><span className="font-semibold">Meublé:</span> {annonce.meuble ? 'Oui' : 'Non'}</div>}
                {annonce.nbPieces && <div><span className="font-semibold">Pièces:</span> {annonce.nbPieces}</div>}
                {annonce.nbSdb && <div><span className="font-semibold">Salles de bain:</span> {annonce.nbSdb}</div>}
                {annonce.nbChambres && <div><span className="font-semibold">Chambres:</span> {annonce.nbChambres}</div>}
                {annonce.natureBien && <div><span className="font-semibold">Nature:</span> {annonce.natureBien}</div>}
                {annonce.exposition && <div><span className="font-semibold">Exposition:</span> {annonce.exposition}</div>}
                {annonce.exterieur && <div><span className="font-semibold">Extérieur:</span> {annonce.exterieur}</div>}
                {annonce.placesParking != null && <div><span className="font-semibold">Parking:</span> {annonce.placesParking}</div>}
                {annonce.disponibleAPartir && <div><span className="font-semibold">Dispo à partir de:</span> {annonce.disponibleAPartir}</div>}
                {annonce.typeLocation && <div><span className="font-semibold">Type location:</span> {annonce.typeLocation}</div>}
                {annonce.nombreColocataires && <div><span className="font-semibold">Colocataires:</span> {annonce.nombreColocataires}</div>}
                {annonce.statutFumeur && <div><span className="font-semibold">Fumeur:</span> {annonce.statutFumeur}</div>}
                {annonce.caracteristiques && <div className="col-span-2"><span className="font-semibold">Caractéristiques:</span> {annonce.caracteristiques}</div>}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            {/* Bouton Envoyer un message */}
            {annonce.userId && currentUser?.id !== annonce.userId && (
              <button
                onClick={() => setMessageModalOpen(true)}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
              >
                💬 Envoyer un message
              </button>
            )}
            
            {/* Message informatif si pas connecté */}
            {annonce.userId && !currentUser && (
              <div className="px-4 py-2 rounded bg-gray-100 text-gray-600 text-sm">
                Connectez-vous pour envoyer un message
              </div>
            )}
            
            {/* Boutons admin */}
            {isAdmin && (onEdit || onDelete) && (
              <>
                {onEdit && (
                  <button
                    onClick={() => { onEdit(annonce); onClose(); }}
                    className="px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                  >
                    Modifier
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => { onDelete(annonce.id); onClose(); }}
                    className="px-4 py-2 rounded bg-rose-600 text-white hover:bg-rose-700"
                  >
                    Supprimer
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal d'envoi de message */}
      {messageModalOpen && annonce.userId && currentUser?.id && (
        <MessageModal
          annonceId={annonce.id}
          annonceOwnerId={annonce.userId}
          isOpen={messageModalOpen}
          onClose={() => setMessageModalOpen(false)}
          onSent={() => {
            setMessageModalOpen(false);
            // Afficher une notification de succès
            appToast.success("Message envoyé avec succès !");
          }}
        />
      )}
    </div>
  );
}
