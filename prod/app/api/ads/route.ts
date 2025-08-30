import { NextResponse } from "next/server";
import prisma from "@/lib/prismaClient";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const placementKey = url.searchParams.get("placementKey");
    const where: any = { isActive: true };
    if (placementKey) where.placementKey = placementKey;
    const client: any = prisma as any;
    if (!client?.adUnit?.findMany) {
      // Prisma client pas encore généré/migré pour AdUnit -> éviter le crash et renvoyer une liste vide
      console.warn("[API][ads] Prisma client n'expose pas adUnit pour le moment (client non régénéré ou migration manquante)");
      return NextResponse.json([]);
    }
    const items = await client.adUnit.findMany({ where, orderBy: { createdAt: "desc" } });
    return NextResponse.json(items);
  } catch (e) {
    console.error("[API][ads][GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
