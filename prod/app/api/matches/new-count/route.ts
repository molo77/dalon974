import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/config/auth";
import prisma from "@/infrastructure/database/prismaClient";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    const userId = session.user.id;
    
    // Récupérer le profil de l'utilisateur
    const userProfile = await prisma.colocProfile.findUnique({
      where: { id: userId }
    });

    if (!userProfile) {
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    // Calculer les nouveaux matchs basés sur la compatibilité
    let newMatchesCount = 0;
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Chercher des profils compatibles
    const compatibleProfiles = await prisma.colocProfile.findMany({
      where: {
        id: { not: userId }, // Exclure l'utilisateur lui-même
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

    return NextResponse.json({ count: newMatchesCount }, { status: 200 });

  } catch (error) {
    console.error("Erreur lors du calcul des nouveaux matchs:", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}

// Fonction pour calculer la compatibilité (profil -> profil)
function calculateCompatibility(userProfile: any, targetProfile: any, isAnnonce: boolean) {
  let score = 0;
  const maxScore = 100;

  // Matching profil -> profil
  // Budget (40 points)
  if (userProfile.budget && targetProfile.budget) {
    const budgetRatio = userProfile.budget / targetProfile.budget;
    if (budgetRatio >= 0.8 && budgetRatio <= 1.2) score += 40;
    else if (budgetRatio >= 0.6 && budgetRatio <= 1.5) score += 30;
    else if (budgetRatio >= 0.4 && budgetRatio <= 2.0) score += 20;
    else score += 10;
  } else {
    score += 20;
  }

  // Zone géographique (30 points)
  if (userProfile.communesSlugs && targetProfile.communesSlugs) {
    const hasZoneMatch = userProfile.communesSlugs.some((slug: string) => 
      targetProfile.communesSlugs.includes(slug)
    );
    if (hasZoneMatch) {
      score += 30;
    } else {
      // Vérifier les zones
      const userZones = computeZonesFromSlugs(userProfile.communesSlugs);
      const targetZones = computeZonesFromSlugs(targetProfile.communesSlugs);
      const hasZoneOverlap = userZones.some((zone: string) => targetZones.includes(zone));
      if (hasZoneOverlap) score += 20;
      else score += 5;
    }
  } else {
    score += 15;
  }

  // Âge et profession (20 points)
  if (userProfile.age && userProfile.profession && targetProfile.age && targetProfile.profession) score += 20;
  else if ((userProfile.age && targetProfile.age) || (userProfile.profession && targetProfile.profession)) score += 10;

  // Description complète (10 points)
  if (userProfile.description && userProfile.description.length > 100 && 
      targetProfile.description && targetProfile.description.length > 100) score += 10;
  else if ((userProfile.description && userProfile.description.length > 50) || 
           (targetProfile.description && targetProfile.description.length > 50)) score += 5;

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

