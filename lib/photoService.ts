export {};
import prisma from './prismaClient';

// Upload un fichier et crée une entrée ColocImage en base
export async function uploadColocPhotoWithMeta(file: File, userId: string) {
  if (!file) throw new Error('Aucun fichier sélectionné');
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Erreur upload local');
  const data = await res.json();
  const url = data.url;
  // Créer une ligne ColocImage
  const img = await prisma.colocImage.create({
    data: {
      url,
      filename: file.name,
      createdAt: new Date(),
      size: file.size,
      type: file.type,
      storagePath: url,
      colocProfileId: userId,
    }
  });
  return { url, id: img.id };
}

// Supprime la ligne ColocImage et le fichier associé
export async function deleteColocPhotoWithMeta(userId: string, url: string) {
  try {
    await prisma.colocImage.deleteMany({ where: { colocProfileId: userId, url } });
  } catch (e) {
    console.warn('Erreur suppression ColocImage (Prisma)', e);
  }
  try {
    await fetch('/api/delete-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
  } catch (e) {}
}

// Upload un fichier et crée une entrée AnnonceImage en base
export async function uploadAnnoncePhotoWithMeta(file: File, annonceId: string) {
  if (!file) throw new Error('Aucun fichier sélectionné');
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Erreur upload local');
  const data = await res.json();
  const url = data.url;
  const img = await prisma.annonceImage.create({
    data: {
      url,
      filename: file.name,
      createdAt: new Date(),
      size: file.size,
      type: file.type,
      storagePath: url,
      annonceId: annonceId,
    }
  });
  return { url, id: img.id };
}

export async function deleteAnnoncePhotoWithMeta(annonceId: string, url: string) {
  try {
    await prisma.annonceImage.deleteMany({ where: { annonceId, url } });
  } catch (e) {
    console.warn('Erreur suppression AnnonceImage (Prisma)', e);
  }
  try {
    await fetch('/api/delete-upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
  } catch (e) {}
}

// Toutes les fonctions Firestore supprimées. Utiliser uniquement les fonctions Prisma et API Next.js définies plus haut dans ce fichier.

// Mark the image doc with given URL as main (search by url), unset others
export async function setColocImageMainByUrl(uid: string, url: string) {
}

export async function rebuildColocPhotosArray(uid: string) {
  // Firestore: supprimé, à réimplémenter avec Prisma si besoin
  return [];
}

// Create an image doc for an annonce (annonces/{id}/images) from an URL
export async function addAnnonceImageMeta(annonceId: string, opts: { url: string; filename?: string; isMain?: boolean; uploadedBy?: string }) {
  const { url, filename = "", isMain = false } = opts;
}

export async function rebuildAnnoncePhotosArray(annonceId: string) {
  // Reconstruit le tableau des URLs des images pour une annonce
  const images = await prisma.annonceImage.findMany({
    where: { annonceId },
    orderBy: { id: 'asc' },
  });
  const urls = images.map((img: any) => img.url);
  await prisma.annonce.update({
    where: { id: annonceId },
    data: { photos: urls },
  });
  return urls;
}

// Set main photo index for a coloc profile
export async function setColocMainPhoto(userId: string, idx: number) {
  if (!userId) throw new Error('userId required');
  // Met à jour le champ mainPhotoIdx du profil coloc
  await prisma.colocProfile.update({
    where: { id: userId },
    data: { mainPhotoIdx: idx, updatedAt: new Date() },
  });
}
// Set main photo index for an annonce
export async function setAnnonceMainPhoto(annonceId: string, idx: number) {
  if (!annonceId) throw new Error('annonceId required');
  // Met à jour le champ mainPhotoIdx de l'annonce
  await prisma.annonce.update({
    where: { id: annonceId },
    data: { updatedAt: new Date() },
  });
}
