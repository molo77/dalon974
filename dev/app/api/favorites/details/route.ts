import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/core/auth/auth';
import prisma from '@/infrastructure/database/prismaClient';

// GET /api/favorites/details - Récupérer les favoris avec les détails des annonces/profils
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const itemType = searchParams.get('type'); // 'annonce' ou 'coloc_profile'

    // Récupérer les favoris de l'utilisateur
    const where: any = { userId };
    if (itemType) {
      where.itemType = itemType;
    }

    const favorites = await prisma.favorite.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    // Séparer les favoris par type
    const annonceFavorites = favorites.filter(f => f.itemType === 'annonce');
    const profileFavorites = favorites.filter(f => f.itemType === 'coloc_profile');

    // Récupérer les détails des annonces
    let annoncesDetails: any[] = [];
    if (annonceFavorites.length > 0) {
      const annonceIds = annonceFavorites.map(f => f.itemId);
      annoncesDetails = await prisma.annonce.findMany({
        where: {
          id: { in: annonceIds }
        }
      });
    }

    // Récupérer les détails des profils
    let profilesDetails: any[] = [];
    if (profileFavorites.length > 0) {
      const profileIds = profileFavorites.map(f => f.itemId);
      profilesDetails = await prisma.colocProfile.findMany({
        where: {
          id: { in: profileIds }
        }
      });
    }

    // Combiner les favoris avec leurs détails
    const favoritesWithDetails = [
      ...annoncesDetails.map(annonce => ({
        ...annonce,
        favoriteId: annonceFavorites.find(f => f.itemId === annonce.id)?.id,
        favoriteCreatedAt: annonceFavorites.find(f => f.itemId === annonce.id)?.createdAt,
        itemType: 'annonce' as const
      })),
      ...profilesDetails.map(profile => ({
        ...profile,
        favoriteId: profileFavorites.find(f => f.itemId === profile.id)?.id,
        favoriteCreatedAt: profileFavorites.find(f => f.itemId === profile.id)?.createdAt,
        itemType: 'coloc_profile' as const
      }))
    ].sort((a, b) => 
      new Date(b.favoriteCreatedAt || 0).getTime() - new Date(a.favoriteCreatedAt || 0).getTime()
    );

    return NextResponse.json({ 
      success: true, 
      favorites: favoritesWithDetails,
      count: favoritesWithDetails.length,
      stats: {
        annonces: annoncesDetails.length,
        profiles: profilesDetails.length
      }
    });

  } catch (error) {
    console.error('[Favorites Details API] Erreur lors de la récupération des favoris:', error);
    
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des favoris',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
