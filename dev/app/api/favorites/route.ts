import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/core/auth/auth';
import prisma from '@/infrastructure/database/prismaClient';

// GET /api/favorites - Récupérer les favoris de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const itemType = searchParams.get('type'); // 'annonce' ou 'coloc_profile'

    // Construire les conditions de filtrage
    const where: any = { userId };
    if (itemType) {
      where.itemType = itemType;
    }

    const favorites = await prisma.favorite.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        // On pourrait inclure les données de l'annonce/profil ici si nécessaire
      }
    });

    return NextResponse.json({ 
      success: true, 
      favorites,
      count: favorites.length 
    });

  } catch (error) {
    console.error('[Favorites API] Erreur lors de la récupération des favoris:', error);
    
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des favoris',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

// POST /api/favorites - Ajouter un favori
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = session.user.id;
    const { itemId, itemType } = await request.json();

    if (!itemId || !itemType) {
      return NextResponse.json({ 
        error: 'itemId et itemType sont requis' 
      }, { status: 400 });
    }

    if (!['annonce', 'coloc_profile'].includes(itemType)) {
      return NextResponse.json({ 
        error: 'itemType doit être "annonce" ou "coloc_profile"' 
      }, { status: 400 });
    }

    // Vérifier si l'élément existe déjà dans les favoris
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_itemId_itemType: {
          userId,
          itemId,
          itemType
        }
      }
    });

    if (existingFavorite) {
      return NextResponse.json({ 
        error: 'Cet élément est déjà dans vos favoris' 
      }, { status: 409 });
    }

    // Créer le favori
    const favorite = await prisma.favorite.create({
      data: {
        userId,
        itemId,
        itemType
      }
    });

    return NextResponse.json({ 
      success: true, 
      favorite,
      message: 'Ajouté aux favoris avec succès' 
    });

  } catch (error) {
    console.error('[Favorites API] Erreur lors de l\'ajout du favori:', error);
    
    return NextResponse.json({ 
      error: 'Erreur lors de l\'ajout du favori',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

// DELETE /api/favorites - Supprimer un favori
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const itemType = searchParams.get('itemType');

    if (!itemId || !itemType) {
      return NextResponse.json({ 
        error: 'itemId et itemType sont requis' 
      }, { status: 400 });
    }

    // Supprimer le favori
    const deletedFavorite = await prisma.favorite.deleteMany({
      where: {
        userId,
        itemId,
        itemType
      }
    });

    if (deletedFavorite.count === 0) {
      return NextResponse.json({ 
        error: 'Favori non trouvé' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Supprimé des favoris avec succès' 
    });

  } catch (error) {
    console.error('[Favorites API] Erreur lors de la suppression du favori:', error);
    
    return NextResponse.json({ 
      error: 'Erreur lors de la suppression du favori',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
