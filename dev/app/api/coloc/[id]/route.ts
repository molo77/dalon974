import { NextResponse } from "next/server";
import prisma from "@/lib/prismaClient";
import { auth } from "@/lib/auth";
import type { Session } from "next-auth";


export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
  const { id } = await context.params;
  const p = await prisma.colocProfile.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        title: true,
        nom: true,
        description: true,
        imageUrl: true,
        photos: true,
        mainPhotoIdx: true,
        ville: true,
        budget: true,
        age: true,
        profession: true,
        communesSlugs: true,
        zones: true,
        bioCourte: true,
        genre: true,
        langues: true,
        instagram: true,
        telephone: true,
        dateDispo: true,
        prefGenre: true,
        prefAgeMin: true,
        prefAgeMax: true,
        accepteFumeurs: true,
        accepteAnimaux: true,
        rythme: true,
        proprete: true,
        sportif: true,
        vegetarien: true,
        soirees: true,
        musique: true,
        interets: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const mapped: any = { ...p, nom: p.nom ?? p.title ?? null };
  return NextResponse.json(mapped);
  } catch (e) {
    console.error("[API][coloc][id][GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = (await auth()) as Session | null;
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const body = await req.json();
    const { id } = await context.params;
    
    console.log("[API][coloc][id][PATCH] Début de la mise à jour pour:", id);
    console.log("[API][coloc][id][PATCH] Données reçues:", body);
    
    const p = await prisma.colocProfile.findUnique({ where: { id } });
    if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
    
    const isOwner = p.userId && ((session.user as any)?.id ? p.userId === (session.user as any).id : false);
    const isAdmin = (session.user as any)?.role === "admin";
    if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    
    const data: any = { ...body };
    
    // Gestion des champs JSON
    if (typeof data.photos !== "undefined" && !Array.isArray(data.photos)) data.photos = [];
    if (typeof data.langues !== "undefined" && !Array.isArray(data.langues)) data.langues = [];
    if (typeof data.zones !== "undefined" && !Array.isArray(data.zones)) data.zones = [];
    if (typeof data.communesSlugs !== "undefined" && !Array.isArray(data.communesSlugs)) data.communesSlugs = [];
    if (typeof data.interets !== "undefined" && !Array.isArray(data.interets)) data.interets = [];
    
    // Ajouter updatedAt
    data.updatedAt = new Date();
    
    console.log("[API][coloc][id][PATCH] Données à sauvegarder:", data);
    
    const updated = await prisma.colocProfile.update({ where: { id }, data });
    
    console.log("[API][coloc][id][PATCH] Mise à jour réussie:", updated.id);
    
    return NextResponse.json(updated);
  } catch (e) {
    console.error("[API][coloc][id][PATCH] Erreur:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = (await auth()) as Session | null;
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const p = await prisma.colocProfile.findUnique({ where: { id } });
    if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const isOwner = p.userId && ((session.user as any)?.id ? p.userId === (session.user as any).id : false);
    const isAdmin = (session.user as any)?.role === "admin";
    if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.colocProfile.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[API][coloc][id][DELETE]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
