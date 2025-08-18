import { NextResponse } from "next/server";
import prisma from "@/lib/prismaClient";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
  const { id } = await context.params;
  const p = await prisma.colocProfile.findUnique({ where: { id } });
    if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(p);
  } catch (e) {
    console.error("[API][coloc][id][GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = (await getServerSession(authOptions as any)) as Session | null;
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id } = await context.params;
  const p = await prisma.colocProfile.findUnique({ where: { id } });
    if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const isOwner = p.userId && ((session.user as any)?.id ? p.userId === (session.user as any).id : false);
    const isAdmin = (session.user as any)?.role === "admin";
    if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const data: any = { ...body };
    if (typeof data.photos !== "undefined" && !Array.isArray(data.photos)) data.photos = [];
  const updated = await prisma.colocProfile.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("[API][coloc][id][PATCH]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = (await getServerSession(authOptions as any)) as Session | null;
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
