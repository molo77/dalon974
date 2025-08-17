
import prisma from "@/lib/prismaClient";

export async function listUsers() {
  return await prisma.user.findMany();
}

export async function getUserRole(uid: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { id: uid } });
  return user?.role || null;
}

export async function ensureUserDoc(uid: string, data: { email: string; displayName: string; role: string; providerId: string }) {
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) {
    await prisma.user.create({ data: { id: uid, ...data, createdAt: new Date() } });
  } else if (!user.providerId) {
    await prisma.user.update({ where: { id: uid }, data: { providerId: data.providerId } });
  }
}

export async function createUserDoc(data: { email: string; displayName?: string; role: string; ville?: string; telephone?: string }) {
  return await prisma.user.create({ data });
}

export async function updateUserDoc(id: string, patch: { email: string; displayName: string; role: string; ville?: string; telephone?: string }) {
  await prisma.user.update({ where: { id }, data: patch });
}

export async function deleteUserDoc(id: string) {
  await prisma.user.delete({ where: { id } });
}

export async function normalizeUsers(): Promise<number> {
  const users = await prisma.user.findMany();
  let count = 0;
  for (const user of users) {
    const patch: any = {};
    if (user.providerId == null) patch.providerId = "password";
    if (user.role == null) patch.role = "user";
    if (user.createdAt == null) patch.createdAt = new Date();
    if (user.displayName == null) patch.displayName = "";
    if (Object.keys(patch).length) {
      await prisma.user.update({ where: { id: user.id }, data: patch });
      count++;
    }
  }
  return count;
}

// Pour le reset password, il faudra une solution externe (SMTP, etc.)
export async function sendResetTo(email: string) {
  throw new Error("sendResetTo n'est plus supporté sans Firebase Auth. À remplacer par une solution SMTP.");
}
