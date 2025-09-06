import { NextResponse } from "next/server";
import prisma from "@/infrastructure/database/prismaClient";
import { auth } from "@/config/auth";

export async function GET(_req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'utilisateur connecté
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Récupérer les annonces de l'utilisateur
    const annonces = await prisma.annonce.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    });

    // Map title -> titre for UI compatibility
    const mapped = annonces.map((a: any) => ({ 
      ...a, 
      titre: a.title || a.titre || null,
      userId: a.userId || null
    }));

    return NextResponse.json({ 
      items: mapped,
      total: mapped.length,
      userId: user.id
    });

  } catch (error) {
    console.error("[API][annonces][user][GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
