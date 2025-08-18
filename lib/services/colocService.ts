export type ColocProfileDto = {
  id: string;
  nom?: string | null;
  ville?: string | null;
  budget?: number | null;
  age?: number | null;
  profession?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  photos?: string[] | null;
  communesSlugs?: string[] | null;
  zones?: string[] | null;
  createdAt?: any;
};

export type ListColocParams = {
  limit?: number;
  offset?: number;
  ville?: string;
  prixMax?: number | null;
  slugs?: string[]; // communes slugs (canonical)
  ageMin?: number | null;
  ageMax?: number | null;
};

export async function listColoc(params: ListColocParams = {}): Promise<ColocProfileDto[]> {
  const { limit = 20, offset = 0, ville, prixMax, slugs, ageMin, ageMax } = params;
  const qs = new URLSearchParams();
  qs.set('limit', String(limit));
  qs.set('offset', String(offset));
  if (ville) qs.set('ville', ville);
  if (typeof prixMax === 'number') qs.set('prixMax', String(prixMax));
  if (Array.isArray(slugs) && slugs.length) qs.set('slugs', slugs.join(','));
  if (typeof ageMin === 'number') qs.set('ageMin', String(ageMin));
  if (typeof ageMax === 'number') qs.set('ageMax', String(ageMax));
  const res = await fetch(`/api/coloc?${qs.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('fetch coloc failed');
  return res.json();
}

export async function getColoc(id: string): Promise<ColocProfileDto | null> {
  const res = await fetch(`/api/coloc/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export async function updateColoc(id: string, patch: any): Promise<ColocProfileDto> {
  const res = await fetch(`/api/coloc/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error('update coloc failed');
  return res.json();
}

export async function deleteColoc(id: string): Promise<{ ok: boolean }> {
  const res = await fetch(`/api/coloc/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('delete coloc failed');
  return res.json();
}
