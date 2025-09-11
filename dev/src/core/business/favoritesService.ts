// Service client pour gérer les favoris

export type FavoriteItem = {
  id: string;
  itemId: string;
  itemType: 'annonce' | 'coloc_profile';
  createdAt: string;
};

export type FavoriteWithDetails = {
  id: string;
  favoriteId: string;
  favoriteCreatedAt: string;
  itemType: 'annonce' | 'coloc_profile';
  // Champs communs
  title?: string;
  description?: string;
  imageUrl?: string;
  ville?: string;
  createdAt?: string;
  // Champs spécifiques aux annonces
  prix?: number;
  surface?: number;
  nbChambres?: number;
  meuble?: boolean;
  // Champs spécifiques aux profils
  nom?: string;
  age?: number;
  budget?: number;
  profession?: string;
  zones?: any;
  communesSlugs?: any;
};

// Ajouter un favori
export async function addFavorite(itemId: string, itemType: 'annonce' | 'coloc_profile'): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/favorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ itemId, itemType }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de l\'ajout du favori');
    }

    return { success: true, message: data.message };
  } catch (error) {
    console.error('[FavoritesService] Erreur lors de l\'ajout du favori:', error);
    throw error;
  }
}

// Supprimer un favori
export async function removeFavorite(itemId: string, itemType: 'annonce' | 'coloc_profile'): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`/api/favorites?itemId=${itemId}&itemType=${itemType}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la suppression du favori');
    }

    return { success: true, message: data.message };
  } catch (error) {
    console.error('[FavoritesService] Erreur lors de la suppression du favori:', error);
    throw error;
  }
}

// Récupérer les favoris de l'utilisateur
export async function getUserFavorites(itemType?: 'annonce' | 'coloc_profile'): Promise<FavoriteItem[]> {
  try {
    const url = itemType ? `/api/favorites?type=${itemType}` : '/api/favorites';
    const response = await fetch(url);

    const data = await response.json();

    if (!response.ok) {
      // Si l'utilisateur n'est pas authentifié, retourner un tableau vide au lieu de lancer une erreur
      if (response.status === 401) {
        console.log('[FavoritesService] Utilisateur non authentifié, retour d\'un tableau vide');
        return [];
      }
      throw new Error(data.error || 'Erreur lors de la récupération des favoris');
    }

    return data.favorites;
  } catch (error) {
    console.error('[FavoritesService] Erreur lors de la récupération des favoris:', error);
    throw error;
  }
}

// Récupérer les favoris avec détails
export async function getFavoritesWithDetails(itemType?: 'annonce' | 'coloc_profile'): Promise<FavoriteWithDetails[]> {
  try {
    const url = itemType ? `/api/favorites/details?type=${itemType}` : '/api/favorites/details';
    const response = await fetch(url);

    const data = await response.json();

    if (!response.ok) {
      // Si l'utilisateur n'est pas authentifié, retourner un tableau vide au lieu de lancer une erreur
      if (response.status === 401) {
        console.log('[FavoritesService] Utilisateur non authentifié, retour d\'un tableau vide pour les détails');
        return [];
      }
      throw new Error(data.error || 'Erreur lors de la récupération des favoris');
    }

    return data.favorites;
  } catch (error) {
    console.error('[FavoritesService] Erreur lors de la récupération des favoris avec détails:', error);
    throw error;
  }
}

// Vérifier si un élément est en favori
export async function isFavorite(itemId: string, itemType: 'annonce' | 'coloc_profile'): Promise<boolean> {
  try {
    const favorites = await getUserFavorites(itemType);
    return favorites.some(fav => fav.itemId === itemId);
  } catch (error) {
    console.error('[FavoritesService] Erreur lors de la vérification du favori:', error);
    return false;
  }
}

// Toggle favori (ajouter si absent, supprimer si présent)
export async function toggleFavorite(itemId: string, itemType: 'annonce' | 'coloc_profile'): Promise<{ success: boolean; isFavorite: boolean; message: string }> {
  try {
    const isCurrentlyFavorite = await isFavorite(itemId, itemType);
    
    if (isCurrentlyFavorite) {
      await removeFavorite(itemId, itemType);
      return { 
        success: true, 
        isFavorite: false, 
        message: 'Supprimé des favoris' 
      };
    } else {
      await addFavorite(itemId, itemType);
      return { 
        success: true, 
        isFavorite: true, 
        message: 'Ajouté aux favoris' 
      };
    }
  } catch (error) {
    console.error('[FavoritesService] Erreur lors du toggle du favori:', error);
    throw error;
  }
}
