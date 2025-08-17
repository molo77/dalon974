import React from "react";
import Image from "next/image";

interface AnnonceDetailModalProps {
  open: boolean;
  onClose: () => void;
  annonce: any;
  isAdmin?: boolean;
  onEdit?: (annonce: any) => void;
  onDelete?: (id: string) => void;
}

export default function AnnonceDetailModal({ open, onClose, annonce, isAdmin, onEdit, onDelete }: AnnonceDetailModalProps) {
  if (!open || !annonce) return null;
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
              <Image src={annonce.imageUrl} alt={annonce.titre} fill className="object-cover" sizes="176px" />
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
          {isAdmin && (onEdit || onDelete) && (
            <div className="flex justify-end gap-2">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
