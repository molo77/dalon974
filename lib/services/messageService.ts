
import prisma from "@/lib/prismaClient";

export async function listMessagesForOwner(ownerId: string) {
  return await prisma.message.findMany({
    where: { annonceOwnerId: ownerId },
    orderBy: { createdAt: "desc" },
  });
}
