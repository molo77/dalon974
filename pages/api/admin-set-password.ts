import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "firebase-admin";

// Initialisation du SDK Admin si pas déjà fait
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

// Fonction utilitaire pour vérifier le token Firebase et le rôle admin
async function isAdmin(req: NextApiRequest): Promise<boolean> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  const idToken = authHeader.split(" ")[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    // Pour debug, affiche le token et le rôle
    console.log("Decoded UID:", decoded.uid, "Custom claims:", decoded);

    // Vérifie d'abord le custom claim "admin"
    if (decoded.admin === true) return true;

    // Vérifie dans Firestore le champ "role"
    const userDoc = await admin.firestore().doc(`users/${decoded.uid}`).get();
    const role = userDoc.data()?.role;
    console.log("Firestore role:", role);

    // Vérifie toutes les variantes possibles du rôle admin
    return userDoc.exists && ["admin", "superadmin", "Admin"].includes(role);
  } catch (err) {
    console.error("Erreur vérification admin:", err);
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  // Vérification d'authentification admin
  if (!(await isAdmin(req))) {
    return res.status(403).json({ error: "Accès refusé : admin requis" });
  }

  const { userId, newPassword } = req.body;

  if (!userId || !newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
    return res.status(400).json({ error: "Paramètres invalides" });
  }

  try {
    await admin.auth().updateUser(userId, { password: newPassword });
    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Erreur serveur" });
  }
}

