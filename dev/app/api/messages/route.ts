import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prismaClient";

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
    const { annonceId, annonceOwnerId, content } = body;
    
    console.log("[Messages API] POST: Données reçues:", { annonceId, annonceOwnerId, content, userId: session.user.id });

    if (!annonceId || !annonceOwnerId || !content) {
      console.log("[Messages API] POST: Données manquantes");
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    if (!content.trim()) {
      console.log("[Messages API] POST: Message vide");
      return NextResponse.json({ error: "Le message ne peut pas être vide" }, { status: 400 });
    }

    // Vérifier que l'utilisateur n'envoie pas un message à lui-même
    if (session.user.id === annonceOwnerId) {
      console.log("[Messages API] POST: Tentative d'envoi à soi-même");
      return NextResponse.json({ error: "Vous ne pouvez pas vous envoyer un message à vous-même" }, { status: 400 });
    }

    // Générer l'ID de conversation
    const conversationId = `${annonceId}-${[session.user.id, annonceOwnerId].sort().join('-')}`;

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

    console.log("[Messages API] Message sauvegardé en base:", newMessage);

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
