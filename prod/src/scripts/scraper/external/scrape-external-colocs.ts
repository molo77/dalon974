import crypto from 'crypto';
import prisma from '@/infrastructure/database/prismaClient';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';

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
  const client: any = prisma as any;
  if (!client?.externalColocListing?.upsert) {
    console.warn('externalColocListing model indisponible (pas dans le schéma Prisma). Skip upserts.');
    return;
  }
  for (const l of listings) {
    const hash = computeHash(l);
    try {
      await client.externalColocListing.upsert({
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

// Exemple d'une source (adapter aux sites réels). On suppose une page liste avec liens.
async function scrapeSourceList(baseUrl: string): Promise<string[]> {
  const res = await fetch(baseUrl, { headers: { 'User-Agent': 'Mozilla/5.0 rodcoloc-bot' } });
  if (!res.ok) throw new Error('List fetch failed: ' + res.status);
  const html = await res.text();
    const $ = cheerio.load(html); // types fournis par cheerio
  // Sélection: tous liens contenant '/annonce/' (exemple générique)
  const links = new Set<string>();
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (/annonce/i.test(href)) {
      const full = href.startsWith('http') ? href : new URL(href, baseUrl).toString();
      links.add(full);
    }
  });
  return [...links];
}

async function scrapeDetail(url: string): Promise<RawListing | null> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 rodcoloc-bot' } });
    if (!res.ok) throw new Error('Detail fetch failed ' + res.status);
    const html = await res.text();
    const $ = cheerio.load(html);
    // Heuristiques (adapter selectors aux sites cibles):
    const title = $('h1').first().text().trim() || $('title').text().trim();
    const description = $('meta[name="description"]').attr('content') || $('p').slice(0,3).text().trim();
    // Extraction ville (ex: span .ville ou regex sur texte)
    let ville: string | undefined;
      const villeText = $('[class*="ville" i]').first().text().trim();
    if (villeText) ville = villeText.split(/[,-]/)[0].trim();
    // Budget/prix (recherche nombres avec €)
    const bodyText = $('body').text();
    const prixMatch = bodyText.match(/(\d{3,4}) ?€\b/);
    const budget = prixMatch ? parseInt(prixMatch[1], 10) : undefined;
    // Photos (img avec data-src ou src)
    const photos: string[] = [];
    $('img').each((_, img) => {
      const src = ($(img).attr('data-src') || $(img).attr('src') || '').trim();
      if (src && /^https?:/i.test(src)) photos.push(src);
    });
    return {
      source: 'genericSite',
      sourceId: crypto.createHash('md5').update(url).digest('hex').slice(0,12),
      url,
      title,
      description,
      ville,
      budget,
      photos: photos.slice(0, 8),
      postedAt: new Date()
    };
  } catch (e) {
    console.error('scrapeDetail error', url, e);
    return null;
  }
}

async function main() {
  const baseListUrls = [
    // Mettre ici les URLs de listing réelles
    'https://example.com/colocations/reunion'
  ];
  const limit = pLimit(4); // rate limiting concurrency 4
  const detailUrls: string[] = [];
  for (const listUrl of baseListUrls) {
    try {
      const urls = await scrapeSourceList(listUrl);
      detailUrls.push(...urls);
      console.log('List', listUrl, '->', urls.length, 'urls');
    } catch (e) {
      console.error('List fetch failed', listUrl, e);
    }
  }
  const jobs = detailUrls.slice(0, 50).map(u => limit(() => scrapeDetail(u))); // safety cap 50
  const results = (await Promise.all(jobs)).filter(Boolean) as RawListing[];
  console.log('Details scraped:', results.length);
  await upsertListings(results);
  console.log('Terminé');
  process.exit(0);
}

main().catch(e=>{console.error(e); process.exit(1);});
