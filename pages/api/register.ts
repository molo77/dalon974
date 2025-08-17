import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prismaClient";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }
  const { email, displayName, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis" });
  }
  // Vérifier si l'utilisateur existe déjà
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Un compte existe déjà avec cet email." });
  }
  // Hash du mot de passe (exemple simple, à remplacer par bcrypt en prod)
  const hash = Buffer.from(password).toString("base64");
  const user = await prisma.user.create({
    data: {
      email,
      displayName: displayName || "",
      password: hash,
      role: "user",
      providerId: "local",
      createdAt: new Date(),
    },
  });
  return res.status(201).json({ id: user.id, email: user.email, displayName: user.displayName });
}
