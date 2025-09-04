import prisma from "@/lib/prismaClient";

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
  prefBudgetMin?: number;
  prefBudgetMax?: number;
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
    const profile = await prisma.colocProfile.findUnique({
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
    const profile = await prisma.colocProfile.upsert({
      where: { userId },
      update: {
        nom: data.nom,
        budget: data.budget,
        imageUrl: data.imageUrl,
        photos: data.photos ? JSON.stringify(data.photos) : null,
        description: data.description,
        age: data.age,
        profession: data.profession,
        fumeur: data.fumeur,
        animaux: data.animaux,
        dateDispo: data.dateDispo,
        quartiers: data.quartiers,
        telephone: data.telephone,
        zones: data.zones ? JSON.stringify(data.zones) : null,
        communesSlugs: data.communesSlugs ? JSON.stringify(data.communesSlugs) : null,
        genre: data.genre,
        bioCourte: data.bioCourte,
        languesCsv: data.languesCsv,
        instagram: data.instagram,
        prefGenre: data.prefGenre,
        prefAgeMin: data.prefAgeMin,
        prefAgeMax: data.prefAgeMax,
        prefBudgetMin: data.prefBudgetMin,
        prefBudgetMax: data.prefBudgetMax,
        prefZones: data.prefZones ? JSON.stringify(data.prefZones) : null,
        prefCommunesSlugs: data.prefCommunesSlugs ? JSON.stringify(data.prefCommunesSlugs) : null,
        prefFumeur: data.prefFumeur,
        prefAnimaux: data.prefAnimaux,
        prefProfession: data.prefProfession,
        prefLangues: data.prefLangues,
        prefMusique: data.prefMusique,
        prefSport: data.prefSport,
        prefCuisine: data.prefCuisine,
        prefVoyage: data.prefVoyage,
        prefSorties: data.prefSorties,
        prefSoirees: data.prefSoirees,
        prefCalme: data.prefCalme,
        prefProprete: data.prefProprete,
        prefInvites: data.prefInvites,
        prefAnimauxAcceptes: data.prefAnimauxAcceptes,
        prefFumeurAccepte: data.prefFumeurAccepte,
        prefAgeAccepte: data.prefAgeAccepte,
        prefBudgetAccepte: data.prefBudgetAccepte,
        prefZonesAcceptees: data.prefZonesAcceptees,
        prefCommunesAcceptees: data.prefCommunesAcceptees,
        prefProfessionAcceptee: data.prefProfessionAcceptee,
        prefLanguesAcceptees: data.prefLanguesAcceptees,
        prefMusiqueAcceptee: data.prefMusiqueAcceptee,
        prefSportAccepte: data.prefSportAccepte,
        prefCuisineAcceptee: data.prefCuisineAcceptee,
        prefVoyageAccepte: data.prefVoyageAccepte,
        prefSortiesAcceptees: data.prefSortiesAcceptees,
        prefSoireesAcceptees: data.prefSoireesAcceptees,
        prefCalmeAccepte: data.prefCalmeAccepte,
        prefPropreteAcceptee: data.prefPropreteAcceptee,
        prefInvitesAcceptes: data.prefInvitesAcceptes,
        musique: data.musique,
        updatedAt: new Date()
      },
      create: {
        id: `coloc_${userId}_${Date.now()}`,
        userId,
        nom: data.nom,
        budget: data.budget,
        imageUrl: data.imageUrl,
        photos: data.photos ? JSON.stringify(data.photos) : null,
        description: data.description,
        age: data.age,
        profession: data.profession,
        fumeur: data.fumeur,
        animaux: data.animaux,
        dateDispo: data.dateDispo,
        quartiers: data.quartiers,
        telephone: data.telephone,
        zones: data.zones ? JSON.stringify(data.zones) : null,
        communesSlugs: data.communesSlugs ? JSON.stringify(data.communesSlugs) : null,
        genre: data.genre,
        bioCourte: data.bioCourte,
        languesCsv: data.languesCsv,
        instagram: data.instagram,
        prefGenre: data.prefGenre,
        prefAgeMin: data.prefAgeMin,
        prefAgeMax: data.prefAgeMax,
        prefBudgetMin: data.prefBudgetMin,
        prefBudgetMax: data.prefBudgetMax,
        prefZones: data.prefZones ? JSON.stringify(data.prefZones) : null,
        prefCommunesSlugs: data.prefCommunesSlugs ? JSON.stringify(data.prefCommunesSlugs) : null,
        prefFumeur: data.prefFumeur,
        prefAnimaux: data.prefAnimaux,
        prefProfession: data.prefProfession,
        prefLangues: data.prefLangues,
        prefMusique: data.prefMusique,
        prefSport: data.prefSport,
        prefCuisine: data.prefCuisine,
        prefVoyage: data.prefVoyage,
        prefSorties: data.prefSorties,
        prefSoirees: data.prefSoirees,
        prefCalme: data.prefCalme,
        prefProprete: data.prefProprete,
        prefInvites: data.prefInvites,
        prefAnimauxAcceptes: data.prefAnimauxAcceptes,
        prefFumeurAccepte: data.prefFumeurAccepte,
        prefAgeAccepte: data.prefAgeAccepte,
        prefBudgetAccepte: data.prefBudgetAccepte,
        prefZonesAcceptees: data.prefZonesAcceptees,
        prefCommunesAcceptees: data.prefCommunesAcceptees,
        prefProfessionAcceptee: data.prefProfessionAcceptee,
        prefLanguesAcceptees: data.prefLanguesAcceptees,
        prefMusiqueAcceptee: data.prefMusiqueAcceptee,
        prefSportAccepte: data.prefSportAccepte,
        prefCuisineAcceptee: data.prefCuisineAcceptee,
        prefVoyageAccepte: data.prefVoyageAccepte,
        prefSortiesAcceptees: data.prefSortiesAcceptees,
        prefSoireesAcceptees: data.prefSoireesAcceptees,
        prefCalmeAccepte: data.prefCalmeAccepte,
        prefPropreteAcceptee: data.prefPropreteAcceptee,
        prefInvitesAcceptes: data.prefInvitesAcceptes,
        musique: data.musique,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    return profile;
  } catch (error) {
    console.error("Erreur lors de la sauvegarde du profil coloc:", error);
    throw error;
  }
}

export async function deleteColocProfile(userId: string) {
  try {
    await prisma.colocProfile.delete({
      where: { userId }
    });
    return true;
  } catch (error) {
    console.error("Erreur lors de la suppression du profil coloc:", error);
    throw error;
  }
}
