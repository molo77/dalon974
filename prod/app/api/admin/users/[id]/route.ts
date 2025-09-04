import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { Session } from "next-auth";

import prisma from "@/lib/prismaClient";

export async function PATCH(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = (await auth()) as Session | null;
    const isAdmin = (session?.user as any)?.role === "admin";
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await context.params;
    const body = await _req.json();
  const patch: any = {};
  if (body.email !== undefined) patch.email = String(body.email);
  if (body.displayName !== undefined) patch.displayName = String(body.displayName);
  if (body.role !== undefined) patch.role = String(body.role);
    const updated = await prisma.user.update({ where: { id }, data: patch });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("[API][admin][users:id][PATCH]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = (await auth()) as Session | null;
    const isAdmin = (session?.user as any)?.role === "admin";
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await context.params;
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[API][admin][users:id][DELETE]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
