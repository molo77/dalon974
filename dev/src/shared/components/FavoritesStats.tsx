"use client";

import { useFavorites } from '@/shared/hooks/useFavorites';

export default function FavoritesStats() {
  const { favorites, loading } = useFavorites();

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium text-red-800">Chargement des favoris...</div>
            <div className="text-xs text-red-600">Récupération de vos favoris en cours</div>
          </div>
        </div>
      </div>
    );
  }

  const annoncesCount = favorites.filter(fav => fav.itemType === 'annonce').length;
  const profilsCount = favorites.filter(fav => fav.itemType === 'coloc_profile').length;
  const totalCount = favorites.length;

  return (
    <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-red-800">
            {totalCount} favori{totalCount > 1 ? 's' : ''} au total
          </div>
          <div className="text-xs text-red-600">
            {annoncesCount} annonce{annoncesCount > 1 ? 's' : ''} • {profilsCount} profil{profilsCount > 1 ? 's' : ''}
          </div>
        </div>
        {totalCount > 0 && (
          <div className="text-xs text-red-500 bg-red-100 px-2 py-1 rounded-full">
            ♥
          </div>
        )}
      </div>
    </div>
  );
}
