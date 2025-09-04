import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prismaClient";

// Fonction pour générer un ID de conversation unique
function generateConversationId(annonceId: string, senderId: string, ownerId: string): string {
  const participants = [senderId, ownerId].sort();
  return `${annonceId}-${participants.join('-')}`;
}

// Fonction pour parser un ID de conversation
function parseConversationId(conversationId: string) {
  const parts = conversationId.split('-');
  
  // Les deux dernières parties sont toujours les participants (UUIDs de 36 caractères)
  const participant2 = parts[parts.length - 1]; // Dernier élément
  const participant1 = parts[parts.length - 2]; // Avant-dernier élément
  const annonceId = parts.slice(0, -2).join('-'); // Tout le reste est l'annonceId
  
  return { annonceId, participant1, participant2 };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { conversationId } = await params;
    const userId = session.user.id;

    // Extraire les informations de la conversation depuis l'ID
    const { annonceId, participant1, participant2 } = parseConversationId(conversationId);

    // Vérifier que l'utilisateur fait partie de cette conversation
    if (userId !== participant1 && userId !== participant2) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // Récupérer tous les messages de cette conversation
    const messages = await prisma.message.findMany({
      where: {
        annonceId: annonceId,
        OR: [
          {
            AND: [
              { senderId: participant1 },
              { annonceOwnerId: participant2 }
            ]
          },
          {
            AND: [
              { senderId: participant2 },
              { annonceOwnerId: participant1 }
            ]
          }
        ]
      },
      orderBy: {
        createdAt: 'asc' // Ordre chronologique pour l'affichage
      }
    });

    // Marquer tous les messages comme lus pour l'utilisateur actuel
    await prisma.message.updateMany({
      where: {
        id: { in: messages.map(m => m.id) },
        annonceOwnerId: userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("[Conversation API] Erreur GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { conversationId } = await params;
    const { content, parentMessageId } = await request.json();
    const userId = session.user.id;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Le message ne peut pas être vide" }, { status: 400 });
    }

    // Extraire les informations de la conversation depuis l'ID
    const { annonceId, participant1, participant2 } = parseConversationId(conversationId);

    // Vérifier que l'utilisateur fait partie de cette conversation
    if (userId !== participant1 && userId !== participant2) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // Déterminer qui est le destinataire
    const recipientId = userId === participant1 ? participant2 : participant1;

    // Créer le nouveau message
    const newMessage = await prisma.message.create({
      data: {
        annonceId: annonceId,
        annonceOwnerId: recipientId,
        senderId: userId,
        senderEmail: session.user.email,
        content: content.trim(),
        conversationId: conversationId,
        parentMessageId: parentMessageId || null,
        isRead: false
      }
    });

    return NextResponse.json({
      success: true,
      message: "Message envoyé avec succès",
      data: newMessage
    });
  } catch (error) {
    console.error("[Conversation API] Erreur POST:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
