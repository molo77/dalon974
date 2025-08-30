// Script de build: télécharge les features communes Outre-mer et écrit un JSON filtré 974
// Usage: node scripts/build-reunion-geo.mjs

import fs from 'node:fs/promises';
import path from 'node:path';

const RAW_URL = 'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/communes-avec-outre-mer.geojson';

async function main() {
  const res = await fetch(RAW_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const gj = await res.json();
  const feats = (gj.features || []).filter((f) => String(f?.properties?.code || f?.properties?.INSEE || '').startsWith('974'));
  const out = { type: 'FeatureCollection', features: feats };
  const outDir = path.join(process.cwd(), 'public', 'data');
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, 'reunion-communes.json');
  await fs.writeFile(outPath, JSON.stringify(out));
  console.log('Écrit:', outPath, `(${feats.length} features)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
