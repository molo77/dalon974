// NOTE: Ces services sont appelés côté client. Utiliser les routes API Next (serveur) pour accéder à Prisma.

export async function listUsers() {
  const res = await fetch('/api/admin/users', { cache: 'no-store' });
  if (!res.ok) throw new Error('Erreur API users');
  return await res.json();
}

// Récupération du rôle via l’API NextAuth session (mieux) ou une route dédiée si nécessaire.
export async function getUserRole(_uid: string): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/session', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.user?.role as string) || null;
  } catch { return null; }
}

export async function ensureUserDoc(_uid: string, _data: { email: string; displayName: string; role: string; providerId: string }) {
  // Géré côté auth/adapter; noop côté client
  return;
}

export async function createUserDoc(data: { email: string; displayName?: string; role: string; ville?: string; telephone?: string }) {
  const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Erreur API création utilisateur');
  return await res.json();
}

export async function updateUserDoc(id: string, patch: { email: string; displayName: string; role: string; ville?: string; telephone?: string }) {
  const res = await fetch(`/api/admin/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
  if (!res.ok) throw new Error('Erreur API mise à jour utilisateur');
}

export async function deleteUserDoc(id: string) {
  const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erreur API suppression utilisateur');
}

export async function normalizeUsers(): Promise<number> {
  const users = await listUsers();
  let count = 0;
  for (const user of users) {
    const needRole = !user.role;
    const needDisplayName = user.displayName == null;
    if (needRole || needDisplayName) {
      try {
        await updateUserDoc(user.id, {
          email: user.email,
          displayName: needDisplayName ? '' : (user.displayName || ''),
          role: needRole ? 'user' : user.role,
        });
        count++;
      } catch {}
    }
  }
  return count;
}

export async function sendResetTo(_email: string) {
  throw new Error("Fonction non supportée côté client.");
}
