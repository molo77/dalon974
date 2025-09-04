// Services basés sur les routes API Next.js (Prisma en backend)

export async function listUserAnnoncesPage(userId: string, opts?: { lastId?: string; pageSize?: number }) {
  const res = await fetch(`/api/annonces`, { cache: "no-store" });
  if (!res.ok) throw new Error("Erreur de récupération des annonces");
  const data = await res.json();
  
      // Filtrage côté client avec userId
    const userAnnonces = data.items.filter((a: any) => a.userId === userId);
  
  // Pagination côté client
  const pageSize = opts?.pageSize ?? 10;
  const startIndex = opts?.lastId ? userAnnonces.findIndex((a: any) => a.id === opts!.lastId) + 1 : 0;
  const slice = userAnnonces.slice(startIndex, startIndex + pageSize);
  const newLast = slice.length ? slice[slice.length - 1].id : undefined;
  
  return { items: slice, lastId: newLast };
}

// Fallback d'abonnement: simple polling toutes les 10s
export function subscribeUserAnnonces(userId: string, cb: (items: any[]) => void, _onErr: (e: any) => void) {
  let stopped = false;
  const poll = async () => {
    if (stopped) return;
    try {
      const { items } = await listUserAnnoncesPage(userId, { pageSize: 100 });
      cb(items);
    } catch {
      // silencieux
    }
    setTimeout(poll, 10000);
  };
  poll();
  return () => { stopped = true; };
}

export async function addAnnonce(_user: { uid: string; email: string | null }, data: any) {
  const res = await fetch(`/api/annonces`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error("[AnnonceService] Erreur API:", res.status, errorText);
    throw new Error(`Erreur de création de l'annonce: ${res.status} - ${errorText}`);
  }
  
  return res.json();
}

export async function updateAnnonce(id: string, patch: any) {
  const res = await fetch(`/api/annonces/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Erreur de mise à jour de l'annonce");
  return res.json();
}

export async function deleteAnnonce(id: string) {
  const res = await fetch(`/api/annonces/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Erreur de suppression de l'annonce");
  return res.json();
}
