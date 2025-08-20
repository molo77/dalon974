import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";
import prisma from "@/lib/prismaClient";
import { COMMUNES, SUB_COMMUNES, slugify, computeZonesFromSlugs } from "@/lib/communes";

type SeedBody = {
  count?: number;
};

export async function POST(req: Request) {
  try {
    const session = (await getServerSession(authOptions as any)) as Session | null;
    const isAdmin = (session?.user as any)?.role === "admin";
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = (await req.json().catch(() => ({}))) as SeedBody;
    const n = Math.min(Math.max(body.count ?? 10, 1), 200);

    const now = new Date();
    const userId = (session?.user as any)?.id || null;
    const pick = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

  const prenoms = ["Alex", "Marie", "Lucas", "Emma", "Tom", "Chloé", "Noah", "Léa"]; 
  const villes = COMMUNES; 
    const jobs = ["Étudiant(e)", "Développeur", "Infirmier(ère)", "Commercial(e)", "Artisan", "Enseignant(e)"];

    const toCreate: any[] = [];
    for (let i = 0; i < n; i++) {
      const nom = `${pick(prenoms)} ${Math.floor(18 + Math.random() * 20)}`;
      // 60% des cas: utiliser une sous-commune, sinon la commune principale
      const useSub = SUB_COMMUNES.length && Math.random() < 0.6;
      const sc = useSub ? SUB_COMMUNES[Math.floor(Math.random() * SUB_COMMUNES.length)] : null;
      const ville = sc ? sc.parent : pick(villes);
      const subLabel = sc ? ` (${sc.name})` : "";
      const slug = slugify(ville);
      const communesSlugs = [slug];
      const zones = computeZonesFromSlugs(communesSlugs);
      const budget = 400 + Math.floor(Math.random() * 800);
      toCreate.push({
        id: globalThis.crypto?.randomUUID?.() ?? require("crypto").randomUUID(),
        userId,
        title: nom,
        description: `Je cherche une colocation à ${ville}${subLabel}. Budget environ ${budget} €.`,
  imageUrl: "/images/coloc-holder.svg",
        photos: [],
        mainPhotoIdx: 0,
        // champs additionnels si présents dans le schéma
        ville,
        budget,
        communesSlugs,
        zones,
        createdAt: now,
        updatedAt: now,
      });
    }

    const chunks = (arr: any[], size = 50) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));
    let created = 0;
    for (const batch of chunks(toCreate, 100)) {
      const res = await prisma.colocProfile.createMany({ data: batch, skipDuplicates: true });
      created += res.count;
    }
    return NextResponse.json({ created });
  } catch (e) {
    console.error("[API][admin][seed-colocs]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
