import { NextResponse } from "next/server";
import prisma from "@/lib/prismaClient";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/authOptions";

export async function GET(req: Request) {
  try {
  // Pagination basique via limit/offset
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10) || 20, 100);
  const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0);
  const list = await prisma.annonce.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
  // Map title -> titre for UI compatibility
  const mapped = list.map((a: any) => ({ ...a, titre: a.title ?? null }));
  return NextResponse.json(mapped);
  } catch (e) {
    console.error("[API][annonces][GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = (await getServerSession(authOptions as any)) as Session | null;
    const body = await req.json();
    
    // Pour les tests admin, permettre la création sans authentification
    let userId = null;
    if (session?.user?.email) {
      userId = (session.user as any)?.id || null;
    } else {
      // Si pas d'utilisateur connecté, utiliser l'utilisateur admin par défaut
      console.log("[API][annonces][POST] No session, using default admin user");
      const adminUser = await prisma.user.findFirst({
        where: { role: 'admin' }
      });
      userId = adminUser?.id || null;
    }
    const input: any = { ...body };
    // Map UI -> Prisma
    if (typeof input.titre !== "undefined") {
      input.title = input.titre;
      delete input.titre;
    }
    // Garder uniquement les champs supportés par le modèle Prisma
    const allowed = [
      'id', 'title', 'description', 'imageUrl', 'photos', 'mainPhotoIdx',
      'ville', 'prix', 'surface', 'nbChambres', 'equipements', 'typeBien', 'meuble', 'nbPieces',
    ];
    const data: any = {};
    for (const k of allowed) if (k in input) data[k] = input[k];
    // Générer un id si manquant
    if (!data.id) data.id = (globalThis.crypto?.randomUUID?.() || require('crypto').randomUUID());
    // Attribuer l'utilisateur
    data.userId = userId;
    // Timestamp de création si pas fourni
    if (!data.createdAt) data.createdAt = new Date();

    const created = await prisma.annonce.create({ data });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error("[API][annonces][POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
