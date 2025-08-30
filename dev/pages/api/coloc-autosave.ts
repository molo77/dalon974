import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../../app/api/auth/[...nextauth]/authOptions";
import prisma from "@/lib/prismaClient";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions as any);
  const userId = (session as any)?.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const body = req.body || {};
  const payload = body.payload;
  if (!payload || typeof payload !== "object") return res.status(400).json({ error: "Invalid payload" });

  try {
    await prisma.colocAutosaveQueue.create({ data: { uid: userId, payload } });
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || String(e) });
  }
}
