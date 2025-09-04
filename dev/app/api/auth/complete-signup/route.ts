import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismaClient";
import { hash } from "bcrypt";

export async function POST(request: NextRequest) {
  try {
    console.log('[Complete Signup] Début de la requête');
    const { token, email, password } = await request.json();

    if (!token || !email || !password) {
      console.log('[Complete Signup] Données manquantes');
      return NextResponse.json({ error: "Token, email et mot de passe requis" }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();

    console.log('[Complete Signup] Finalisation pour:', emailLower);

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
      console.log('[Complete Signup] Token non trouvé');
      return NextResponse.json({ error: "Lien de vérification invalide" }, { status: 400 });
    }

    // Vérifier si le token n'est pas expiré
    if (verificationToken.expires < new Date()) {
      console.log('[Complete Signup] Token expiré');
      return NextResponse.json({ error: "Lien de vérification expiré" }, { status: 400 });
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (!user) {
      console.log('[Complete Signup] Utilisateur non trouvé');
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 400 });
    }

    // Vérifier que l'utilisateur n'a pas encore de mot de passe
    if (user.password) {
      console.log('[Complete Signup] Utilisateur déjà finalisé');
      return NextResponse.json({ error: "Ce compte a déjà été finalisé" }, { status: 400 });
    }

    // Hasher le mot de passe
    const hashedPassword = await hash(password, 12);
    console.log('[Complete Signup] Mot de passe hashé');

    // Mettre à jour l'utilisateur avec le mot de passe
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    console.log('[Complete Signup] Utilisateur mis à jour avec le mot de passe');

    // Supprimer le token de vérification
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: emailLower,
          token: token,
        },
      },
    });

    console.log('[Complete Signup] Token de vérification supprimé');
    console.log('[Complete Signup] Inscription finalisée avec succès pour:', emailLower);

    return NextResponse.json({
      success: true,
      message: "Inscription finalisée avec succès",
    });
  } catch (error) {
    console.error("Complete signup error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
