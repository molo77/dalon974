import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/config/auth";
import prisma from "@/infrastructure/database/prismaClient";

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = session.user as any;
    
    // Seuls les admins peuvent traiter les signalements
    if (user.role !== 'admin') {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const { reportId, status, reviewNotes } = await request.json();

    if (!reportId || !status) {
      return NextResponse.json({ error: "ID du signalement et statut requis" }, { status: 400 });
    }

    const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    // Mettre à jour le signalement
    const updatedReport = await prisma.userReport.update({
      where: {
        id: reportId
      },
      data: {
        status: status,
        reviewedAt: new Date(),
        reviewedBy: user.id,
        reviewNotes: reviewNotes
      },
      include: {
        reporter: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        reported: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Signalement mis à jour avec succès",
      report: updatedReport
    });
  } catch (error) {
    console.error("[Admin Reports API] Erreur PUT:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = session.user as any;
    
    // Seuls les admins peuvent supprimer les signalements
    if (user.role !== 'admin') {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');

    if (!reportId) {
      return NextResponse.json({ error: "ID du signalement requis" }, { status: 400 });
    }

    // Supprimer le signalement
    await prisma.userReport.delete({
      where: {
        id: reportId
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Signalement supprimé avec succès"
    });
  } catch (error) {
    console.error("[Admin Reports API] Erreur DELETE:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
