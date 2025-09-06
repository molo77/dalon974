import { NextResponse } from "next/server";
import prisma from "@/infrastructure/database/prismaClient";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const placementKey = url.searchParams.get("placementKey");
    const where: any = { isActive: true };
    if (placementKey) where.placementKey = placementKey;
    
    const items = await prisma.adUnit.findMany({ where, orderBy: { createdAt: "desc" } });
    return NextResponse.json(items);
  } catch (e) {
    console.error("[API][ads][GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
