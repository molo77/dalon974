import prisma from "@/infrastructure/database/prismaClient";

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

export async function getColocProfile(userId: string) {
  try {
    const profile = await prisma.colocProfile.findFirst({
      where: { userId }
    });
    return profile;
  } catch (error) {
    console.error("Erreur lors de la récupération du profil coloc:", error);
    throw error;
  }
}

export async function saveColocProfile(userId: string, data: ColocProfileData) {
  try {
    console.log("[saveColocProfile] Début de la sauvegarde pour userId:", userId);
    console.log("[saveColocProfile] Données reçues:", JSON.stringify(data, null, 2));
    
    // Chercher d'abord s'il existe déjà un profil pour cet utilisateur
    const existingProfile = await prisma.colocProfile.findFirst({
      where: { userId }
    });
    
    console.log("[saveColocProfile] Profil existant trouvé:", !!existingProfile);

    const profile = existingProfile 
      ? await prisma.colocProfile.update({
          where: { id: existingProfile.id },
        data: {
          nom: data.nom,
          budget: data.budget,
          imageUrl: data.imageUrl,
          photos: data.photos ? JSON.stringify(data.photos) : undefined,
          description: data.description,
          age: data.age,
          profession: data.profession,
          fumeur: data.fumeur,
          animaux: data.animaux,
          dateDispo: data.dateDispo,
          quartiers: data.quartiers,
          telephone: data.telephone,
          zones: data.zones ? JSON.stringify(data.zones) : undefined,
          communesSlugs: data.communesSlugs ? JSON.stringify(data.communesSlugs) : undefined,
          genre: data.genre,
          bioCourte: data.bioCourte,
          langues: data.languesCsv ? (typeof data.languesCsv === 'string' ? JSON.parse(data.languesCsv) : data.languesCsv) : undefined,
          instagram: data.instagram,
          prefGenre: data.prefGenre,
          prefAgeMin: data.prefAgeMin,
          prefAgeMax: data.prefAgeMax,
          musique: data.musique,
          updatedAt: new Date()
        }
      })
      : await prisma.colocProfile.create({
          data: {
            id: `coloc_${userId}_${Date.now()}`,
            userId,
            nom: data.nom,
            budget: data.budget,
            imageUrl: data.imageUrl,
            photos: data.photos ? JSON.stringify(data.photos) : undefined,
            description: data.description,
            age: data.age,
            profession: data.profession,
            fumeur: data.fumeur,
            animaux: data.animaux,
            dateDispo: data.dateDispo,
            quartiers: data.quartiers,
            telephone: data.telephone,
            zones: data.zones ? JSON.stringify(data.zones) : undefined,
            communesSlugs: data.communesSlugs ? JSON.stringify(data.communesSlugs) : undefined,
            genre: data.genre,
            bioCourte: data.bioCourte,
            langues: data.languesCsv ? (typeof data.languesCsv === 'string' ? JSON.parse(data.languesCsv) : data.languesCsv) : undefined,
            instagram: data.instagram,
            prefGenre: data.prefGenre,
            prefAgeMin: data.prefAgeMin,
            prefAgeMax: data.prefAgeMax,
            musique: data.musique,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
    
    console.log("[saveColocProfile] Profil sauvegardé avec succès:", profile.id);
    return profile;
  } catch (error) {
    console.error("Erreur lors de la sauvegarde du profil coloc:", error);
    console.error("Détails de l'erreur:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export async function deleteColocProfile(userId: string) {
  try {
    const profile = await prisma.colocProfile.findFirst({
      where: { userId }
    });
    
    if (profile) {
      await prisma.colocProfile.delete({
        where: { id: profile.id }
      });
    }
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la suppression du profil coloc:", error);
    throw error;
  }
}
