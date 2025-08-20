import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/authOptions";
import prisma from "@/lib/prismaClient";
import { hash } from "bcrypt";

export async function POST(req: Request) {
  try {
    const session = (await getServerSession(authOptions as any)) as Session | null;
    const isAdmin = (session?.user as any)?.role === "admin";
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const email = String(body.email || "").toLowerCase().trim();
    const newPassword = String(body.newPassword || "");
    if (!email || !newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    const passwordHash = await hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: passwordHash } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[API][admin][set-password][POST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
