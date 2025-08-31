import { NextResponse } from "next/server";
import prisma from "@/lib/prismaClient";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    // filtres: ville, prixMax(budget), ageMin, ageMax, communesSlugs (CSV)
    const ville = searchParams.get("ville");
    const prixMax = searchParams.get("prixMax");
    const ageMin = searchParams.get("ageMin");
    const ageMax = searchParams.get("ageMax");
    const slugsCsv = searchParams.get("slugs");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10) || 20, 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0);
    const where: any = {};
    if (ville) where.ville = ville;
    if (prixMax) where.budget = { lte: Number(prixMax) };
    if (ageMin) where.age = { ...(where.age || {}), gte: Number(ageMin) };
    if (ageMax) where.age = { ...(where.age || {}), lte: Number(ageMax) };
    
    // Sélection étendue avec fallback minimal si des colonnes n'existent pas encore (P2022)
    let list: any[] = [];
    let hasExtended = true;
    let totalCount = 0;
    
    try {
      // Récupérer le nombre total avec les mêmes filtres
      totalCount = await prisma.colocProfile.count({ where });
      
      list = await prisma.colocProfile.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          userId: true,
          title: true,
          description: true,
          imageUrl: true,
          photos: true,
          mainPhotoIdx: true,
          ville: true,
          budget: true,
          age: true,
          communesSlugs: true,
          zones: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (e: any) {
      // Fallback: colonnes pas (encore) présentes -> sélection minimale compatible
      console.warn("[API][coloc][GET] extended select failed, falling back to minimal select", e?.code || e);
      hasExtended = false;
      
      // Récupérer le nombre total sans filtres complexes
      totalCount = await prisma.colocProfile.count();
      
      list = await prisma.colocProfile.findMany({
        // where vide: on évite de référencer des colonnes manquantes
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          userId: true,
          title: true,
          description: true,
          imageUrl: true,
          photos: true,
          mainPhotoIdx: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }
    
    // communesSlugs array-contains-any (fallback: filtrage en mémoire)
    if (slugsCsv && hasExtended) {
      const want = slugsCsv.split(",").map(s => s.trim()).filter(Boolean);
      if (want.length) {
        list = list.filter((p: any) => {
          const arr = Array.isArray(p.communesSlugs) ? (p.communesSlugs as any[]) : Array.isArray((p as any).communesSlugs?.set) ? (p as any).communesSlugs.set : [];
          // Prisma/JSON peut renvoyer l'array natif; au besoin, normalise
          const sl = Array.isArray(arr) ? arr : [];
          return sl.some(s => want.includes(s));
        });
      }
    }
    
    // compat: pour l'UI, on renvoie quelques alias attendus
    const mapped = list.map((p: any) => ({
      ...p,
      // alias attendu par l'UI
      nom: (p as any).nom ?? p.title ?? null,
    }));
    
    // Retourner les données avec le total
    return NextResponse.json({
      items: mapped,
      total: totalCount,
      limit,
      offset
    });
  } catch (e) {
    console.error("[API][coloc][GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data: any = { ...body };
    if (typeof data.photos !== "undefined" && !Array.isArray(data.photos)) {
      // s'assurer que c'est un tableau côté JSON
      data.photos = Array.isArray(data.photos) ? data.photos : [];
    }
    
    // Générer un id si manquant
    if (!data.id) {
      data.id = (globalThis.crypto?.randomUUID?.() || (await import('crypto')).randomUUID());
    }
    
    // Timestamp de création si pas fourni
    if (!data.createdAt) {
      data.createdAt = new Date();
    }
    
    const created = await prisma.colocProfile.create({ data });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error("[API][coloc][POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
