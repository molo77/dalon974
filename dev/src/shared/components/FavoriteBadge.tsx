"use client";

import { useFavoriteState } from '@/shared/hooks/useFavorites';

interface FavoriteBadgeProps {
  itemId: string;
  itemType: 'annonce' | 'coloc_profile';
  className?: string;
}

export default function FavoriteBadge({ 
  itemId, 
  itemType, 
  className = "" 
}: FavoriteBadgeProps) {
  const { isFavorite, loading } = useFavoriteState(itemId, itemType);

  if (loading) {
    return (
      <div className={`inline-flex items-center gap-1 ${className}`}>
        <div className="w-3 h-3 animate-spin rounded-full border border-gray-300 border-t-red-500"></div>
      </div>
    );
  }

  if (!isFavorite) return null;

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium border border-red-200 ${className}`}>
      <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      Favori
    </div>
  );
}
