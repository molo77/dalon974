import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "firebase-admin";

// Initialize Admin SDK if needed
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

async function verifyToken(req: NextApiRequest) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const idToken = authHeader.split(" ")[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded;
  } catch (e) {
    console.error("verifyToken failed", e);
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const decoded = await verifyToken(req);
  if (!decoded || !decoded.uid) return res.status(401).json({ error: "Unauthorized" });

  const body = req.body || {};
  const payload = body.payload;
  if (!payload || typeof payload !== "object") return res.status(400).json({ error: "Invalid payload" });

  try {
    const db = admin.firestore();
    // Write a staging document into a queue collection
    await db.collection("colocAutosaveQueue").add({
      uid: decoded.uid,
      payload,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("coloc-autosave error", e);
    return res.status(500).json({ error: e.message || String(e) });
  }
}
