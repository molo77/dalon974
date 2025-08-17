// lib/firestore.ts

import prisma from "@/lib/prismaClient";

export type Annonce = {
  id: string;
  titre: string;
  ville: string;
  prix: number;
  imageUrl?: string;
};

export async function getAnnonces(): Promise<Annonce[]> {
  const annonces = await prisma.annonce.findMany({
    orderBy: { createdAt: "desc" },
  });
  return annonces.map((a: any) => ({
    id: a.id,
    titre: a.title ?? "",
    ville: a.ville ?? "",
    prix: a.prix ?? 0,
    imageUrl: a.imageUrl ?? undefined,
  }));
}
