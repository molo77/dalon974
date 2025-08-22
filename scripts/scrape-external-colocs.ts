import crypto from 'crypto';
import prisma from '@/lib/prismaClient';

interface RawListing {
  source: string;
  sourceId?: string;
  url: string;
  title?: string;
  description?: string;
  ville?: string;
  budget?: number;
  chambres?: number;
  surface?: number;
  photos?: string[];
  postedAt?: Date;
}

function computeHash(l: RawListing): string {
  const base = [l.source, l.sourceId, l.url, l.title, l.ville, l.budget, l.chambres, l.surface]
    .map(v => (v ?? '')).join('|').toLowerCase();
  return crypto.createHash('sha256').update(base).digest('hex').slice(0, 40);
}

async function upsertListings(listings: RawListing[]) {
  for (const l of listings) {
    const hash = computeHash(l);
    try {
      await prisma.externalColocListing.upsert({
        where: { hash },
        update: {
          title: l.title,
          description: l.description,
          ville: l.ville,
          budget: l.budget,
          chambres: l.chambres,
          surface: l.surface,
          photos: l.photos ? l.photos : undefined,
          postedAt: l.postedAt,
          scrapedAt: new Date(),
        },
        create: {
          source: l.source,
          sourceId: l.sourceId,
          url: l.url,
          title: l.title,
          description: l.description,
          ville: l.ville,
          budget: l.budget,
          chambres: l.chambres,
          surface: l.surface,
          photos: l.photos,
          postedAt: l.postedAt,
          hash,
        }
      });
      console.log('Upsert OK', l.url);
    } catch (e) {
      console.error('Upsert FAIL', l.url, e);
    }
  }
}

async function main() {
  // TODO: remplacer par vrai scraping (fetch + cheerio). Ici mock.
  const sample: RawListing[] = [
    {
      source: 'mockSite',
      sourceId: '12345',
      url: 'https://example.com/annonce/12345',
      title: 'Chambre meublée Saint-Denis',
      description: 'Grande chambre proche centre.',
      ville: 'Saint-Denis',
      budget: 550,
      chambres: 1,
      surface: 15,
      photos: ['https://example.com/img1.jpg'],
      postedAt: new Date()
    }
  ];
  await upsertListings(sample);
  console.log('Terminé');
  process.exit(0);
}

main().catch(e=>{console.error(e); process.exit(1);});
