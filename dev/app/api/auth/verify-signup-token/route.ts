import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismaClient";

export async function POST(request: NextRequest) {
  try {
    console.log('[Verify Signup Token] Début de la requête');
    const { token, email } = await request.json();

    if (!token || !email) {
      console.log('[Verify Signup Token] Token ou email manquant');
      return NextResponse.json({ error: "Token et email requis" }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();

    console.log('[Verify Signup Token] Vérification du token pour:', emailLower);

    // Vérifier le token de vérification
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: emailLower,
          token: token,
        },
      },
    });

    if (!verificationToken) {
      console.log('[Verify Signup Token] Token non trouvé');
      return NextResponse.json({ error: "Lien de vérification invalide" }, { status: 400 });
    }

    // Vérifier si le token n'est pas expiré
    if (verificationToken.expires < new Date()) {
      console.log('[Verify Signup Token] Token expiré');
      return NextResponse.json({ error: "Lien de vérification expiré" }, { status: 400 });
    }

    // Récupérer les informations de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: emailLower },
      select: { id: true, email: true, name: true, password: true },
    });

    if (!user) {
      console.log('[Verify Signup Token] Utilisateur non trouvé');
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 400 });
    }

    // Vérifier que l'utilisateur n'a pas encore de mot de passe (inscription en cours)
    if (user.password) {
      console.log('[Verify Signup Token] Utilisateur déjà finalisé');
      return NextResponse.json({ error: "Ce compte a déjà été finalisé" }, { status: 400 });
    }

    console.log('[Verify Signup Token] Token valide pour:', user.email);

    return NextResponse.json({
      success: true,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    console.error("Verify signup token error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
