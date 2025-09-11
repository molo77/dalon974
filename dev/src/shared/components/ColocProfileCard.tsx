"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useFavoriteState } from "@/shared/hooks/useFavorites";

const ImageLightbox = dynamic(() => import("./ImageLightbox"), { ssr: false });

type ColocProfileCardProps = {
  id: string;
  nom: string;
  ville: string;
  age?: number;
  description?: string;
  createdAt?: any;
  userEmail?: string;
  imageUrl?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => void;
  // Optionnel: afficher un badge de sous-communes détectées
  subCommunesLabel?: string;
  // Zones recherchées (affichage)
  zonesLabel?: string;
};

export default function ColocProfileCard({
  id: _id,
  nom,
  ville,
  age,
  description,
  createdAt,
  userEmail: _userEmail,
  imageUrl,
  onClick,
  subCommunesLabel,
  zonesLabel,
}: ColocProfileCardProps) {
  const defaultColocImg = "/images/coloc-holder.svg";
  const thumbUrl = imageUrl || defaultColocImg;
  const [openImg, setOpenImg] = useState(false);
  const { data: session } = useSession();
  const currentUser = session?.user as any;
  const { isFavorite, toggle, loading: favoriteLoading } = useFavoriteState(_id, 'coloc_profile');
  const formatDate = (v: any): string | null => {
    if (!v) return null;
    let d: Date | null = null;
    if (typeof v === 'number') d = new Date(v);
    else if (typeof v === 'string') {
      const t = Date.parse(v);
      d = isNaN(t) ? null : new Date(t);
    } else if (v && typeof v === 'object' && v.toDate) {
      d = v.toDate();
    }
    if (!d) return null;
    return d.toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
  };
  const dateLabel = formatDate(createdAt);

  // Gérer le toggle des favoris
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser?.id) return;
    
    try {
      await toggle();
    } catch (error) {
      console.error('Erreur lors du toggle favori:', error);
    }
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
      <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 group-hover:scale-[1.02] group-hover:border-purple-200">
        {/* Image de profil avec overlay */}
        <div className="relative h-48 overflow-hidden">
          <Image
            src={thumbUrl}
            alt={nom || "colocataire"}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); setOpenImg(true); }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          
          {/* Badge âge en overlay */}
          {age && (
            <div className="absolute top-4 right-12">
              <div className="bg-white/95 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg">
                <span className="text-sm font-bold text-purple-600">
                  {age} ans
                </span>
              </div>
            </div>
          )}

          {/* Badge profil colocataire */}
          <div className="absolute top-4 left-4">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
              👥 Colocataire
            </span>
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
        </div>

        {/* Contenu de la carte */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-purple-600 transition-colors">
              {nom}
            </h2>
          </div>

          {/* Localisation */}
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-gray-600 font-medium">
              {ville}
            </span>
          </div>

          {/* Badges zones/sous-communes */}
          {(zonesLabel || subCommunesLabel) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {zonesLabel && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
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

          {/* Description */}
          {description && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 line-clamp-3">
                {description}
              </p>
            </div>
          )}

          {/* Date de création */}
          {dateLabel && (
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Profil créé le {dateLabel}
              </span>
            </div>
          )}
        </div>

        {/* Bouton d'action pour voir le profil */}
        <div className="absolute bottom-4 right-4">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onClick) onClick(e);
            }}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-full text-sm font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-200 hover:scale-105 shadow-lg flex items-center gap-2"
            title="Voir le profil"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Voir profil
          </button>
        </div>

        {openImg && (
          <ImageLightbox images={[thumbUrl]} initialIndex={0} onClose={() => setOpenImg(false)} />
        )}
      </div>
    </div>
  );
}
