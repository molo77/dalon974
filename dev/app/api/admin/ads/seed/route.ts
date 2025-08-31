import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { Session } from "next-auth";
import prisma from "@/lib/prismaClient";

export async function POST() {
  try {
    const session = await auth();
    const isAdmin = (session?.user as any)?.role === "admin";
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const client: any = prisma as any;
    if (!client?.adUnit?.upsert) {
      return NextResponse.json({ error: "AdUnit non disponible: exécutez les migrations Prisma" }, { status: 503 });
    }

    const slot = process.env.NEXT_PUBLIC_ADSENSE_SLOT || "0000000000";

    const a = await client.adUnit.upsert({
      where: { id: "seed-home-below-hero" },
      update: {},
      create: {
        id: "seed-home-below-hero",
        name: "Home dessous image",
        placementKey: "home.initial.belowHero",
        slot,
        format: "auto",
        fullWidthResponsive: true,
        height: 90,
        isActive: true,
      },
    });

    const b = await client.adUnit.upsert({
      where: { id: "seed-listing-inline-1" },
      update: {},
      create: {
        id: "seed-listing-inline-1",
        name: "Listing inline #1",
        placementKey: "listing.inline.1",
        slot,
        format: "auto",
        fullWidthResponsive: true,
        height: 90,
        isActive: true,
      },
    });

    const c = await client.adUnit.upsert({
      where: { id: "seed-home-right-sidebar" },
      update: {},
      create: {
        id: "seed-home-right-sidebar",
        name: "Home droite (sidebar)",
        placementKey: "home.list.rightSidebar",
        slot,
        format: "auto",
        fullWidthResponsive: true,
        height: 600,
        isActive: true,
      },
    });

    return NextResponse.json({ createdOrEnsured: [a, b, c].map((x) => ({ id: x.id, placementKey: x.placementKey })) });
  } catch (e) {
    console.error("[API][admin][ads][seed][POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
