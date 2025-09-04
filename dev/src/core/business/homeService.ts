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
  userId?: string | null;
};

export async function listAnnoncesAll(): Promise<HomeAnnonce[]> {
  const res = await fetch('/api/annonces', { cache: 'no-store' });
  if (!res.ok) throw new Error('fetch annonces failed');
  return res.json();
}

export async function listAnnoncesPage(limit = 20, offset = 0, filters?: { ville?: string, codePostal?: string, prixMax?: number, slugs?: string[], zones?: string[] }): Promise<{ items: HomeAnnonce[], total: number }> {
  const qs = new URLSearchParams();
  qs.set('limit', String(limit));
  qs.set('offset', String(offset));
  
  // Ajouter les paramètres de filtrage
  if (filters) {
    if (filters.ville) qs.set('ville', filters.ville);
    if (filters.codePostal) qs.set('codePostal', filters.codePostal);
    if (filters.prixMax !== undefined) qs.set('prixMax', String(filters.prixMax));
    if (filters.slugs && filters.slugs.length > 0) qs.set('slugs', filters.slugs.join(','));
    if (filters.zones && filters.zones.length > 0) qs.set('zones', filters.zones.join(','));
  }
  
  const res = await fetch(`/api/annonces?${qs.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('fetch annonces page failed');
  const data = await res.json();
  
  // Retourner la structure avec items et total
  return {
    items: data.items || data, // Fallback pour compatibilité
    total: data.total || 0
  };
}
