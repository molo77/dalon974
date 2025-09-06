import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/config/auth";
import prisma from "@/infrastructure/database/prismaClient";

// Fonction pour générer un ID de conversation unique
function generateConversationId(annonceId: string, senderId: string, ownerId: string): string {
  // Créer un ID basé sur l'annonce et les participants (toujours dans le même ordre)
  const participants = [senderId, ownerId].sort();
  return `${annonceId}-${participants.join('-')}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams: _searchParams } = new URL(request.url);
    const userId = session.user.id;

    // Récupérer toutes les conversations de l'utilisateur
    const conversations = await prisma.message.findMany({
      where: {
        OR: [
          { annonceOwnerId: userId }, // Messages reçus
          { senderId: userId }        // Messages envoyés
        ]
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Grouper les messages par conversation
    const conversationMap = new Map();
    
    for (const message of conversations) {
      const conversationId = generateConversationId(
        message.annonceId || '',
        message.senderId || '',
        message.annonceOwnerId || ''
      );
      
      if (!conversationMap.has(conversationId)) {
        conversationMap.set(conversationId, {
          id: conversationId,
          annonceId: message.annonceId,
          annonceOwnerId: message.annonceOwnerId,
          senderId: message.senderId,
          senderEmail: message.senderEmail,
          messages: [],
          unreadCount: 0,
          lastMessageAt: message.createdAt,
          lastMessage: message.content
        });
      }
      
      const conversation = conversationMap.get(conversationId);
      conversation.messages.push(message);
      
      // Compter les messages non lus (pour l'utilisateur actuel)
      if (message.annonceOwnerId === userId && !message.isRead) {
        conversation.unreadCount++;
      }
      
      // Mettre à jour le dernier message
      if (message.createdAt > conversation.lastMessageAt) {
        conversation.lastMessageAt = message.createdAt;
        conversation.lastMessage = message.content;
      }
    }

    // Convertir en tableau et trier par date du dernier message
    const conversationList = Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    return NextResponse.json(conversationList);
  } catch (error) {
    console.error("[Conversations API] Erreur GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
