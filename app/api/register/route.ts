import prisma from "@/lib/prismaClient";
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcrypt";

export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName } = await req.json();
    const normEmail = (email || "").toLowerCase().trim();
    if (!normEmail || !password || password.length < 8) {
      return NextResponse.json({ error: "Email ou mot de passe invalide." }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email: normEmail } });
    if (existing) {
      return NextResponse.json({ error: "Un compte avec cet email existe déjà." }, { status: 400 });
    }
    const passwordHash = await hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: normEmail,
        password: passwordHash,
        name: displayName || null,
        role: "user",
      },
      select: { id: true, email: true },
    });
    return NextResponse.json({ ok: true, id: user.id });
  } catch {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
