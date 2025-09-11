"use client";

import { useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useFavoriteState } from "@/shared/hooks/useFavorites";

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
  
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const { data: session } = useSession();
  const currentUser = session?.user as any;
  const { isFavorite, toggle, loading: favoriteLoading } = useFavoriteState(_id, 'annonce');

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

  // Gérer le toggle des favoris
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser?.id) return;
    
    await toggle();
  };

  return (
    <div
      className="block w-full cursor-pointer relative group"
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
      <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 group-hover:scale-[1.02] group-hover:border-blue-200">
        {/* Image avec overlay gradient */}
        <div className="relative h-48 overflow-hidden">
          <Image
            src={thumbUrl}
            alt={titre || "annonce"}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={priority}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          
          {/* Badge prix en overlay */}
          <div className="absolute top-4 left-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg">
              <span className="text-lg font-bold text-blue-600">
                {prix ? `${prix}€` : "N/A"}
              </span>
            </div>
          </div>

          {/* Badge meublé/non meublé */}
          {props.meuble != null && (
            <div className="absolute top-4 left-20">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                props.meuble 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-orange-100 text-orange-800 border border-orange-200'
              }`}>
                {props.meuble ? '🏠 Meublé' : '📦 Non meublé'}
              </span>
            </div>
          )}
        </div>

        {/* Contenu de la carte */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {titre || "Titre manquant"}
            </h2>
          </div>

          {/* Localisation */}
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-gray-600 font-medium">
              {zonesLabel ? zonesLabel : (ville || "Ville non renseignée")}
            </span>
          </div>

          {/* Badges zones/sous-communes */}
          {(zonesLabel || subCommunesLabel) && (
            <div className="flex flex-wrap gap-2 mb-3">
              {zonesLabel && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  🗺️ {zonesLabel}
                </span>
              )}
              {subCommunesLabel && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
                  📍 {subCommunesLabel}
                </span>
              )}
            </div>
          )}

          {/* Informations principales */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              <span className="text-sm text-gray-600">
                {surface ? `${surface} m²` : "Surface N/A"}
              </span>
            </div>
            {(props.nbPieces || props.nbChambres) && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                </svg>
                <span className="text-sm text-gray-600">
                  {props.nbPieces ? `${props.nbPieces} pièces` : `${props.nbChambres} ch.`}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {description && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 line-clamp-2">
                {description}
              </p>
            </div>
          )}

          {/* Date et type de bien */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            {dateLabel && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {dateLabel}
              </span>
            )}
            {props.typeBien && (
              <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">
                {props.typeBien}
              </span>
            )}
          </div>
        </div>

        {/* Bouton favori en haut à droite */}
        {currentUser?.id && (
          <div className="absolute top-4 right-4">
            <button
              onClick={handleToggleFavorite}
              disabled={favoriteLoading}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                isFavorite 
                  ? 'bg-red-500/90 hover:bg-red-600 text-white' 
                  : 'bg-white/90 hover:bg-white text-gray-600 hover:text-red-500'
              }`}
              title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              {favoriteLoading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
            </button>
          </div>
        )}

        {/* Boutons d'action en overlay sur l'image */}
        <div className="absolute top-14 right-4 flex gap-2">
          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
              }}
              className="w-8 h-8 bg-red-500/90 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
              title="Supprimer l'annonce"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          {onEdit && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit();
              }}
              className="w-8 h-8 bg-gray-500/90 hover:bg-gray-600 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
              title="Modifier l'annonce"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Bouton Envoyer un message */}
        {userId && currentUser?.id !== userId && (
          <div className="absolute bottom-4 right-4">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMessageModalOpen(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 hover:scale-105 shadow-lg flex items-center gap-2"
              title="Envoyer un message"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Message
            </button>
          </div>
        )}
      </div>
      
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


