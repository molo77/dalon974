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

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const userId = session.user.id;

    if (!conversationId) {
      return NextResponse.json({ error: "ID de conversation requis" }, { status: 400 });
    }

    // Extraire les informations de la conversation depuis l'ID
    const parts = conversationId.split('-');
    if (parts.length < 3) {
      return NextResponse.json({ error: "Format d'ID de conversation invalide" }, { status: 400 });
    }

    const annonceId = parts[0];
    const participant1 = parts[1];
    const participant2 = parts[2];

    // Vérifier que l'utilisateur fait partie de cette conversation
    if (userId !== participant1 && userId !== participant2) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Supprimer tous les messages de cette conversation
    const deletedMessages = await prisma.message.deleteMany({
      where: {
        annonceId: annonceId,
        OR: [
          { senderId: participant1, annonceOwnerId: participant2 },
          { senderId: participant2, annonceOwnerId: participant1 }
        ]
      }
    });

    return NextResponse.json({ 
      success: true, 
      deletedCount: deletedMessages.count,
      message: "Conversation supprimée avec succès"
    });
  } catch (error) {
    console.error("[Conversations API] Erreur DELETE:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
