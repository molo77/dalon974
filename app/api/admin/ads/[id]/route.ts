import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/authOptions";
import prisma from "@/lib/prismaClient";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = (await getServerSession(authOptions as any)) as Session | null;
    const isAdmin = (session?.user as any)?.role === "admin";
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = params;
    const body = await req.json();
    const client: any = prisma as any;
    if (!client?.adUnit?.update) {
      return NextResponse.json({ error: "AdUnit non disponible: exécutez les migrations Prisma" }, { status: 503 });
    }
    const data: any = { updatedAt: new Date() };
    if (body.name !== undefined) data.name = String(body.name);
    if (body.placementKey !== undefined) data.placementKey = String(body.placementKey);
    if (body.slot !== undefined) data.slot = String(body.slot);
    if (body.format !== undefined) data.format = body.format ? String(body.format) : null;
    if (body.fullWidthResponsive !== undefined) data.fullWidthResponsive = !!body.fullWidthResponsive;
    if (body.height !== undefined) data.height = body.height != null ? Number(body.height) : null;
    if (body.isActive !== undefined) data.isActive = !!body.isActive;
    const updated = await client.adUnit.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("[API][admin][ads][PATCH]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = (await getServerSession(authOptions as any)) as Session | null;
    const isAdmin = (session?.user as any)?.role === "admin";
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = params;
    const client: any = prisma as any;
    if (!client?.adUnit?.delete) {
      return NextResponse.json({ error: "AdUnit non disponible: exécutez les migrations Prisma" }, { status: 503 });
    }
    await client.adUnit.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[API][admin][ads][DELETE]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
