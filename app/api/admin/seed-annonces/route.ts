import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";
import prisma from "@/lib/prismaClient";
import { COMMUNES, SUB_COMMUNES } from "@/lib/communes";

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

  // Liste interne des communes et sous-communes
  const communes = COMMUNES;
  const subCommunes = SUB_COMMUNES;

    const now = new Date();
    const userId = (session?.user as any)?.id || null;
    const pick = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
    // N'utiliser que des assets valides pour éviter les warnings Next/Image
    const images = [
      "/images/annonce-holder.svg",
      "/images/annonce-holder.png",
    ];

    const toCreate: any[] = [];
    if (perCommune && communes.length) {
      // Une annonce par commune principale
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
      // Et une annonce par sous-commune (ville = commune parente)
      for (const sc of subCommunes) {
        toCreate.push({
          id: globalThis.crypto?.randomUUID?.() ?? require("crypto").randomUUID(),
          userId,
          title: `Annonce d’exemple - ${sc.name} (${sc.parent})`,
          description: `Logement d’exemple situé à ${sc.name} (${sc.parent}). Quartier agréable, bien desservi.`,
          imageUrl: pick(images),
          photos: [],
          mainPhotoIdx: 0,
          ville: sc.parent,
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
        // 50% sous-commune, sinon commune principale
        const useSub = subCommunes.length && Math.random() < 0.5;
        if (useSub) {
          const sc = subCommunes[Math.floor(Math.random() * subCommunes.length)];
          toCreate.push({
            id: globalThis.crypto?.randomUUID?.() ?? require("crypto").randomUUID(),
            userId,
            title: `Annonce d’exemple #${i + 1} - ${sc.name} (${sc.parent})`,
            description: `Annonce de démo #${i + 1} située à ${sc.name} (${sc.parent}).`,
            imageUrl: pick(images),
            photos: [],
            mainPhotoIdx: 0,
            ville: sc.parent,
            prix: 500 + Math.floor(Math.random() * 1200),
            surface: 20 + Math.floor(Math.random() * 80),
            nbChambres: 1 + Math.floor(Math.random() * 4),
            equipements: "Wifi, Meublé",
            createdAt: now,
            updatedAt: now,
          });
        } else {
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
