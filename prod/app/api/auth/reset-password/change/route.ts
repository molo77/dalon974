import { NextRequest, NextResponse } from "next/server";
import prisma from "@/infrastructure/database/prismaClient";
import { hash } from "bcrypt";

export async function POST(request: NextRequest) {
  try {
    const { token, email, password } = await request.json();

    if (!token || !email || !password) {
      return NextResponse.json({ error: "Token, email et mot de passe requis" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Le mot de passe doit contenir au moins 6 caractères" }, { status: 400 });
    }

    // Vérifier si le token existe et n'est pas expiré
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token: token,
        identifier: email,
        expires: {
          gt: new Date(),
        },
      },
    });

    if (!verificationToken) {
      return NextResponse.json({ error: "Token invalide ou expiré" }, { status: 400 });
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await hash(password, 12);

    // Mettre à jour le mot de passe de l'utilisateur
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { password: hashedPassword },
    });

    // Supprimer le token utilisé
    await prisma.verificationToken.delete({
      where: { 
        identifier_token: {
          identifier: email,
          token: token
        }
      },
    });

    return NextResponse.json({ success: true });
  } catch (_error) {
    console.error("Password change error:", _error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
