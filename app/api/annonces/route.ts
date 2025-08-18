import { NextResponse } from "next/server";
import prisma from "@/lib/prismaClient";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/authOptions";

export async function GET(req: Request) {
  try {
  // Pagination basique via limit/offset
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10) || 20, 100);
  const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0);
  const list = await prisma.annonce.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
  // Map title -> titre for UI compatibility
  const mapped = list.map((a: any) => ({ ...a, titre: a.title ?? null }));
  return NextResponse.json(mapped);
  } catch (e) {
    console.error("[API][annonces][GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = (await getServerSession(authOptions as any)) as Session | null;
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const userId = (session.user as any)?.id || null;
    const data: any = { ...body };
    if (typeof data.titre !== "undefined") {
      data.title = data.titre;
      delete data.titre;
    }
    const created = await prisma.annonce.create({
      data: {
        ...data,
    userId,
      } as any,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error("[API][annonces][POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
