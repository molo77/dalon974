import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";
import prisma from "@/lib/prismaClient";
import fs from "fs";
import path from "path";

type SeedBody = {
  perCommune?: boolean;
  count?: number;
};

export async function POST(req: Request) {
  try {
    const session = (await getServerSession(authOptions as any)) as Session | null;
    const isAdmin = (session?.user as any)?.role === "admin";
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = (await req.json().catch(() => ({}))) as SeedBody;
    const perCommune = !!body.perCommune;
    const max = Math.min(Math.max(body.count ?? 0, 0), 200);

    // Charger la liste des communes depuis public/data
    let communes: string[] = [];
    try {
      const filePath = path.join(process.cwd(), "public", "data", "reunion-communes.json");
      const raw = fs.readFileSync(filePath, "utf8");
      const arr = JSON.parse(raw);
      communes = Array.isArray(arr) ? arr.map((c: any) => c?.nom || c?.name || c).filter(Boolean) : [];
    } catch {
      communes = [];
    }

    const now = new Date();
    const userId = (session?.user as any)?.id || null;
    const pick = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
    const images = [
      "/images/annonce-placeholder.png",
      "/images/annonce-placeholder.jpg",
      "/images/annonce-holder.png",
    ];

    const toCreate: any[] = [];
    if (perCommune && communes.length) {
      for (const commune of communes) {
        toCreate.push({
          id: globalThis.crypto?.randomUUID?.() ?? require("crypto").randomUUID(),
          userId,
          title: `Annonce d’exemple - ${commune}`,
          description: `Logement d’exemple à ${commune}. Ceci est une annonce de démonstration.`,
          imageUrl: pick(images),
          photos: [],
          mainPhotoIdx: 0,
          ville: commune,
          prix: 500 + Math.floor(Math.random() * 1200),
          surface: 20 + Math.floor(Math.random() * 80),
          nbChambres: 1 + Math.floor(Math.random() * 4),
          equipements: "Wifi, Meublé",
          createdAt: now,
          updatedAt: now,
        });
      }
    } else {
      const n = max || 10;
      const baseCommunes = communes.length ? communes : ["Saint-Denis", "Saint-Paul", "Le Tampon", "Saint-Pierre"];
      for (let i = 0; i < n; i++) {
        const commune = pick(baseCommunes);
        toCreate.push({
          id: globalThis.crypto?.randomUUID?.() ?? require("crypto").randomUUID(),
          userId,
          title: `Annonce d’exemple #${i + 1} - ${commune}`,
          description: `Annonce de démo #${i + 1} située à ${commune}.`,
          imageUrl: pick(images),
          photos: [],
          mainPhotoIdx: 0,
          ville: commune,
          prix: 500 + Math.floor(Math.random() * 1200),
          surface: 20 + Math.floor(Math.random() * 80),
          nbChambres: 1 + Math.floor(Math.random() * 4),
          equipements: "Wifi, Meublé",
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    if (!toCreate.length) return NextResponse.json({ created: 0 });
    const chunks = (arr: any[], size = 100) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));
    let created = 0;
    for (const batch of chunks(toCreate, 100)) {
      const res = await prisma.annonce.createMany({ data: batch, skipDuplicates: true });
      created += res.count;
    }
    return NextResponse.json({ created });
  } catch (e) {
    console.error("[API][admin][seed-annonces]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
