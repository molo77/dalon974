import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { promisify } from "util";
import { exec } from "child_process";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { to, subject, content, from = "noreply@depannage-informatique974.fr" } = await request.json();

    if (!to || !subject || !content) {
      return NextResponse.json({ 
        error: "Paramètres manquants: to, subject et content sont requis" 
      }, { status: 400 });
    }

    console.log(`[Mail API] Envoi d'email à ${to}: ${subject}`);

    // Créer un fichier temporaire avec le contenu de l'email
    const tempFile = join('/tmp', `email-${Date.now()}-${Math.random().toString(36).substring(7)}.txt`);
    
    // Construire le contenu de l'email avec les en-têtes
    const emailData = `From: ${from}
To: ${to}
Subject: ${subject}
Content-Type: text/plain; charset=utf-8

${content}
`;

    try {
      writeFileSync(tempFile, emailData, 'utf8');
      console.log('[Mail API] Fichier temporaire créé:', tempFile);

      // Exécuter notre script shell
      const scriptPath = join(process.cwd(), 'scripts', 'send-email.sh');
      const command = `${scriptPath} "${to}" "${subject}" "${tempFile}"`;
      
      console.log('[Mail API] Commande exécutée:', command);
      
      const { stdout, stderr } = await execAsync(command);
      
      // Nettoyer le fichier temporaire
      unlinkSync(tempFile);
      console.log('[Mail API] Fichier temporaire supprimé');
      
      if (stderr) {
        console.warn('[Mail API] Warning lors de l\'envoi:', stderr);
      }
      
      if (stdout) {
        console.log('[Mail API] Sortie du script:', stdout);
      }
      
      console.log(`[Mail API] Email envoyé avec succès à ${to}`);
      
      return NextResponse.json({ 
        success: true, 
        message: "Email envoyé avec succès",
        to,
        subject
      });
    } catch (emailError) {
      console.error('[Mail API] Erreur envoi email:', emailError);
      
      // Nettoyer le fichier temporaire en cas d'erreur
      try {
        unlinkSync(tempFile);
      } catch (cleanupError) {
        console.error('[Mail API] Erreur lors du nettoyage:', cleanupError);
      }
      
      throw emailError;
    }

  } catch (error) {
    console.error("[Mail API] Erreur:", error);
    return NextResponse.json({ 
      error: "Erreur lors de l'envoi de l'email" 
    }, { status: 500 });
  }
}

