"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { 
  getUserFavorites, 
  toggleFavorite, 
  isFavorite as checkIsFavorite,
  type FavoriteItem 
} from '@/core/business/favoritesService';

export function useFavorites() {
  const { data: session, status } = useSession();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [favoriteStates, setFavoriteStates] = useState<Record<string, boolean>>({});

  // Charger les favoris de l'utilisateur
  const loadFavorites = useCallback(async () => {
    // Attendre que la session soit chargée
    if (status === 'loading') return;
    if (!session?.user?.id) {
      // Réinitialiser les favoris si l'utilisateur n'est pas connecté
      setFavorites([]);
      setFavoriteStates({});
      return;
    }
    
    setLoading(true);
    try {
      const userFavorites = await getUserFavorites();
      setFavorites(userFavorites);
      
      // Créer un état pour chaque favori
      const states: Record<string, boolean> = {};
      userFavorites.forEach(fav => {
        states[`${fav.itemId}-${fav.itemType}`] = true;
      });
      setFavoriteStates(states);
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, status]);

  // Vérifier si un élément est en favori
  const isFavorite = useCallback((itemId: string, itemType: 'annonce' | 'coloc_profile'): boolean => {
    return favoriteStates[`${itemId}-${itemType}`] || false;
  }, [favoriteStates]);

  // Toggle favori
  const toggleFavoriteItem = useCallback(async (itemId: string, itemType: 'annonce' | 'coloc_profile') => {
    if (status === 'loading') return { success: false, isFavorite: false, message: 'Session en cours de chargement' };
    if (!session?.user?.id) return { success: false, isFavorite: false, message: 'Non authentifié' };
    
    try {
      const result = await toggleFavorite(itemId, itemType);
      
      // Mettre à jour l'état local
      setFavoriteStates(prev => ({
        ...prev,
        [`${itemId}-${itemType}`]: result.isFavorite
      }));
      
      // Mettre à jour la liste des favoris
      if (result.isFavorite) {
        // Ajouter aux favoris
        const newFavorite: FavoriteItem = {
          id: `${itemId}-${itemType}`, // ID temporaire
          itemId,
          itemType,
          createdAt: new Date().toISOString()
        };
        setFavorites(prev => [...prev, newFavorite]);
      } else {
        // Supprimer des favoris
        setFavorites(prev => prev.filter(fav => !(fav.itemId === itemId && fav.itemType === itemType)));
      }
      
      return result;
    } catch (error) {
      console.error('Erreur lors du toggle favori:', error);
      throw error;
    }
  }, [session?.user?.id, status]);

  // Charger les favoris au montage du composant
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return {
    favorites,
    loading,
    isFavorite,
    toggleFavorite: toggleFavoriteItem,
    refreshFavorites: loadFavorites
  };
}

// Hook spécialisé pour un élément spécifique
export function useFavoriteState(itemId: string, itemType: 'annonce' | 'coloc_profile') {
  const { isFavorite, toggleFavorite, loading } = useFavorites();
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = useCallback(async () => {
    setIsToggling(true);
    try {
      await toggleFavorite(itemId, itemType);
    } catch (error) {
      console.error('Erreur lors du toggle favori:', error);
    } finally {
      setIsToggling(false);
    }
  }, [itemId, itemType, toggleFavorite]);

  return {
    isFavorite: isFavorite(itemId, itemType),
    toggle: handleToggle,
    loading: loading || isToggling
  };
}
