import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import prisma from "@/lib/prismaClient";
import { hash } from "bcrypt";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any);
  const role = (session as any)?.user?.role;
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, newPassword } = await req.json();
  if (!userId || typeof newPassword !== "string" || newPassword.length < 8) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  // Met à jour le mot de passe hashé dans la table User (credentials only)
  const password = await hash(newPassword, 12);
  try {
    await prisma.user.update({ where: { id: userId }, data: { password } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Erreur serveur" }, { status: 500 });
  }
}
