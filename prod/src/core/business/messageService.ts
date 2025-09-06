// API-based message queries
export async function listMessagesForOwner(ownerId: string) {
  const res = await fetch(`/api/messages?ownerId=${encodeURIComponent(ownerId)}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Erreur récupération messages");
  return res.json();
}

export async function listMessagesFromUser(userId: string) {
  const res = await fetch(`/api/messages?from=${encodeURIComponent(userId)}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Erreur récupération messages envoyés");
  return res.json();
}
