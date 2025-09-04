import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/config/auth";
import prisma from "@/infrastructure/database/prismaClient";

// Fonction pour parser un ID de conversation
function parseConversationId(conversationId: string) {
  const parts = conversationId.split('-');
  
  // Les UUIDs ont toujours 36 caractères (8-4-4-4-12)
  // On cherche les deux derniers UUIDs complets
  let participant2 = '';
  let participant1 = '';
  let annonceId = '';
  
  // Parcourir depuis la fin pour trouver les UUIDs
  for (let i = parts.length - 1; i >= 0; i--) {
    const _currentPart = parts[i];
    
    // Si on n'a pas encore trouvé participant2, vérifier si c'est un UUID
    if (!participant2) {
      // Vérifier si les 4 dernières parties forment un UUID (8-4-4-4-12)
      if (i >= 4) {
        const potentialUuid = parts.slice(i - 4, i + 1).join('-');
        if (potentialUuid.length === 36) {
          participant2 = potentialUuid;
          i = i - 4; // Skip les parties déjà utilisées
          continue;
        }
      }
    }
    
    // Si on a participant2 mais pas participant1, chercher le suivant
    if (participant2 && !participant1) {
      if (i >= 4) {
        const potentialUuid = parts.slice(i - 4, i + 1).join('-');
        if (potentialUuid.length === 36) {
          participant1 = potentialUuid;
          annonceId = parts.slice(0, i - 4).join('-');
          break;
        }
      }
    }
  }
  
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
    
    console.log('[Conversation API] Debug info:', {
      conversationId,
      userId,
      participant1,
      participant2,
      annonceId,
      isParticipant1: userId === participant1,
      isParticipant2: userId === participant2
    });

    // Vérifier que l'utilisateur fait partie de cette conversation
    if (userId !== participant1 && userId !== participant2) {
      console.log('[Conversation API] Access denied - user not a participant');
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // Récupérer tous les messages de cette conversation
    // Les messages sont stockés avec conversationId, donc on peut les récupérer directement
    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversationId
        // Suppression du filtre annonceId pour récupérer tous les messages de la conversation
      },
      orderBy: {
        createdAt: 'asc' // Ordre chronologique pour l'affichage
      }
    });

    console.log('[Conversation API] Messages found:', messages.length);
    console.log('[Conversation API] Messages details:', messages.map(m => ({
      id: m.id,
      senderId: m.senderId,
      annonceOwnerId: m.annonceOwnerId,
      content: m.content.substring(0, 50) + '...',
      createdAt: m.createdAt
    })));

    // Marquer tous les messages comme lus pour l'utilisateur actuel
    // Un message est "reçu" par l'utilisateur si l'annonceOwnerId correspond à l'utilisateur
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

    console.log('[Conversation API] Messages marked as read for user:', userId);

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
    
    console.log('[Conversation API POST] Debug info:', {
      conversationId,
      userId,
      participant1,
      participant2,
      annonceId,
      isParticipant1: userId === participant1,
      isParticipant2: userId === participant2
    });

    // Vérifier que l'utilisateur fait partie de cette conversation
    if (userId !== participant1 && userId !== participant2) {
      console.log('[Conversation API POST] Access denied - user not a participant');
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
