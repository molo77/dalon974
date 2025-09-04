import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import prisma from '@/infrastructure/database/prismaClient';

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

    // Récupérer le run et ses logs
    const run = await prisma.scraperRun.findUnique({
      where: { id: runId },
      select: {
        id: true,
        status: true,
        rawLog: true,
        errorMessage: true,
        startedAt: true,
        finishedAt: true,
        currentStep: true,
        currentMessage: true
      }
    });

    if (!run) {
      return NextResponse.json({ error: 'Run non trouvé' }, { status: 404 });
    }

    // Construire le contenu des logs
    let logs = '';
    
    // Ajouter les informations de base
    logs += `=== RUN SCRAPER ${run.id} ===\n`;
    logs += `Statut: ${run.status || 'inconnu'}\n`;
    logs += `Début: ${run.startedAt ? new Date(run.startedAt).toLocaleString() : 'inconnu'}\n`;
    if (run.finishedAt) {
      logs += `Fin: ${new Date(run.finishedAt).toLocaleString()}\n`;
    }
    if (run.currentStep) {
      logs += `Étape actuelle: ${run.currentStep}\n`;
    }
    if (run.currentMessage) {
      logs += `Message: ${run.currentMessage}\n`;
    }
    logs += '\n';

    // Ajouter les logs bruts
    if (run.rawLog) {
      logs += run.rawLog;
    }

    // Ajouter le message d'erreur si présent
    if (run.errorMessage) {
      logs += `\n\n=== ERREUR ===\n${run.errorMessage}`;
    }

    // Si le run est en cours et qu'il n'y a pas de logs, afficher un message
    if (run.status === 'running' && !run.rawLog) {
      logs += '\n\n=== LOGS EN COURS ===\nLe scraper est en cours d\'exécution...\nLes logs apparaîtront ici en temps réel.';
    }

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
