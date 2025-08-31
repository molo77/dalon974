import { NextResponse } from "next/server";
import prisma from "@/lib/prismaClient";
import { auth } from "@/lib/auth";
import type { Session } from "next-auth";


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ownerId = searchParams.get("ownerId");
    const from = searchParams.get("from");
    const where: any = {};
    if (ownerId) where.annonceOwnerId = ownerId;
    if (from) where.senderId = from;
    const list = await prisma.message.findMany({ where, orderBy: { createdAt: "desc" } });
    return NextResponse.json(list);
  } catch (e) {
    console.error("[API][messages][GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = (await auth()) as Session | null;
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { annonceId, annonceOwnerId, content } = await req.json();
    if (!annonceId || !content) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    // Resolve recipient (owner) if not provided
    let toUserId: string | null = annonceOwnerId || null;
    if (!toUserId) {
      const a = await prisma.annonce.findUnique({ where: { id: String(annonceId) } });
      toUserId = a?.userId ?? null;
    }

    // Resolve senderId: prefer session.user.id if present, else find by email
    let senderId: string | null = (session.user as any)?.id || null;
    if (!senderId && session.user.email) {
      const u = await prisma.user.findUnique({ where: { email: session.user.email } });
      senderId = u?.id ?? null;
    }

    const msg = await prisma.message.create({
      data: {
        annonceId,
        annonceOwnerId: toUserId,
        senderId,
        senderEmail: session.user.email!,
        content: String(content),
      },
    });
    return NextResponse.json({ id: msg.id }, { status: 201 });
  } catch (e) {
    console.error("[API][messages][POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
