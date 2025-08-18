export {};

// NOTE: Ce module est exécuté côté client. On utilise l'API Next.js, pas Prisma directement.

// Upload générique (fichier unique) vers /api/uploads -> retourne l'URL publique
export async function uploadPhoto(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/uploads", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload échoué");
  const data = (await res.json()) as { url?: string; files?: string[] };
  return data.url || (data.files && data.files[0]) || "";
}

// Gestion Coloc: suppression d'une photo (métadonnée + fichier)
// TODO: créer des routes API spécifiques coloc si besoin. Pour l'instant, on supprime uniquement le fichier.
export async function deleteColocPhotoWithMeta(_userId: string, url: string) {
  try {
    await fetch(`/api/uploads?path=${encodeURIComponent(url)}`, { method: "DELETE" });
  } catch {}
}

// Marquer une image coloc comme principale via URL (prochaine étape: côté API/DB)
export async function setColocImageMainByUrl(_uid: string, _url: string) {
  // À implémenter via une route API quand le modèle ColocProfile sera migré de Firestore
}

export async function rebuildColocPhotosArray(_uid: string) {
  // À implémenter quand on aura les routes coloc en base
  return [] as string[];
}

// Annonce: ajouter une image (meta) après upload. On met à jour l'annonce via PATCH pour pousser l'URL dans photos[]
export async function addAnnonceImageMeta(annonceId: string, opts: { url: string; filename?: string; isMain?: boolean; uploadedBy?: string }) {
  const { url, isMain = false } = opts;
  if (!annonceId || !url) return;
  try {
    // Récupère l'annonce actuelle pour fusionner les photos
    const cur = await fetch(`/api/annonces/${encodeURIComponent(annonceId)}`).then(r => r.ok ? r.json() : null).catch(() => null);
    const curPhotos: string[] = Array.isArray(cur?.photos) ? cur.photos : [];
    const nextPhotos = Array.from(new Set([...curPhotos, url]));
    const patch: any = { photos: nextPhotos };
    if (isMain || !cur?.imageUrl) patch.imageUrl = url;
    await fetch(`/api/annonces/${encodeURIComponent(annonceId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
  } catch {}
}

// Reconstruire l'array photos côté annonce: best-effort en lisant l'annonce (pas d'images séparées en DB pour l'instant)
export async function rebuildAnnoncePhotosArray(annonceId: string) {
  const cur = await fetch(`/api/annonces/${encodeURIComponent(annonceId)}`).then(r => r.ok ? r.json() : null).catch(() => null);
  const curPhotos: string[] = Array.isArray(cur?.photos) ? cur.photos : [];
  return curPhotos;
}

// Définir la photo principale d'une annonce par index: ici on se contente de mettre imageUrl = photos[idx]
export async function setAnnonceMainPhoto(annonceId: string, idx: number) {
  try {
    const cur = await fetch(`/api/annonces/${encodeURIComponent(annonceId)}`).then(r => r.ok ? r.json() : null).catch(() => null);
    const curPhotos: string[] = Array.isArray(cur?.photos) ? cur.photos : [];
    if (!curPhotos.length) return;
    const i = Math.max(0, Math.min(idx, curPhotos.length - 1));
    const main = curPhotos[i];
    await fetch(`/api/annonces/${encodeURIComponent(annonceId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: main }),
    });
  } catch {}
}

// Pour compat: upload + métadonnées d'une annonce en une fois (côté client)
export async function uploadAnnoncePhotoWithMeta(file: File, annonceId: string) {
  const url = await uploadPhoto(file);
  await addAnnonceImageMeta(annonceId, { url });
  return { url } as { url: string; id?: number };
}

// Supprimer une image d'annonce: met à jour photos[]/imageUrl et supprime le fichier
export async function deleteAnnoncePhotoWithMeta(annonceId: string, url: string) {
  if (!annonceId || !url) return;
  try {
    const cur = await fetch(`/api/annonces/${encodeURIComponent(annonceId)}`).then(r => r.ok ? r.json() : null).catch(() => null);
    const curPhotos: string[] = Array.isArray(cur?.photos) ? cur.photos : [];
    const nextPhotos = curPhotos.filter((u) => u !== url);
    const patch: any = { photos: nextPhotos };
    if (cur?.imageUrl === url) patch.imageUrl = nextPhotos[0] || null;
    await fetch(`/api/annonces/${encodeURIComponent(annonceId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
  } catch {}
  try {
    await fetch(`/api/uploads?path=${encodeURIComponent(url)}`, { method: 'DELETE' });
  } catch {}
}
