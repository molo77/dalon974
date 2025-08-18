import { NextResponse } from "next/server";
import prisma from "@/lib/prismaClient";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
  const { id } = await context.params;
  const a = await prisma.annonce.findUnique({ where: { id } });
    if (!a) return NextResponse.json({ error: "Not found" }, { status: 404 });
    let userEmail: string | null = null;
    if (a.userId) {
      const u = await prisma.user.findUnique({ where: { id: a.userId } });
      userEmail = u?.email || null;
    }
    // Map title -> titre for backward compat
    const payload: any = { ...a, titre: (a as any).title ?? null, userEmail };
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[API][annonces][id][GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
  const session = (await getServerSession(authOptions as any)) as Session | null;
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id } = await context.params;
  const a = await prisma.annonce.findUnique({ where: { id } });
    if (!a) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const isOwner = a.userId && ((session.user as any)?.id ? a.userId === (session.user as any).id : false);
  const isAdmin = (session.user as any)?.role === "admin";
    if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const data: any = { ...body };
    if (typeof data.titre !== "undefined") {
      data.title = data.titre;
      delete data.titre;
    }
  const updated = await prisma.annonce.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("[API][annonces][id][PATCH]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
  const session = (await getServerSession(authOptions as any)) as Session | null;
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const a = await prisma.annonce.findUnique({ where: { id } });
    if (!a) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const isOwner = a.userId && ((session.user as any)?.id ? a.userId === (session.user as any).id : false);
  const isAdmin = (session.user as any)?.role === "admin";
    if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.annonce.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[API][annonces][id][DELETE]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
