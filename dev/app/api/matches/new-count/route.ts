import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/config/auth";
import prisma from "@/infrastructure/database/prismaClient";

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    const userId = session.user.id;
    
    // Récupérer le profil de l'utilisateur
    const userProfile = await prisma.colocProfile.findFirst({
      where: { userId: userId }
    });

    if (!userProfile) {
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    // Récupérer les annonces de l'utilisateur
    const userAnnonces = await prisma.annonce.findMany({
      where: { userId: userId }
    });

    // Calculer les nouveaux matchs basés sur la compatibilité
    let newMatchesCount = 0;
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Si l'utilisateur a des annonces, chercher des profils compatibles
    if (userAnnonces && userAnnonces.length > 0) {
      const compatibleProfiles = await prisma.colocProfile.findMany({
        where: {
          userId: { not: userId }, // Exclure l'utilisateur lui-même
          createdAt: { gte: oneWeekAgo }, // Profils créés dans la dernière semaine
        }
      });

      // Calculer la compatibilité pour chaque profil
      for (const profile of compatibleProfiles) {
        const compatibility = calculateCompatibility(userProfile, profile, false);
        if (compatibility.percentage >= 70) { // Seuil de compatibilité élevé
          newMatchesCount++;
        }
      }
    }

    // Si l'utilisateur cherche une colocation, chercher des annonces compatibles
    if (userProfile.budget) {
      const compatibleAnnonces = await prisma.annonce.findMany({
        where: {
          userId: { not: userId }, // Exclure les annonces de l'utilisateur
          createdAt: { gte: oneWeekAgo }, // Annonces créées dans la dernière semaine
        }
      });

      // Compter les annonces compatibles (logique simplifiée)
      newMatchesCount = compatibleAnnonces.length;
    }

    return NextResponse.json({ count: newMatchesCount }, { status: 200 });

  } catch (error) {
    console.error("Erreur lors du calcul des nouveaux matchs:", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}

// Fonction pour calculer la compatibilité (simplifiée)
function calculateCompatibility(userProfile: any, targetProfile: any, isAnnonce: boolean) {
  let score = 0;
  const maxScore = 100;

  if (isAnnonce) {
    // Matching profil -> annonce
    // Budget (40 points)
    if (userProfile.budget && targetProfile.prix) {
      const budgetRatio = userProfile.budget / targetProfile.prix;
      if (budgetRatio >= 0.8 && budgetRatio <= 1.2) score += 40;
      else if (budgetRatio >= 0.6 && budgetRatio <= 1.5) score += 30;
      else if (budgetRatio >= 0.4 && budgetRatio <= 2.0) score += 20;
      else score += 10;
    } else {
      score += 20;
    }

    // Zone géographique (30 points)
    if (userProfile.communesSlugs && targetProfile.communeSlug) {
      if (userProfile.communesSlugs.includes(targetProfile.communeSlug)) {
        score += 30;
      } else {
        // Vérifier les zones
        const userZones = computeZonesFromSlugs(userProfile.communesSlugs);
        const targetZones = computeZonesFromSlugs([targetProfile.communeSlug]);
        const hasZoneOverlap = userZones.some((zone: string) => targetZones.includes(zone));
        if (hasZoneOverlap) score += 20;
        else score += 5;
      }
    } else {
      score += 15;
    }

    // Âge et profession (20 points)
    if (userProfile.age && userProfile.profession) score += 20;
    else if (userProfile.age || userProfile.profession) score += 10;

    // Description complète (10 points)
    if (userProfile.description && userProfile.description.length > 100) score += 10;
    else if (userProfile.description && userProfile.description.length > 50) score += 5;
  } else {
    // Matching annonce -> profil
    // Budget (40 points)
    if (userProfile.annonces && userProfile.annonces.length > 0 && targetProfile.budget) {
      const avgPrix = userProfile.annonces.reduce((sum: number, annonce: any) => sum + (annonce.prix || 0), 0) / userProfile.annonces.length;
      const budgetRatio = targetProfile.budget / avgPrix;
      if (budgetRatio >= 0.8 && budgetRatio <= 1.2) score += 40;
      else if (budgetRatio >= 0.6 && budgetRatio <= 1.5) score += 30;
      else if (budgetRatio >= 0.4 && budgetRatio <= 2.0) score += 20;
      else score += 10;
    } else {
      score += 20;
    }

    // Zone géographique (30 points)
    if (userProfile.annonces && userProfile.annonces.length > 0 && targetProfile.communesSlugs) {
      const hasZoneMatch = userProfile.annonces.some((annonce: any) => 
        annonce.communeSlug && targetProfile.communesSlugs.includes(annonce.communeSlug)
      );
      if (hasZoneMatch) {
        score += 30;
      } else {
        const targetZones = computeZonesFromSlugs(targetProfile.communesSlugs);
        const hasZoneOverlap = userProfile.annonces.some((annonce: any) => {
          if (!annonce.communeSlug) return false;
          const annonceZones = computeZonesFromSlugs([annonce.communeSlug]);
          return targetZones.some((zone: string) => annonceZones.includes(zone));
        });
        if (hasZoneOverlap) score += 20;
        else score += 5;
      }
    } else {
      score += 15;
    }

    // Âge et profession (20 points)
    if (targetProfile.age && targetProfile.profession) score += 20;
    else if (targetProfile.age || targetProfile.profession) score += 10;

    // Description complète (10 points)
    if (targetProfile.description && targetProfile.description.length > 100) score += 10;
    else if (targetProfile.description && targetProfile.description.length > 50) score += 5;
  }

  return { score, maxScore, percentage: Math.round((score / maxScore) * 100) };
}

// Fonction pour calculer les zones à partir des slugs
function computeZonesFromSlugs(slugs: string[]): string[] {
  const ZONES: { [key: string]: string[] } = {
    "Nord": ["saint-denis", "sainte-marie", "sainte-suzanne"],
    "Sud": ["saint-pierre", "saint-joseph", "saint-philippe"],
    "Est": ["saint-andre", "bras-panon", "sainte-rose", "saint-benoit"],
    "Ouest": ["saint-paul", "le-port", "la-possession", "trois-bassins"],
    "Centre": ["saint-leu", "cilaos", "saint-louis", "entre-deux"]
  };

  const zones: string[] = [];
  for (const slug of slugs) {
    for (const [zone, communes] of Object.entries(ZONES)) {
      if (communes.includes(slug) && !zones.includes(zone)) {
        zones.push(zone);
      }
    }
  }
  return zones;
}

