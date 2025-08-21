import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";
import prisma from "@/lib/prismaClient";

export async function GET() {
  try {
    const session = (await getServerSession(authOptions as any)) as Session | null;
    const isAdmin = (session?.user as any)?.role === "admin";
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const client: any = prisma as any;
    if (!client?.adUnit?.findMany) {
      return NextResponse.json([]);
    }
    const items = await client.adUnit.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(items);
  } catch (e) {
    console.error("[API][admin][ads][GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = (await getServerSession(authOptions as any)) as Session | null;
    const isAdmin = (session?.user as any)?.role === "admin";
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await req.json();
    const client: any = prisma as any;
    if (!client?.adUnit?.create) {
      return NextResponse.json({ error: "AdUnit non disponible: exécutez les migrations Prisma" }, { status: 503 });
    }
    const data: any = {
      name: String(body.name || "Untitled"),
      placementKey: String(body.placementKey || "default"),
      slot: String(body.slot || ""),
      format: body.format ? String(body.format) : null,
      fullWidthResponsive: typeof body.fullWidthResponsive === "boolean" ? body.fullWidthResponsive : true,
      height: body.height != null ? Number(body.height) : null,
      isActive: typeof body.isActive === "boolean" ? body.isActive : true,
    };
    const created = await client.adUnit.create({ data });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error("[API][admin][ads][POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
