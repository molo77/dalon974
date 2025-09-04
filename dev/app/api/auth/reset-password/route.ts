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
    console.log('[Password Reset] Début de la requête');
    const { email } = await request.json();

    if (!email) {
      console.log('[Password Reset] Email manquant');
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    console.log('[Password Reset] Email reçu:', email);

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      console.log('[Password Reset] Utilisateur non trouvé:', email);
      // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
      return NextResponse.json({ success: true, message: "Si cet email existe, un lien de réinitialisation a été envoyé" });
    }

    console.log('[Password Reset] Utilisateur trouvé:', user.id);

    // Générer un token unique
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    console.log('[Password Reset] Token généré:', token.substring(0, 8) + '...');

    // Supprimer les anciens tokens pour cet utilisateur
    await prisma.verificationToken.deleteMany({
      where: { identifier: email.toLowerCase() }
    });

    // Créer un nouveau token
    await prisma.verificationToken.create({
      data: {
        identifier: email.toLowerCase(),
        token: token,
        expires: expires,
      },
    });

    console.log('[Password Reset] Token sauvegardé en base');

    // Construire l'URL de réinitialisation
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/reset-password/verify?token=${token}&email=${encodeURIComponent(email)}`;

    // Contenu de l'email
    const emailContent = `
Réinitialisation de votre mot de passe - Dalon974

Bonjour,

Vous avez demandé la réinitialisation de votre mot de passe sur Dalon974.

Cliquez sur le lien suivant pour définir un nouveau mot de passe :
${resetUrl}

Ce lien expire dans 1 heure.

Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.

---
Cet email a été envoyé automatiquement, merci de ne pas y répondre.
    `.trim();

    console.log('[Password Reset] Tentative d\'envoi d\'email via script www-data');

    // Envoyer l'email via notre script shell corrigé pour www-data
    try {
      // Créer un fichier temporaire avec le contenu de l'email
      const tempFile = join('/tmp', `reset-password-${Date.now()}-${Math.random().toString(36).substring(7)}.txt`);
      writeFileSync(tempFile, emailContent, 'utf8');
      console.log('[Password Reset] Fichier temporaire créé:', tempFile);

      // Exécuter notre script shell corrigé pour www-data
      const scriptPath = join(process.cwd(), 'scripts', 'send-email-www-data.sh');
      const command = `${scriptPath} "${email}" "Réinitialisation de votre mot de passe - Dalon974" "${tempFile}"`;
      
      console.log('[Password Reset] Commande exécutée:', command);
      
      const { stdout, stderr } = await execAsync(command);
      
      // Nettoyer le fichier temporaire
      unlinkSync(tempFile);
      console.log('[Password Reset] Fichier temporaire supprimé');
      
      if (stderr) {
        console.warn('[Password Reset] Warning lors de l\'envoi:', stderr);
      }
      
      if (stdout) {
        console.log('[Password Reset] Sortie du script:', stdout);
      }
      
      console.log(`[Password Reset] Email envoyé avec succès à ${email}`);
      
      return NextResponse.json({ 
        success: true, 
        message: "Email de réinitialisation envoyé avec succès"
      });
    } catch (emailError) {
      console.error('[Password Reset] Erreur envoi email:', emailError);
      console.error('[Password Reset] Détails de l\'erreur:', JSON.stringify(emailError, null, 2));
      
      // En cas d'échec d'envoi, supprimer le token créé
      try {
        await prisma.verificationToken.delete({
          where: { 
            identifier_token: {
              identifier: email.toLowerCase(),
              token: token
            }
          }
        });
        console.log('[Password Reset] Token supprimé après échec');
      } catch (deleteError) {
        console.error('[Password Reset] Erreur lors de la suppression du token:', deleteError);
      }
      
      return NextResponse.json({ 
        error: "Erreur lors de l'envoi de l'email de réinitialisation" 
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Password reset error:", error);
    console.error("Détails de l'erreur:", JSON.stringify(error, null, 2));
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
