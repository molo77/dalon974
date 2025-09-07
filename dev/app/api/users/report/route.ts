import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/config/auth";
import prisma from "@/infrastructure/database/prismaClient";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { reportedId, reason, description } = await request.json();
    const reporterId = session.user.id;

    if (!reporterId) {
      return NextResponse.json({ error: "ID de l'utilisateur non trouvé" }, { status: 400 });
    }

    if (!reportedId || !reason) {
      return NextResponse.json({ error: "ID de l'utilisateur et raison du signalement requis" }, { status: 400 });
    }

    if (reporterId === reportedId) {
      return NextResponse.json({ error: "Vous ne pouvez pas vous signaler vous-même" }, { status: 400 });
    }

    // Vérifier si l'utilisateur existe
    const userToReport = await prisma.user.findUnique({
      where: { id: reportedId },
      select: { id: true, email: true }
    });

    if (!userToReport) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Vérifier si l'utilisateur a déjà signalé cette personne
    const existingReport = await prisma.userReport.findFirst({
      where: {
        reporterId: reporterId,
        reportedId: reportedId,
        status: "pending"
      }
    });

    if (existingReport) {
      return NextResponse.json({ error: "Vous avez déjà signalé cet utilisateur" }, { status: 400 });
    }

    // Créer le signalement
    const report = await prisma.userReport.create({
      data: {
        reporterId: reporterId,
        reportedId: reportedId,
        reason: reason,
        description: description
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Signalement envoyé avec succès",
      reportId: report.id
    });
  } catch (error) {
    console.error("[User Report API] Erreur POST:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = session.user as any;
    
    // Seuls les admins peuvent voir tous les signalements
    if (user.role !== 'admin') {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Récupérer les signalements
    const reports = await prisma.userReport.findMany({
      where: {
        status: status
      },
      include: {
        reporter: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true
          }
        },
        reported: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: limit
    });

    // Compter le total
    const total = await prisma.userReport.count({
      where: {
        status: status
      }
    });

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("[User Report API] Erreur GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
