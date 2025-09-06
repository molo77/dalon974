import { NextRequest, NextResponse } from "next/server";
import prisma from "@/infrastructure/database/prismaClient";
import { randomBytes } from "crypto";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { promisify } from "util";
import { exec } from "child_process";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    console.log('[Signup] Début de la requête');
    const { email, name } = await request.json();

    if (!email || !name) {
      console.log('[Signup] Données manquantes');
      return NextResponse.json({ error: "Email et nom requis" }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();
    const nameTrimmed = name.trim();

    console.log('[Signup] Email reçu:', emailLower);
    console.log('[Signup] Nom reçu:', nameTrimmed);

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({ 
      where: { email: emailLower } 
    });

    if (existingUser) {
      console.log('[Signup] Utilisateur déjà existant:', emailLower);
      return NextResponse.json({ error: "Un compte avec cet email existe déjà" }, { status: 400 });
    }

    // Générer un token de vérification
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures

    console.log('[Signup] Token généré:', token.substring(0, 8) + '...');

    // Supprimer les anciens tokens pour cet email
    await prisma.verificationToken.deleteMany({ 
      where: { identifier: emailLower } 
    });

    // Créer le token de vérification
    await prisma.verificationToken.create({
      data: { 
        identifier: emailLower, 
        token: token, 
        expires: expires 
      },
    });

    console.log('[Signup] Token sauvegardé en base');

    // Créer l'utilisateur avec un statut "pending" (en attente de vérification)
    const user = await prisma.user.create({
      data: {
        email: emailLower,
        name: nameTrimmed,
        role: 'user',
        // Pas de mot de passe pour le moment, il sera défini lors de la vérification
      },
    });

    console.log('[Signup] Utilisateur créé:', user.id);

    // URL de vérification
    const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/verify-signup?token=${token}&email=${encodeURIComponent(emailLower)}`;

    const emailContent = `
      Finalisation de votre inscription - Dalon974
      
      Bonjour ${nameTrimmed},
      
      Merci de vous être inscrit sur Dalon974 !
      
      Pour finaliser votre inscription et définir votre mot de passe, cliquez sur le lien suivant :
      ${verificationUrl}
      
      Ce lien expire dans 24 heures.
      
      Si vous n'avez pas demandé cette inscription, ignorez cet email.
      
      ---
      Cet email a été envoyé automatiquement, merci de ne pas y répondre.
    `.trim();

    console.log('[Signup] Tentative d\'envoi d\'email de vérification');

    try {
      const tempFile = join('/tmp', `signup-verification-${Date.now()}-${Math.random().toString(36).substring(7)}.txt`);
      writeFileSync(tempFile, emailContent, 'utf8');
      console.log('[Signup] Fichier temporaire créé:', tempFile);

      const scriptPath = join(process.cwd(), 'scripts', 'send-email-www-data.sh');
      const command = `${scriptPath} "${emailLower}" "Finalisation de votre inscription - Dalon974" "${tempFile}"`;
      
      console.log('[Signup] Commande exécutée:', command);
      
      const { stdout, stderr } = await execAsync(command);
      
      unlinkSync(tempFile);
      console.log('[Signup] Fichier temporaire supprimé');
      
      if (stderr) { 
        console.warn('[Signup] Warning lors de l\'envoi:', stderr); 
      }
      if (stdout) { 
        console.log('[Signup] Sortie du script:', stdout); 
      }
      
      console.log(`[Signup] Email de vérification envoyé avec succès à ${emailLower}`);
      
      return NextResponse.json({ 
        success: true, 
        message: "Email de vérification envoyé avec succès" 
      });
    } catch (emailError) {
      console.error('[Signup] Erreur envoi email:', emailError);
      console.error('[Signup] Détails de l\'erreur:', JSON.stringify(emailError, null, 2));
      
      // Supprimer l'utilisateur créé en cas d'erreur d'envoi d'email
      try {
        await prisma.user.delete({ where: { id: user.id } });
        await prisma.verificationToken.delete({
          where: { identifier_token: { identifier: emailLower, token: token } }
        });
        console.log('[Signup] Utilisateur et token supprimés après échec');
      } catch (deleteError) {
        console.error('[Signup] Erreur lors de la suppression:', deleteError);
      }
      
      return NextResponse.json({ 
        error: "Erreur lors de l'envoi de l'email de vérification" 
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Signup error:", error);
    console.error("Détails de l'erreur:", JSON.stringify(error, null, 2));
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
