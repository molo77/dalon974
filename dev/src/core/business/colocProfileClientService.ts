// Service côté client pour les profils de colocation
// Utilise les API routes au lieu de Prisma directement

export interface ColocProfileData {
  nom?: string;
  budget?: number;
  imageUrl?: string;
  photos?: { url: string; isMain: boolean }[];
  description?: string;
  age?: number;
  profession?: string;
  fumeur?: boolean;
  animaux?: boolean;
  dateDispo?: string;
  quartiers?: string;
  telephone?: string;
  zones?: string[];
  communesSlugs?: string[];
  genre?: string;
  bioCourte?: string;
  languesCsv?: string;
  instagram?: string;
  prefGenre?: string;
  prefAgeMin?: number;
  prefAgeMax?: number;
  prefZones?: string[];
  prefCommunesSlugs?: string[];
  prefFumeur?: boolean;
  prefAnimaux?: boolean;
  prefProfession?: string;
  prefLangues?: string;
  prefMusique?: string;
  prefSport?: string;
  prefCuisine?: string;
  prefVoyage?: string;
  prefSorties?: string;
  prefSoirees?: string;
  prefCalme?: string;
  prefProprete?: string;
  prefInvites?: string;
  prefAnimauxAcceptes?: string;
  prefFumeurAccepte?: string;
  prefAgeAccepte?: string;
  prefBudgetAccepte?: string;
  prefZonesAcceptees?: string;
  prefCommunesAcceptees?: string;
  prefProfessionAcceptee?: string;
  prefLanguesAcceptees?: string;
  prefMusiqueAcceptee?: string;
  prefSportAccepte?: string;
  prefCuisineAcceptee?: string;
  prefVoyageAccepte?: string;
  prefSortiesAcceptees?: string;
  prefSoireesAcceptees?: string;
  prefCalmeAccepte?: string;
  prefPropreteAcceptee?: string;
  prefInvitesAcceptes?: string;
  musique?: string;
}

export async function getColocProfile(): Promise<any> {
  try {
    const response = await fetch('/api/coloc-profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Non authentifié');
      }
      throw new Error('Erreur lors de la récupération du profil');
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur lors de la récupération du profil coloc:", error);
    throw error;
  }
}

export async function saveColocProfile(data: ColocProfileData): Promise<any> {
  try {
    console.log("[saveColocProfile] Envoi des données:", data);
    
    const response = await fetch('/api/coloc-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[saveColocProfile] Erreur de réponse:", {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      
      if (response.status === 401) {
        throw new Error('Non authentifié');
      }
      
      const errorMessage = errorData.error || `Erreur ${response.status}: ${response.statusText}`;
      throw new Error(`Erreur lors de la sauvegarde du profil: ${errorMessage}`);
    }

    const result = await response.json();
    console.log("[saveColocProfile] Sauvegarde réussie:", result);
    return result;
  } catch (error) {
    console.error("Erreur lors de la sauvegarde du profil coloc:", error);
    throw error;
  }
}

export async function deleteColocProfile(): Promise<boolean> {
  try {
    const response = await fetch('/api/coloc-profile', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Non authentifié');
      }
      throw new Error('Erreur lors de la suppression du profil');
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("Erreur lors de la suppression du profil coloc:", error);
    throw error;
  }
}
