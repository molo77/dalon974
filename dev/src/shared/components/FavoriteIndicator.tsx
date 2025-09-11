"use client";

import { useFavoriteState } from '@/shared/hooks/useFavorites';

interface FavoriteIndicatorProps {
  itemId: string;
  itemType: 'annonce' | 'coloc_profile';
  className?: string;
  showText?: boolean;
}

export default function FavoriteIndicator({ 
  itemId, 
  itemType, 
  className = "",
  showText = false 
}: FavoriteIndicatorProps) {
  const { isFavorite, toggle, loading } = useFavoriteState(itemId, itemType);

  if (loading) {
    return (
      <div className={`inline-flex items-center gap-1 ${className}`}>
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-500"></div>
        {showText && <span className="text-xs text-gray-500">Chargement...</span>}
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      className={`inline-flex items-center gap-1 transition-colors hover:scale-105 ${className}`}
      title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <svg 
        className={`w-4 h-4 transition-colors ${
          isFavorite 
            ? 'text-red-500 fill-current' 
            : 'text-gray-400 hover:text-red-500'
        }`} 
        fill={isFavorite ? "currentColor" : "none"} 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
        />
      </svg>
      {showText && (
        <span className={`text-xs ${
          isFavorite ? 'text-red-600' : 'text-gray-500'
        }`}>
          {isFavorite ? 'Favori' : 'Ajouter'}
        </span>
      )}
    </button>
  );
}
