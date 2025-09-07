import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/config/auth";
import prisma from "@/infrastructure/database/prismaClient";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { blockedId, reason } = await request.json();
    const blockerId = session.user.id;

    if (!blockerId) {
      return NextResponse.json({ error: "ID de l'utilisateur non trouvé" }, { status: 400 });
    }

    if (!blockedId) {
      return NextResponse.json({ error: "ID de l'utilisateur à bloquer requis" }, { status: 400 });
    }

    if (blockerId === blockedId) {
      return NextResponse.json({ error: "Vous ne pouvez pas vous bloquer vous-même" }, { status: 400 });
    }

    // Vérifier si l'utilisateur existe
    const userToBlock = await prisma.user.findUnique({
      where: { id: blockedId },
      select: { id: true, email: true }
    });

    if (!userToBlock) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Créer le blocage
    const block = await prisma.userBlock.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: blockerId,
          blockedId: blockedId
        }
      },
      update: {
        reason: reason,
        blockedAt: new Date()
      },
      create: {
        blockerId: blockerId,
        blockedId: blockedId,
        reason: reason
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Utilisateur bloqué avec succès",
      blockId: block.id
    });
  } catch (error) {
    console.error("[User Block API] Erreur POST:", error);
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
    const blockedId = searchParams.get('blockedId');
    const blockerId = session.user.id;

    if (!blockedId) {
      return NextResponse.json({ error: "ID de l'utilisateur à débloquer requis" }, { status: 400 });
    }

    // Supprimer le blocage
    const deletedBlock = await prisma.userBlock.deleteMany({
      where: {
        blockerId: blockerId,
        blockedId: blockedId
      }
    });

    if (deletedBlock.count === 0) {
      return NextResponse.json({ error: "Blocage non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Utilisateur débloqué avec succès"
    });
  } catch (error) {
    console.error("[User Block API] Erreur DELETE:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = session.user.id;

    // Récupérer la liste des utilisateurs bloqués
    const blockedUsers = await prisma.userBlock.findMany({
      where: {
        blockerId: userId
      },
      include: {
        blocked: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        blockedAt: 'desc'
      }
    });

    return NextResponse.json(blockedUsers);
  } catch (error) {
    console.error("[User Block API] Erreur GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
