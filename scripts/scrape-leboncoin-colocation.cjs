// Scraper Leboncoin (category=11, region Réunion) -> table Annonce
// Utilisation: (PowerShell)
// $env:LBC_SEARCH_URL='https://www.leboncoin.fr/recherche?category=11&locations=r_26'; node scripts/scrape-leboncoin-colocation.cjs
// Charge automatiquement .env.local puis .env via dotenv si disponible

try {
  // Charge .env.local en priorité si présent, sinon fallback .env
  const fs = require('fs');
  const path = require('path');
  const dotenv = require('dotenv');
  const root = process.cwd();
  const localPath = path.join(root, '.env.local');
  const envPath = path.join(root, '.env');
  if (fs.existsSync(localPath)) {
    dotenv.config({ path: localPath, override: true });
    if (process.env.LBC_DEBUG === 'true') console.log('[lbc] dotenv chargé (.env.local, override)');
  } else if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
    if (process.env.LBC_DEBUG === 'true') console.log('[lbc] dotenv chargé (.env, override)');
  }
} catch (e) {
  console.warn('[lbc] dotenv non chargé', e.message);
}

const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SEARCH_URL = process.env.LBC_SEARCH_URL || 'https://www.leboncoin.fr/recherche?category=11&locations=r_26';
const HEADLESS = (process.env.LBC_BROWSER_HEADLESS || 'true').toLowerCase() === 'true';
if ((process.env.LBC_DEBUG || '').toLowerCase() === 'true') {
  console.log('[lbc] HEADLESS raw="' + process.env.LBC_BROWSER_HEADLESS + '" =>', HEADLESS);
}
const MAX = parseInt(process.env.LBC_MAX || '40', 10);
const FETCH_DETAILS = (process.env.LBC_FETCH_DETAILS || 'true').toLowerCase() === 'true';
// DETAIL_LIMIT: nombre max d'annonces pour lesquelles on charge les pages détail.
// Valeurs spéciales acceptées: 'all', 0, -1 => toutes les annonces retenues.
let DETAIL_LIMIT_RAW = process.env.LBC_DETAIL_LIMIT || '12';
let DETAIL_LIMIT;
if (['all','*'].includes(DETAIL_LIMIT_RAW.toLowerCase()) || ['0','-1'].includes(DETAIL_LIMIT_RAW)) {
  DETAIL_LIMIT = Infinity;
} else {
  const parsed = parseInt(DETAIL_LIMIT_RAW,10);
  DETAIL_LIMIT = isNaN(parsed) ? 0 : parsed;
}
const DEBUG = (process.env.LBC_DEBUG || 'false').toLowerCase() === 'true';
const DATADOME_TOKEN = process.env.LBC_DATADOME || process.env.DATADOME_TOKEN || '';
const DETAIL_SLEEP = parseInt(process.env.LBC_DETAIL_SLEEP || '500', 10); // ms entre pages détail
const PAGES = parseInt(process.env.LBC_PAGES || '1', 10); // nombre de pages de recherche
const VERBOSE_LIST = (process.env.LBC_VERBOSE_LIST || 'false').toLowerCase() === 'true';
const EXPORT_JSON = (process.env.LBC_EXPORT_JSON || 'false').toLowerCase() === 'true';
const NO_DB = (process.env.LBC_NO_DB || 'false').toLowerCase() === 'true';
const UPDATE_COOLDOWN_HOURS = parseFloat(process.env.LBC_UPDATE_COOLDOWN_HOURS || '0'); // pas de mise à jour si récent (< X h)
let COOKIE_RAW = process.env.LBC_COOKIES || process.env.SCRAPE_COLOCS_LBC_COOKIES || '';
if (!COOKIE_RAW && DATADOME_TOKEN) {
  COOKIE_RAW = `datadome=${DATADOME_TOKEN}`;
  console.log('[lbc] datadome token injecté depuis env');
}
const EXTRA_SLEEP = parseInt(process.env.LBC_EXTRA_SLEEP || '0', 10); // ms after navigation

function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

async function navigateWithRetry(page, url) {
  const strategies = [
    { waitUntil: 'domcontentloaded', timeout: 90000 },
    { waitUntil: 'networkidle0', timeout: 90000 },
    { waitUntil: 'load', timeout: 90000 }
  ];
  let lastErr;
  for (const strat of strategies) {
    try {
      await page.goto(url, strat);
      return true;
    } catch (e) {
      lastErr = e;
      if (DEBUG) console.warn('[lbc][retry] stratégie échouée', strat.waitUntil, e.message);
    }
  }
  if (lastErr) throw lastErr;
  return false;
}

async function scrape() {
  let puppeteer;
  try { puppeteer = require('puppeteer'); } catch { console.error('[lbc] Installez puppeteer: npm i -D puppeteer'); process.exit(1); }
  const browser = await puppeteer.launch({ headless: HEADLESS, args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
    'Referer': 'https://www.google.com/'
  });
  if (COOKIE_RAW) {
    // Supporte liste "k=v; k2=v2"
    const cookies = COOKIE_RAW.split(/;\s*/).filter(Boolean).map(chunk => {
      const eq = chunk.indexOf('=');
      if (eq === -1) return null;
      return { name: chunk.slice(0, eq), value: chunk.slice(eq+1), domain: '.leboncoin.fr' };
    }).filter(Boolean);
    if (cookies.length) {
      try { await page.setCookie(...cookies); console.log('[lbc] cookies injectés', cookies.map(c=>c.name).join(',')); } catch (e) { console.warn('[lbc] setCookie fail', e.message); }
    }
  }
  console.log('[lbc] start headless=', HEADLESS, 'pages=', PAGES);
  const allListings = [];
  const seenPageUrls = new Set();
  let totalPagesTarget = PAGES;
  for (let pIdx = 1; pIdx <= totalPagesTarget; pIdx++) {
      const pageUrlObj = new URL(SEARCH_URL);
      if (pIdx > 1) pageUrlObj.searchParams.set('page', String(pIdx)); else pageUrlObj.searchParams.delete('page');
      const pageUrl = pageUrlObj.toString();
      console.log(`[lbc] page ${pIdx}/${PAGES} ->`, pageUrl);
      await navigateWithRetry(page, pageUrl);
      if (EXTRA_SLEEP > 0) await page.waitForTimeout(EXTRA_SLEEP);
      if (pIdx === 1) { try { await page.click('#didomi-notice-agree-button', { timeout: 4000 }); console.log('[lbc] cookies accept'); } catch {} }
      // Scroll pour charger lazy content
      for (let i=0;i<6;i++) { await page.evaluate(()=>window.scrollBy(0, window.innerHeight*0.92)); await sleep(500 + Math.floor(Math.random()*220)); }
      try { await page.waitForSelector('article[data-qa-id="aditem_container"] a[href^="/ad/"]', { timeout: 12000 }); } catch {}
      // Détection nombre total de pages (première page)
      if (pIdx === 1) {
        try {
          const meta = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a[href*="page="]'));
            let max = 1;
            for (const a of links) {
              const m = a.href.match(/page=(\d+)/);
              if (m) { const v = parseInt(m[1],10); if (v>max) max = v; }
            }
            const lastLink = document.querySelector('link[rel=last]')?.href;
            if (lastLink) { const m2 = lastLink.match(/page=(\d+)/); if (m2) { const v2=parseInt(m2[1],10); if (v2>max) max=v2; } }
            return { max };
          });
          if (meta?.max && meta.max > 1) {
            if (meta.max < totalPagesTarget) {
              totalPagesTarget = meta.max;
              console.log('[lbc] pagination limitée détectée:', meta.max);
            }
            if (PAGES > meta.max) console.log('[lbc] PAGES demandé > pages réelles, ajusté à', meta.max);
          }
        } catch (e) { if (DEBUG) console.warn('[lbc] detect pages fail', e.message); }
      }
      const pageListings = await page.evaluate(() => {
        const articles = Array.from(document.querySelectorAll('article[data-qa-id="aditem_container"], article[data-test-id="ad"]'));
        return articles.map(article => {
          const a = article.querySelector('a[href^="/ad/"]');
          if (!a) return null;
          const url = new URL(a.getAttribute('href'), location.origin).href.split('?')[0];
          const title = (article.querySelector('[data-qa-id="aditem_title"], h3, h2')?.textContent || '').trim();
          const priceNode = article.querySelector('[data-qa-id="aditem_price"], [data-test-id="price"], [class*="price"]');
          const priceRaw = priceNode ? priceNode.textContent.replace(/\s/g,'') : '';
          const priceMatch = priceRaw.match(/(\d[\d.]{1,7})/);
          const ville = (article.querySelector('[data-qa-id="aditem_location"], [data-test-id="location"], [class*="location"]')?.textContent || '').trim();
          return { url, title, price: priceMatch? parseInt(priceMatch[1].replace(/\./g,''),10): undefined, ville };
        }).filter(Boolean);
      });
      console.log(`[lbc] page ${pIdx} annonces trouvées`, pageListings.length);
      if (VERBOSE_LIST) pageListings.slice(0,10).forEach(l=>console.log('  -', l.price? (l.price+'€'):'?', '|', l.ville || '', '|', l.title.slice(0,70)));
      for (const l of pageListings) { if (!seenPageUrls.has(l.url)) { seenPageUrls.add(l.url); allListings.push(l); } }
      if (allListings.length >= MAX) break;
      await sleep(400 + Math.floor(Math.random()*300));
    }
    console.log('[lbc] total annonces collectées avant coupe', allListings.length);
  var slice = allListings.slice(0, MAX);
  console.log('[lbc] retenues', slice.length);

  if (FETCH_DETAILS) {
    const detailCap = DETAIL_LIMIT === Infinity ? slice.length : Math.min(slice.length, DETAIL_LIMIT);
    console.log('[lbc] détails max', detailCap, DETAIL_LIMIT===Infinity ? '(all)' : '');
    for (let i=0;i<slice.length && i<detailCap;i++) {
      const l = slice[i];
      try {
        const p = await browser.newPage();
        await p.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
  await navigateWithRetry(p, l.url);
        try { await p.click('#didomi-notice-agree-button', { timeout: 3000 }); } catch {}
  await sleep(800);
        const nextData = await p.$eval('#__NEXT_DATA__', el => el.textContent).catch(()=>null);
        if (nextData) {
          try {
            const json = JSON.parse(nextData);
            const adData = json?.props?.pageProps?.adData || json?.props?.initialProps?.ad || null;
            if (adData) {
              if (!l.title && adData.subject) l.title = adData.subject;
              if (adData.body) l.description = String(adData.body).trim();
              if (adData.location?.city && !l.ville) l.ville = adData.location.city;
              const priceVal = adData.price ? (adData.price.value || adData.price[0]?.value) : undefined;
              if (typeof priceVal === 'number' && !l.price) l.price = priceVal;
              if (Array.isArray(adData.images)) {
                l.photos = adData.images.map(im => im?.url || im?.urls?.large || im?.urls?.thumb).filter(Boolean).slice(0,12);
                if (l.photos.length) l.imageUrl = l.photos[0];
              }
              // Extraction attributs dédiés
              try {
                const pools = [adData.attributes, adData.properties, adData.features];
                const attr = {};
                for (const pool of pools) {
                  if (!pool) continue;
                  const list = Array.isArray(pool) ? pool : Object.entries(pool).map(([k,v])=>({ key:k, value:v }));
                  for (const it of list) {
                    const key = (it?.key || it?.name || it?.label || '').toString().trim();
                    const rawVal = it?.value?.label || it?.value || it?.displayValue || it?.labelValue || it?.values || '';
                    const val = Array.isArray(rawVal) ? rawVal.map(x=>x?.label||x).join(',') : String(rawVal);
                    if (key && !attr[key]) attr[key] = val;
                  }
                }
                // Mapping heuristique vers champs normalisés
                const get = (...cands) => {
                  for (const c of cands) { if (attr[c]) return attr[c]; }
                  return undefined;
                };
                l.typeBien = get('real_estate_type','typebien','type_de_bien');
                const furnishedLabel = get('furnished','meuble','meublé');
                if (furnishedLabel) l.meuble = /meubl/i.test(furnishedLabel);
                const toInt = v => { const n=parseInt((v||'').toString(),10); return isNaN(n)?undefined:n; };
                l.nbPieces = toInt(get('rooms','nb_pieces','pieces'));
                if (!l.nbChambres) l.nbChambres = toInt(get('bedrooms','nb_chambres','chambres'));
                l.nbSdb = toInt(get('bathrooms','nb_salles_de_bain','salles_de_bain'));
                l.natureBien = get('house_type','nature_bien');
                l.caracteristiques = [get('features','amenities','caracteristiques'), get('equipment')].filter(Boolean).join(' | ') || undefined;
                l.exposition = get('orientation','exposition');
                l.exterieur = get('outside','exterieur');
                l.placesParking = toInt(get('parking','places_parking'));
                l.disponibleAPartir = get('available_from','disponible_a_partir');
                l.typeLocation = get('rental_type','type');
                l.nombreColocataires = toInt(get('colocataires','roommates','nb_colocataires'));
                l.statutFumeur = get('smoking','statut_fumeur');
              } catch {}
            }
          } catch {}
        }
        if (!l.description) {
          l.description = await p.$eval('body', el => el.textContent.slice(0, 2000)).catch(()=>undefined);
        }
  // Basic attribute parsing (surface, chambres, équipements) déjà géré plus haut si besoin
  await p.close();
  if (DETAIL_SLEEP) await sleep(DETAIL_SLEEP + Math.floor(Math.random()*250));
      } catch (e) {
        console.warn('[lbc] detail fail', l.url, e.message);
      }
    }
  }

  if (EXPORT_JSON) {
    try { require('fs').writeFileSync('lbc_output.json', JSON.stringify(slice, null, 2), 'utf8'); console.log('[lbc] export JSON -> lbc_output.json'); } catch(e){ console.warn('[lbc] export json fail', e.message); }
  }
  if (NO_DB) {
    console.log('[lbc] NO_DB= true -> skip upserts');
  } else {
    let created = 0, updated = 0, skippedRecent = 0;
    const cooldownMs = UPDATE_COOLDOWN_HOURS > 0 ? UPDATE_COOLDOWN_HOURS * 3600 * 1000 : 0;
    for (const l of slice) {
      const id = crypto.createHash('md5').update(l.url).digest('hex');
      try {
        if (DEBUG) console.dir({ debugListing: l }, { depth: null });
        const existing = await prisma.annonce.findUnique({ where: { id }, select: { updatedAt: true } });
        if (existing && cooldownMs > 0) {
          const age = Date.now() - existing.updatedAt.getTime();
            if (age < cooldownMs) {
              skippedRecent++;
              if (DEBUG) console.log('[lbc][cooldown] skip update', id, 'age(ms)=', age);
              continue;
            }
        }
        if (existing) {
          await prisma.annonce.update({
            where: { id },
            data: { title: l.title || undefined, prix: l.price ?? undefined, ville: l.ville || undefined, description: l.description || undefined, photos: l.photos || undefined, imageUrl: l.imageUrl || undefined, surface: l.surface || undefined, nbChambres: l.nbChambres || undefined, equipements: l.equipements || undefined,
              typeBien: l.typeBien, meuble: l.meuble, nbPieces: l.nbPieces, nbSdb: l.nbSdb, natureBien: l.natureBien, caracteristiques: l.caracteristiques, exposition: l.exposition, exterieur: l.exterieur, placesParking: l.placesParking, disponibleAPartir: l.disponibleAPartir, typeLocation: l.typeLocation, nombreColocataires: l.nombreColocataires, statutFumeur: l.statutFumeur,
              source: 'lbc', updatedAt: new Date() }
          });
          updated++;
        } else {
          await prisma.annonce.create({
            data: { id, title: l.title || undefined, prix: l.price ?? undefined, ville: l.ville || undefined, description: l.description || undefined, photos: l.photos || undefined, imageUrl: l.imageUrl || undefined, surface: l.surface || undefined, nbChambres: l.nbChambres || undefined, equipements: l.equipements || undefined,
              typeBien: l.typeBien, meuble: l.meuble, nbPieces: l.nbPieces, nbSdb: l.nbSdb, natureBien: l.natureBien, caracteristiques: l.caracteristiques, exposition: l.exposition, exterieur: l.exterieur, placesParking: l.placesParking, disponibleAPartir: l.disponibleAPartir, typeLocation: l.typeLocation, nombreColocataires: l.nombreColocataires, statutFumeur: l.statutFumeur,
              source: 'lbc', createdAt: new Date(), updatedAt: new Date() }
          });
          created++;
        }
      } catch (e) {
        console.error('[lbc] upsert error', l.url, e.message);
      }
    }
  const metricsObj = { created, updated, skippedRecent, cooldownHours: UPDATE_COOLDOWN_HOURS, totalProcessed: slice.length };
  console.log('[lbc] résumé persist:', metricsObj);
  // Ligne JSON brute pour parsing externe
  try { console.log('LBC_METRICS_JSON:' + JSON.stringify(metricsObj)); } catch {}
  }
  await browser.close();
  await prisma.$disconnect();
}

scrape().catch(e => { console.error('[lbc] fatal', e); process.exit(1); });
