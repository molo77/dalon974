// Loader/cache des polygones des communes (Réunion) pour la carte
// Objectif: éviter un fetch à l’ouverture de la carte et réutiliser un cache en mémoire.

const RAW_URL =
  "https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/communes-avec-outre-mer.geojson";
const LOCAL_URL = "/data/reunion-communes.json"; // généré par src/scripts/build/build-reunion-geo.mjs

let cache: any[] | null = null;
let inflight: Promise<any[]> | null = null;

async function fetchReunionFeatures(): Promise<any[]> {
  // 1) Essaye d’abord le fichier local statique (si présent en prod)
  try {
    const resLocal = await fetch(LOCAL_URL, { cache: "force-cache" });
    if (resLocal.ok) {
      const gjLocal = (await resLocal.json()) as any;
      const featsLocal = gjLocal?.features || [];
      if (Array.isArray(featsLocal) && featsLocal.length > 0) return featsLocal;
    }
  } catch {}

  // 2) Fallback: fetch distant complet puis filtrage 974
  const res = await fetch(RAW_URL, { cache: "no-cache" });
  const gj = (await res.json()) as any; // FeatureCollection
  const feats = (gj?.features || []).filter((f: any) =>
    String(f?.properties?.code || f?.properties?.INSEE || "").startsWith("974")
  );
  return feats;
}

export async function loadReunionFeatures(): Promise<any[]> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = fetchReunionFeatures()
    .then((feats) => {
      cache = feats;
      return feats;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function preloadReunionFeatures(): void {
  // Déclenche sans attendre (meilleur effort)
  void loadReunionFeatures();
}
