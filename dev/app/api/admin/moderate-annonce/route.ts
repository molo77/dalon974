import { NextResponse } from "next/server";
import prisma from "@/infrastructure/database/prismaClient";
import { auth } from "@/config/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    // Vérifier que l'utilisateur est admin
    if (!session?.user || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }
    
    const body = await req.json();
    const { annonceId, action, reason } = body;
    
    if (!annonceId || !action) {
      return NextResponse.json({ error: "ID d'annonce et action requis" }, { status: 400 });
    }
    
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }
    
    // Vérifier que l'annonce existe
    const annonce = await prisma.annonce.findUnique({
      where: { id: annonceId }
    });
    
    if (!annonce) {
      return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
    }
    
    // Préparer les données de mise à jour
    const updateData: any = {
      moderatedBy: session.user.id,
      moderatedAt: new Date()
    };
    
    if (action === 'approve') {
      updateData.moderationStatus = 'approved';
      updateData.moderationReason = null;
    } else if (action === 'reject') {
      updateData.moderationStatus = 'rejected';
      updateData.moderationReason = reason || 'Annonce rejetée par la modération';
    }
    
    // Mettre à jour l'annonce
    const updatedAnnonce = await prisma.annonce.update({
      where: { id: annonceId },
      data: updateData
    });
    
    return NextResponse.json({
      success: true,
      annonce: updatedAnnonce,
      message: action === 'approve' ? 'Annonce approuvée' : 'Annonce rejetée'
    });
    
  } catch (error) {
    console.error("[API][admin][moderate-annonce][POST]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    
    // Vérifier que l'utilisateur est admin
    if (!session?.user || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // pending, approved, rejected
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10) || 20, 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0);
    
    // Construire les conditions de filtrage
    const whereConditions: any = {};
    
    if (status) {
      whereConditions.moderationStatus = status;
    }
    
    // Récupérer les annonces avec les informations de modération
    const annonces = await prisma.annonce.findMany({
      where: whereConditions,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    // Récupérer le nombre total
    const totalCount = await prisma.annonce.count({
      where: whereConditions
    });
    
    // Statistiques de modération
    const stats = await prisma.annonce.groupBy({
      by: ['moderationStatus'],
      _count: {
        moderationStatus: true
      }
    });
    
    const moderationStats = {
      pending: 0,
      approved: 0,
      rejected: 0
    };
    
    stats.forEach(stat => {
      if (stat.moderationStatus) {
        moderationStats[stat.moderationStatus as keyof typeof moderationStats] = stat._count.moderationStatus;
      }
    });
    
    return NextResponse.json({
      annonces,
      total: totalCount,
      stats: moderationStats,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });
    
  } catch (error) {
    console.error("[API][admin][moderate-annonce][GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
