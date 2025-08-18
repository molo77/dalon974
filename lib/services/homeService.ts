export type HomeAnnonce = {
  id: string;
  titre?: string | null;
  ville?: string | null;
  prix?: number | null;
  surface?: number | null;
  description?: string | null;
  imageUrl?: string | null;
  createdAt?: any;
  communeSlug?: string | null;
  photos?: string[] | null;
};

export async function listAnnoncesAll(): Promise<HomeAnnonce[]> {
  const res = await fetch('/api/annonces', { cache: 'no-store' });
  if (!res.ok) throw new Error('fetch annonces failed');
  return res.json();
}

export async function listAnnoncesPage(limit = 20, offset = 0): Promise<HomeAnnonce[]> {
  const qs = new URLSearchParams();
  qs.set('limit', String(limit));
  qs.set('offset', String(offset));
  const res = await fetch(`/api/annonces?${qs.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('fetch annonces page failed');
  return res.json();
}
