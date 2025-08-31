import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prismaClient';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérifier l'authentification admin
    const session: any = await auth();
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id: runId } = await params;

    // Récupérer le run et ses logs (ScraperRun supprimé du schéma)
    const run = null; // ScraperRun supprimé du schéma

    if (!run) {
      return NextResponse.json({ error: 'Run non trouvé' }, { status: 404 });
    }

    // Construire le contenu des logs (ScraperRun supprimé du schéma)
    let logs = '=== RUN SCRAPER ===\n';
    logs += 'Le modèle ScraperRun a été supprimé du schéma de base de données.\n';
    logs += 'Cette fonctionnalité n\'est plus disponible.\n';

    return new NextResponse(logs, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('[API][scraper][logs] Error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
