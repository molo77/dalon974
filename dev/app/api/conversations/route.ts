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

    // Récupérer toutes les conversations de l'utilisateur (sauf celles qu'il a supprimées)
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

    // Récupérer les conversations supprimées par l'utilisateur
    const deletedConversations = await prisma.conversationDeletion.findMany({
      where: {
        userId: userId
      },
      select: {
        conversationId: true
      }
    });

    const deletedConversationIds = new Set(deletedConversations.map(d => d.conversationId));

    // Récupérer les utilisateurs bloqués par l'utilisateur actuel
    const blockedUsers = await prisma.userBlock.findMany({
      where: {
        blockerId: userId
      },
      select: {
        blockedId: true
      }
    });

    const blockedUserIds = new Set(blockedUsers.map(b => b.blockedId));

    // Récupérer les informations des utilisateurs impliqués
    const userIds = new Set<string>();
    const annonceIds = new Set<string>();
    
    conversations.forEach(message => {
      if (message.senderId) userIds.add(message.senderId);
      if (message.annonceOwnerId) userIds.add(message.annonceOwnerId);
      if (message.annonceId) annonceIds.add(message.annonceId);
    });

    // Récupérer les informations des utilisateurs
    const users = await prisma.user.findMany({
      where: {
        id: { in: Array.from(userIds) }
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    // Récupérer les informations des annonces
    const annonces = await prisma.annonce.findMany({
      where: {
        id: { in: Array.from(annonceIds) }
      },
      select: {
        id: true,
        title: true,
        prix: true,
        typeBien: true,
        surface: true,
        ville: true,
        userId: true
      }
    });

    // Créer des maps pour un accès rapide
    const userMap = new Map(users.map(user => [user.id, user]));
    const annonceMap = new Map(annonces.map(annonce => [annonce.id, annonce]));

    // Grouper les messages par conversation
    const conversationMap = new Map();
    
    for (const message of conversations) {
      const conversationId = generateConversationId(
        message.annonceId || '',
        message.senderId || '',
        message.annonceOwnerId || ''
      );
      
      // Ignorer les conversations supprimées par l'utilisateur
      if (deletedConversationIds.has(conversationId)) {
        continue;
      }

      // Ignorer les conversations avec des utilisateurs bloqués
      if (blockedUserIds.has(message.senderId || '') || blockedUserIds.has(message.annonceOwnerId || '')) {
        continue;
      }
      
      if (!conversationMap.has(conversationId)) {
        const sender = message.senderId ? userMap.get(message.senderId) : null;
        const annonceOwner = message.annonceOwnerId ? userMap.get(message.annonceOwnerId) : null;
        const annonce = message.annonceId ? annonceMap.get(message.annonceId) : null;

        conversationMap.set(conversationId, {
          id: conversationId,
          annonceId: message.annonceId,
          annonceOwnerId: message.annonceOwnerId,
          annonceOwnerEmail: annonceOwner?.email || message.annonceOwnerId,
          annonceOwnerName: annonceOwner?.name || annonceOwner?.email || message.annonceOwnerId,
          senderId: message.senderId,
          senderEmail: sender?.email || message.senderEmail,
          senderName: sender?.name || sender?.email || message.senderId,
          annonce: annonce ? {
            id: annonce.id,
            titre: annonce.title,
            prix: annonce.prix,
            type: annonce.typeBien,
            surface: annonce.surface,
            ville: annonce.ville
          } : null,
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
    // Format: annonceId-participant1-participant2
    // Les UUIDs contiennent des tirets, donc on doit être plus intelligent
    const parts = conversationId.split('-');
    if (parts.length < 3) {
      return NextResponse.json({ error: "Format d'ID de conversation invalide" }, { status: 400 });
    }

    // L'annonceId est le premier UUID (36 caractères avec tirets)
    // On cherche le premier UUID complet
    let annonceId = '';
    let remaining = conversationId;
    
    // Extraire l'annonceId (premier UUID)
    const firstUuidMatch = remaining.match(/^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/);
    if (!firstUuidMatch) {
      return NextResponse.json({ error: "Format d'ID d'annonce invalide" }, { status: 400 });
    }
    
    annonceId = firstUuidMatch[1];
    remaining = remaining.substring(annonceId.length + 1); // +1 pour le tiret
    
    // Extraire les deux participants (UUIDs)
    const participant1Match = remaining.match(/^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/);
    if (!participant1Match) {
      return NextResponse.json({ error: "Format d'ID de participant 1 invalide" }, { status: 400 });
    }
    
    const participant1 = participant1Match[1];
    remaining = remaining.substring(participant1.length + 1); // +1 pour le tiret
    
    const participant2Match = remaining.match(/^([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/);
    if (!participant2Match) {
      return NextResponse.json({ error: "Format d'ID de participant 2 invalide" }, { status: 400 });
    }
    
    const participant2 = participant2Match[1];

    // Debug: Afficher les informations pour diagnostiquer le problème
    console.log("[Conversations API] Debug DELETE:", {
      conversationId,
      userId,
      participant1,
      participant2,
      isParticipant1: userId === participant1,
      isParticipant2: userId === participant2,
      allParts: parts
    });

    // Vérifier que l'utilisateur fait partie de cette conversation
    // Les participants sont triés par ordre alphabétique dans generateConversationId
    if (userId !== participant1 && userId !== participant2) {
      console.log("[Conversations API] Erreur d'autorisation:", {
        userId,
        participant1,
        participant2,
        reason: "L'utilisateur ne fait pas partie de cette conversation"
      });
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Créer un enregistrement de suppression côté utilisateur (soft delete)
    const deletion = await prisma.conversationDeletion.upsert({
      where: {
        conversationId_userId: {
          conversationId: conversationId,
          userId: userId
        }
      },
      update: {
        deletedAt: new Date()
      },
      create: {
        conversationId: conversationId,
        userId: userId,
        deletedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Conversation supprimée de votre vue",
      deletionId: deletion.id
    });
  } catch (error) {
    console.error("[Conversations API] Erreur DELETE:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
