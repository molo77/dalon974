import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/config/auth";
import prisma from "@/infrastructure/database/prismaClient";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');
    const from = searchParams.get('from');

    const whereClause: any = {};

    if (ownerId) {
      // Messages reçus par l'utilisateur (en tant que propriétaire d'annonce)
      whereClause.annonceOwnerId = ownerId;
    } else if (from) {
      // Messages envoyés par l'utilisateur
      whereClause.senderId = from;
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("[Messages API] Erreur GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      console.log("[Messages API] POST: Non authentifié");
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { annonceId, annonceOwnerId, content, otherParticipantId } = body;
    
    console.log("[Messages API] POST: Données reçues:", { annonceId, annonceOwnerId, content, userId: session.user.id });

    if (!annonceId || !annonceOwnerId || !content) {
      console.log("[Messages API] POST: Données manquantes");
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    if (!content.trim()) {
      console.log("[Messages API] POST: Message vide");
      return NextResponse.json({ error: "Le message ne peut pas être vide" }, { status: 400 });
    }

    // Note: Un propriétaire d'annonce peut répondre aux messages qu'il reçoit
    // Cette vérification est supprimée car elle empêchait les réponses légitimes

    // Générer l'ID de conversation
    // Utiliser l'ID de l'autre participant fourni par le frontend
    const targetOtherParticipantId = otherParticipantId || annonceOwnerId;
    const conversationId = `${annonceId}-${[session.user.id, targetOtherParticipantId].sort().join('-')}`;

    const newMessage = await prisma.message.create({
      data: {
        annonceId,
        annonceOwnerId,
        senderId: session.user.id,
        senderEmail: session.user.email,
        content: content.trim(),
        conversationId,
        isRead: false
      }
    });

    // Restaurer la conversation pour tous les participants (supprimer les enregistrements de suppression)
    await prisma.conversationDeletion.deleteMany({
      where: {
        conversationId: conversationId
      }
    });

    console.log("[Messages API] Message sauvegardé en base:", newMessage);
    console.log("[Messages API] Conversation restaurée pour tous les participants:", conversationId);

    return NextResponse.json({
      success: true,
      message: "Message envoyé avec succès",
      id: newMessage.id
    });
  } catch (error) {
    console.error("[Messages API] Erreur POST:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
