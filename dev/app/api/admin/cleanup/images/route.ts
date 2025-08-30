import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

// Import du script de nettoyage
const { cleanupUnusedImages } = require('@/scripts/maintenance/cleanup-unused-images');

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { dryRun = false, verbose = false } = body;

    // Simuler les arguments de ligne de commande
    const originalArgv = process.argv;
    const newArgs = ['node', 'script.js'];
    if (dryRun) newArgs.push('--dry-run');
    if (verbose) newArgs.push('--verbose');
    process.argv = newArgs;

    console.log(`🧹 Nettoyage des images demandé par ${session.user?.email} (dryRun: ${dryRun})`);

    // Exécuter le nettoyage
    await cleanupUnusedImages();

    // Restaurer les arguments originaux
    process.argv = originalArgv;

    return NextResponse.json({ 
      success: true, 
      message: 'Nettoyage des images terminé',
      dryRun 
    });

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des images:', error);
    return NextResponse.json({ 
      error: 'Erreur lors du nettoyage des images',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Vérifier l'authentification admin
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 401 });
    }

    // Retourner les informations sur le nettoyage
    return NextResponse.json({
      available: true,
      description: 'Nettoyage automatique des images uploadées inutilisées',
      endpoints: {
        POST: 'Déclencher le nettoyage',
        GET: 'Informations sur le nettoyage'
      },
      options: {
        dryRun: 'boolean - Mode test sans suppression',
        verbose: 'boolean - Affichage détaillé'
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des informations:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des informations'
    }, { status: 500 });
  }
}
