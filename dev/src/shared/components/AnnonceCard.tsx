"use client";

import { useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";

const ImageLightbox = dynamic(() => import("./ImageLightbox"), { ssr: false });
const MessageModal = dynamic(() => import("./MessageModal"), { ssr: false });

type AnnonceProps = {
  id: string;
  titre: string;
  ville: string;
  prix?: number;
  surface?: number;
  description?: string;
  createdAt?: any;
  userEmail?: string;
  userId?: string; // ID de l'utilisateur propriétaire de l'annonce
  onDelete?: () => void;
  onEdit?: () => void;
  imageUrl: string;
  // Optionnel: pour les profils colocataires, affiche un badge Zones
  zonesLabel?: string;
  priority?: boolean; // Pour optimiser le LCP
  // NOUVEAU: sous-communes couvertes par les zones sélectionnées
  subCommunesLabel?: string;
  // Attributs enrichis
  typeBien?: string;
  meuble?: boolean;
  nbPieces?: number;
  nbChambres?: number; // déjà existant mais pour cohérence de lecture
};
export default function AnnonceCard(props: AnnonceProps & { onClick?: (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => void }) {
  const {
  id: _id,
    titre,
    ville,
    prix,
    surface,
    description,
    createdAt,
  userEmail: _userEmail,
    userId,
    onDelete,
    onEdit,
    imageUrl,
    zonesLabel,
    subCommunesLabel,
    onClick,
    priority = false,
  } = props;
  
  const defaultAnnonceImg = "/images/annonce-holder.svg";
  const defaultColocImg = "/images/coloc-holder.svg";
  const thumbUrl = imageUrl || (zonesLabel ? defaultColocImg : defaultAnnonceImg);
  
  const [openImg, setOpenImg] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const { data: session } = useSession();
  const currentUser = session?.user as any;

  const formatDate = (v: any): string | null => {
    if (!v) return null;
    let d: Date | null = null;
    if (typeof v === 'number') d = new Date(v);
    else if (typeof v === 'string') {
      const t = Date.parse(v);
      d = isNaN(t) ? null : new Date(t);
    } else if (v && typeof v === 'object') {
      if (typeof v.toDate === 'function') d = v.toDate();
      else if (typeof v.seconds === 'number') d = new Date(v.seconds * 1000 + (v.nanoseconds ? Math.floor(v.nanoseconds / 1e6) : 0));
    }
    if (!d) return null;
    try {
      return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(d);
    } catch {
      return d.toLocaleDateString('fr-FR');
    }
  };
  const dateLabel = formatDate(createdAt);

  return (
    <div
      className="block w-full cursor-pointer relative"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (onClick) onClick(e);
        }
      }}
    >
      <div className="relative border rounded-xl shadow p-4 w-full bg-white hover:bg-gray-50 transition">
        <div className="flex items-start gap-4">
          {/* miniature carrée */}
          <div className="flex-shrink-0 w-28 h-28 rounded-lg overflow-hidden bg-gray-100 relative">
            <Image
              src={thumbUrl}
              alt={titre || "annonce"}
              fill
              className="object-cover"
              sizes="112px"
              priority={priority}
              onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); setOpenImg(true); }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold truncate">{titre || "Titre manquant"}</h2>
            {zonesLabel ? (
              <div className="mt-1">
                <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 border border-slate-200">
                  Zones: {zonesLabel}
                </span>
              </div>
            ) : (
              <p className="text-sm text-gray-600">📍 {ville || "Ville non renseignée"}</p>
            )}
            {subCommunesLabel && (
              <div className="mt-1">
                <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-slate-50 text-slate-600 border border-slate-200">
                  Sous-communes: {subCommunesLabel}
                </span>
              </div>
            )}

            <div className="mt-2 flex items-center justify-between gap-4">
              <p className="text-blue-600 font-semibold truncate">
                {prix ? `${prix} € / mois` : "Prix non renseigné"}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Surface :</span> {surface ? `${surface} m²` : "Non renseignée"}
              </p>
            </div>

            {dateLabel && (
              <p className="text-xs text-gray-500 mt-1">📅 {dateLabel}</p>
            )}

            <div className="text-sm text-gray-700 mt-2">
              <span className="font-semibold">Description :</span>{" "}
              {description ? (
                (() => {
                  const lines = description.split("\n");
                  const firstLines = lines.slice(0, 2);
                  const rest = lines.slice(2);
                  return (
                    <>
                      {firstLines.map((line, idx) => (
                        <span key={idx} className="block truncate">
                          {line}
                        </span>
                      ))}
                      {rest.length > 0 && (
                        <>
                          <span className="text-gray-400 ml-1">...</span>
                        </>
                      )}
                    </>
                  );
                })()
              ) : (
                <span className="text-gray-500 italic">Aucune description disponible</span>
              )}
            </div>
            {/* Badges attributs */}
            {(props.typeBien || props.meuble != null || props.nbPieces || props.nbChambres) ? (
              <div className="mt-2 flex flex-wrap gap-2">
        {props.typeBien && <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs">{props.typeBien}</span>}
        {props.nbPieces && <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs">{props.nbPieces} pièces</span>}
        {props.nbChambres && <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs">{props.nbChambres} ch.</span>}
        {props.meuble != null && <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs">{props.meuble ? 'Meublé' : 'Non meublé'}</span>}
              </div>
            ) : null}
          </div>
        </div>

        {onDelete && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
            title="Supprimer l'annonce"
          >
            🗑️
          </button>
        )}
        {onEdit && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit();
            }}
            className="absolute top-2 right-10 text-gray-500 hover:text-black"
            title="Modifier l'annonce"
          >
            ✏️
          </button>
        )}
        
        {/* Bouton Envoyer un message */}
        {userId && currentUser?.id !== userId && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMessageModalOpen(true);
            }}
            className="absolute bottom-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors"
            title="Envoyer un message"
          >
            💬 Message
          </button>
        )}
      </div>
      {openImg && (
        <ImageLightbox images={[thumbUrl]} initialIndex={0} onClose={() => setOpenImg(false)} />
      )}
      
      {/* Modal d'envoi de message */}
      {messageModalOpen && userId && (
        <MessageModal
          annonceId={_id}
          annonceOwnerId={userId}
          isOpen={messageModalOpen}
          onClose={() => setMessageModalOpen(false)}
          onSent={() => {
            setMessageModalOpen(false);
            // Optionnel: afficher une notification de succès
          }}
        />
      )}
    </div>
  );
}


