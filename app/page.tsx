"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  startAfter,
  where,
  limit,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import type { Query, QuerySnapshot, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AnnonceCard from "@/components/AnnonceCard";
import CommuneZoneSelector from "@/components/CommuneZoneSelector";
import useCommuneCp from "@/hooks/useCommuneCp";

// Helper: compare deux listes de slugs sans tenir compte de l’ordre
const sameIds = (a: string[], b: string[]) => {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  for (let i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) return false;
  return true;
};

export default function HomePage() {
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any | null>(null);

  const [ville, setVille] = useState("");
  const [codePostal, setCodePostal] = useState("");
  const [prixMax, setPrixMax] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "prix" | "prix-desc">("date");

  // NOUVEAU: onglets accueil
  const [activeHomeTab, setActiveHomeTab] = useState<"annonces" | "colocataires" | null>(null);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  // NOUVEAU: communes sélectionnées (slugs)
  const [communesSelected, setCommunesSelected] = useState<string[]>([]);
  const [showCommuneMap, setShowCommuneMap] = useState(true);
  const [zonesSelected, setZonesSelected] = useState<string[]>([]); // zones calculées depuis les slugs
  const [zoneFilters, setZoneFilters] = useState<string[]>([]); // zones choisies via boutons rapides

  // NOUVEAU: état et handlers pour le détail du profil colocataire
  const [colocDetailOpen, setColocDetailOpen] = useState(false);
  const [colocDetailLoading, setColocDetailLoading] = useState(false);
  const [colocDetail, setColocDetail] = useState<any | null>(null);
  const [filtering, setFiltering] = useState(false);

  // Image d'annonce par défaut (16:9)
  const defaultAnnonceImg =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'>
        <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#e5e7eb'/><stop offset='100%' stop-color='#f3f4f6'/></linearGradient></defs>
        <rect width='800' height='450' fill='url(#g)'/>
        <rect x='60' y='120' width='300' height='210' rx='8' fill='#d1d5db'/>
        <rect x='390' y='150' width='320' height='20' rx='4' fill='#9ca3af'/>
        <rect x='390' y='185' width='280' height='16' rx='4' fill='#cbd5e1'/>
        <rect x='390' y='215' width='240' height='16' rx='4' fill='#e2e8f0'/>
        <rect x='390' y='260' width='180' height='28' rx='6' fill='#94a3b8'/>
      </svg>`
    );

  // Utilitaires pour correspondance commune <-> CP
  const slugify = (s: string) =>
    (s || "")
      .normalize("NFD").replace(/\p{Diacritic}/gu, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  // NOUVEAU: récupère les communes via le hook + fallback et versions triées
  const communeData = useCommuneCp({ setVille, setCodePostal }) as any;
  const COMMUNES_CP: { name: string; cps: string[]; alts?: { name: string; cp: string }[] }[] =
    communeData?.COMMUNES_CP ?? communeData?.communes ?? [];
  const COMMUNES_CP_SORTED =
    communeData?.COMMUNES_CP_SORTED ??
    communeData?.communesSorted ??
    [...COMMUNES_CP].sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));

  // NOUVEAU: groupes de communes (zones)
  const GROUPES: Record<string, string[]> = {
    Nord: ["Saint-Denis", "Sainte-Marie", "Sainte-Suzanne"],
    Est: ["Saint-André", "Bras-Panon", "Salazie", "Saint-Benoît", "La Plaine-des-Palmistes", "Sainte-Rose", "Saint-Philippe"],
    Ouest: ["Le Port", "La Possession", "Saint-Paul", "Trois-Bassins", "Saint-Leu", "Les Avirons", "L'Étang-Salé"],
    Sud: ["Saint-Louis", "Saint-Pierre", "Le Tampon", "Entre-Deux", "Petite-Île", "Saint-Joseph", "Cilaos"],
    Intérieur: ["Cilaos", "Salazie", "La Plaine-des-Palmistes"],
  };

  // NOUVEAU: map “nom (commune/sous-commune) -> slug parent de la commune”
  const nameToParentSlug = useMemo(() => {
    const m: Record<string, string> = {};
    (COMMUNES_CP_SORTED as any[]).forEach((c) => {
      const parentSlug = slugify(c.name);
      m[parentSlug] = parentSlug; // la commune pointe vers elle-même
      (c.alts || []).forEach((a: any) => {
        m[slugify(a.name)] = parentSlug; // la sous-commune pointe vers la commune parente
      });
    });
    return m;
  }, [COMMUNES_CP_SORTED]);

  // NOUVEAU: map “slug parent -> Nom de la commune” (pour fallback sur 'ville')
  const parentSlugToName = useMemo(() => {
    const m: Record<string, string> = {};
    (COMMUNES_CP_SORTED as any[]).forEach((c) => {
      m[slugify(c.name)] = c.name;
    });
    return m;
  }, [COMMUNES_CP_SORTED]);

  // NOUVEAU: map “slug -> Nom officiel” (pour calculer les zones depuis les slugs sélectionnés)
  const SLUG_TO_NAME = useMemo(() => {
    const m: Record<string, string> = {};
    (COMMUNES_CP_SORTED as any[]).forEach((c) => {
      m[slugify(c.name)] = c.name;
    });
    return m;
  }, [COMMUNES_CP_SORTED]);

  // Zones -> slugs de communes
  const ZONE_TO_SLUGS = useMemo(() => {
    const m: Record<string, string[]> = {};
    Object.entries(GROUPES).forEach(([zone, names]) => {
      m[zone] = names.map((n) => slugify(n));
    });
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // NOUVEAU: déduire les zones depuis les slugs sélectionnés
  const computeZonesFromSlugs = (slugs: string[]): string[] => {
    const names = (slugs || []).map((s) => SLUG_TO_NAME[s]).filter(Boolean);
    const zones: string[] = [];
    Object.entries(GROUPES).forEach(([zone, list]) => {
      if (names.some((n) => list.includes(n))) zones.push(zone);
    });
    return zones;
  };

  // NOUVEAU: altSlug -> slug canonique (gère les articles l-/le-/la-/les-)
  const altSlugToCanonical = useMemo(() => {
    const map: Record<string, string> = {};
    (COMMUNES_CP_SORTED as any[]).forEach((c) => {
      const canonical = slugify(c.name); // ex: "l-etang-sale"
      map[canonical] = canonical;
      const noArticle = canonical.replace(/^(l|le|la|les)-/, ""); // ex: "etang-sale"
      if (noArticle && !map[noArticle]) map[noArticle] = canonical;
      // variantes simples sans tirets répétés
      const compact = noArticle.replace(/-+/g, "-");
      if (compact && !map[compact]) map[compact] = canonical;
    });
    return map;
  }, [COMMUNES_CP_SORTED]);

  const findByCp = (cp: string) =>
    COMMUNES_CP.find(c => c.cps.includes(cp) || c.alts?.some(a => a.cp === cp))?.name || "";

  // MAJ: cherche aussi dans les sous-communes, retourne le CP approprié
  const findByName = (name: string) => {
    const norm = slugify(name);
    const byMain = COMMUNES_CP.find(c => slugify(c.name) === norm);
    if (byMain) return byMain.cps[0] || "";
    for (const c of COMMUNES_CP) {
      const hit = (c.alts || []).find(a => slugify(a.name) === norm);
      if (hit) return hit.cp;
    }
    return "";
  };

  // Handlers synchronisés (mise en cohérence avec la carte)
  const onVilleChange = (val: string) => {
    // Le champ commune sert d'entrée libre; la sélection validée se fait via Enter/virgule/bouton +
    setVille(val);
    if (/^\d{5}$/.test(val)) {
      const name = findByCp(val);
      if (name) {
        setVille(name);
        setCodePostal(val);
      } else {
        setCodePostal("");
      }
    } else {
      const cp = findByName(val);
      setCodePostal(cp);
    }
  };
  const onCpChange = (val: string) => {
    setCodePostal(val);
    if (/^\d{5}$/.test(val)) {
      const name = findByCp(val);
      if (name) setVille(name);
    }
  };

  // Ajoute la commune saisie (si reconnue) à la sélection multiple
  const addTypedCommune = () => {
    const val = (ville || "").trim();
    if (!val) return;
    const norm = slugify(val);
    const parent = nameToParentSlug[norm];
    if (!parent) return; // non reconnue
    setCommunesSelected((prev) => {
      const next = Array.from(new Set([...(prev || []), parent]));
      // recalcul zones sur la même base "next"
      setZonesSelected((pz) => {
        const zones = computeZonesFromSlugs(next);
        return sameIds(pz || [], zones) ? pz : zones;
      });
      return sameIds(prev || [], next) ? prev : next;
    });
    // Réinitialise le champ libre et le CP
    setVille("");
    setCodePostal("");
  };

  // Ajoute plusieurs communes d’un coup (tokens: noms séparés par virgules/retours ligne)
  const addCommunesFromTokens = (raw: string) => {
    if (!raw) return 0;
    const tokens = raw
      .split(/[\n,;]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (tokens.length === 0) return 0;
    let added = 0;
    setCommunesSelected((prev) => {
      const set = new Set(prev || []);
      for (const t of tokens) {
        const norm = slugify(t);
        const parent = nameToParentSlug[norm];
        if (parent) set.add(parent);
      }
      const next = Array.from(set);
      if (!sameIds(prev || [], next)) added = next.length - (prev?.length || 0);
      setZonesSelected((pz) => {
        const zones = computeZonesFromSlugs(next);
        return sameIds(pz || [], zones) ? pz : zones;
      });
      return sameIds(prev || [], next) ? prev : next;
    });
    // on nettoie le champ
    setVille("");
    setCodePostal("");
    return added;
  };

  const subsRef = useRef<(() => void)[]>([]); // abonnements actifs
  const pendingStreamsRef = useRef(0);
  const filtersDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const resetOnFirstSnapshotRef = useRef(false);

  const clearAllSubs = () => {
    subsRef.current.forEach((u) => { try { u(); } catch {} });
    subsRef.current = [];
    // IMPORTANT: libérer le blocage de loadAnnonces
    setLoadingMore(false);
    // Stopper l’indicateur si on nettoie au milieu d’un filtrage
    setFiltering(false);
  };

  // Helper: déduire le slug parent de l’annonce depuis communeSlug ou ville
  const getDocParentSlug = (d: any) => {
  // Priorité au communeSlug (plus fiable), fallback sur la ville
  const raw = d?.communeSlug || d?.ville || "";
    const s = slugify(raw);
    return nameToParentSlug[s] || s;
  };

  // Liste normalisée des slugs sélectionnés (disponible au rendu)
  const selectedParentSlugs = useMemo(() => {
    return Array.from(
      new Set(
        (communesSelected || [])
          .map((s) => altSlugToCanonical[s] || s)
          .filter(Boolean)
      )
    );
  }, [communesSelected, altSlugToCanonical]);

  const loadAnnonces = async () => {
    // Ne rien charger si aucun choix n’a été fait
    if (activeHomeTab === null) return;
    if (loadingMore || !hasMore || firestoreError) return;

    setLoadingMore(true);
    setFiltering(true);
    pendingStreamsRef.current = 0;

    try {
      const isColoc = activeHomeTab === "colocataires";
      const collectionName = isColoc ? "colocProfiles" : "annonces";
      const priceField = isColoc ? "budget" : "prix";
  const orderField = sortBy === "date" ? "createdAt" : priceField;

      // Normalise les slugs sélectionnés (ex: "etang-sale" -> "l-etang-sale")
      const normalizedSlugs = Array.from(
        new Set(
          communesSelected
            .map((s) => altSlugToCanonical[s] || s)
            .filter(Boolean)
        )
      );
      const hasCommuneFilter = normalizedSlugs.length > 0;

      // Prépare séparément le where prix et les filtres "base" (sans prix)
      const baseColRef = collection(db, collectionName);
      const priceWhere = prixMax !== null ? where(priceField, "<=", prixMax) : null;

      const commonFiltersBase: any[] = [];
      // Si on utilise la carte, on ignore ville/codePostal (déjà filtrés par slug)
      if (!hasCommuneFilter) {
        if (ville && (isColoc || !codePostal)) commonFiltersBase.push(where("ville", "==", ville));
        if (!isColoc && codePostal) commonFiltersBase.push(where("codePostal", "==", codePostal));
      }
      const commonFiltersWithPrice: any[] = priceWhere ? [priceWhere, ...commonFiltersBase] : [...commonFiltersBase];

      const chunks = (arr: string[], size = 10) => {
        const out: string[][] = [];
        for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
      };

      const qWithOrder = (qBase: Query<DocumentData>) => {
        const direction = sortBy === "date" ? "desc" : sortBy === "prix-desc" ? "desc" : "asc";
        return query(qBase, orderBy(orderField, direction as any), limit(10));
      };

      // Helper: vérifier que le curseur possède bien le champ d’ordre
      const aDocHasOrderField = (d: any): boolean => {
        try {
          const v = typeof d.get === 'function' ? d.get(orderField) : (d?.data?.() || {})[orderField];
          return typeof v !== 'undefined';
        } catch { return false; }
      };

      // Filtre client "ET" pour coloc (toutes les communes sélectionnées)
      const requireAllSelected =
        isColoc && communesSelected.length > 1
          ? (d: any) => {
              const arr = Array.isArray(d?.communesSlugs) ? d.communesSlugs : [];
              if (arr.length === 0) return false;
              const set = new Set(arr);
              return communesSelected.every((s) => set.has(s));
            }
          : undefined;

      // Filtre client pour annonces: slug parent ∈ communesSelected
      const annoncesClientFilter =
        !isColoc && hasCommuneFilter
          ? (d: any) => normalizedSlugs.includes(getDocParentSlug(d))
          : undefined;

      // Filtre prix client (utilisé si l’index composite manque)
      const clientPriceFilter =
        prixMax !== null
          ? (d: any) => {
              const v = d?.[priceField];
              return typeof v === "number" ? v <= (prixMax as number) : false;
            }
          : undefined;

      const combineFilters = (a?: (d: any) => boolean, b?: (d: any) => boolean) => {
        if (!a && !b) return undefined;
        return (d: any) => (a ? a(d) : true) && (b ? b(d) : true);
      };

      const attachListener = (
        qOrdered: Query<DocumentData>,
        {
          label,
          clientFilter,
          fallback,
          fallbackNoPrice,
        }: {
          label: string;
          clientFilter?: (d: any) => boolean;
          fallback: Query<DocumentData>;
          fallbackNoPrice: Query<DocumentData>;
        }
      ) => {
        // Compter cette écoute comme “en attente” jusqu’à son 1er snapshot (ou erreur)
        pendingStreamsRef.current += 1;
        let resolvedOnce = false;

        const unsub = onSnapshot(
          qOrdered,
          (snap: QuerySnapshot<DocumentData>) => {
            if (!resolvedOnce) {
              resolvedOnce = true;
              pendingStreamsRef.current -= 1;
              if (pendingStreamsRef.current <= 0) setFiltering(false);
            }
            let docsArr = snap.docs;
            if (clientFilter) docsArr = docsArr.filter((d: any) => clientFilter(d.data()));
            const mapped = docsArr.map((doc: any) => {
              const d = doc.data() as any;
              // -- CHANGEMENT: mapping dédié profils coloc --
              if (isColoc) {
                const budgetNum = Number(d.budget);
                const head = [d.profession, typeof d.age === "number" ? `${d.age} ans` : null].filter(Boolean).join(" • ");
                const tail = (d.description || "").toString();
                const short = head ? `${head}${tail ? " • " : ""}${tail}` : tail;
                return {
                  id: doc.id,
                  titre: d.nom || "Recherche colocation",
                  ville: d.ville,
                  prix: Number.isFinite(budgetNum) ? budgetNum : undefined, // AnnonceCard affiche “prix” -> budget ici
                  surface: undefined,
                  description: short.slice(0, 180), // extrait court
                  imageUrl: d.imageUrl || defaultAnnonceImg,
                  createdAt: d.createdAt,
                };
              }
              // -- annonces (inchangé) --
              const prixNum = Number(d.prix);
              return {
                id: doc.id,
                titre: d.titre,
                ville: d.ville,
                prix: Number.isFinite(prixNum) ? prixNum : undefined,
                surface: d.surface,
                description: d.description,
                imageUrl: d.imageUrl || defaultAnnonceImg,
                createdAt: d.createdAt,
                parentSlug: getDocParentSlug(d),
              };
            });
            setAnnonces((prev) => {
              // Premier snapshot après changement de filtres: remplacer entièrement
              let arr = resetOnFirstSnapshotRef.current ? [...mapped] : (() => {
                const byId = new Map(prev.map((x) => [x.id, x]));
                mapped.forEach((m) => byId.set(m.id, { ...(byId.get(m.id) || {}), ...m }));
                return Array.from(byId.values());
              })();
               const toMs = (x: any) => {
                 const v = x?.createdAt;
                 if (!v) return 0;
                 if (typeof v === "number") return v;
                 if (v?.seconds) return v.seconds * 1000 + (v.nanoseconds ? Math.floor(v.nanoseconds / 1e6) : 0);
                 const p = Date.parse(v);
                 return isNaN(p) ? 0 : p;
               };
               if (sortBy === "date") arr.sort((a, b) => toMs(b) - toMs(a));
               else if (sortBy === "prix-desc") arr.sort((a, b) => (b.prix ?? 0) - (a.prix ?? 0));
               else arr.sort((a, b) => (a.prix ?? 0) - (b.prix ?? 0));
               if (resetOnFirstSnapshotRef.current) resetOnFirstSnapshotRef.current = false;
               return arr;
             });
            // Mémorise un curseur uniquement si le doc possède bien le champ d’ordre
            const hasOrderField = (snap: any) => {
              try {
                const v = typeof snap.get === 'function' ? snap.get(orderField) : (snap.data?.() || {})[orderField];
                return typeof v !== 'undefined';
              } catch { return false; }
            };
            const docsWithField = docsArr.filter(hasOrderField);
            if (docsWithField.length > 0) setLastDoc(docsWithField[docsWithField.length - 1]);
            else if (docsArr.length === 0) setHasMore(false);
            setLoadingMore(false);
          },
          (err: any) => {
            if (err?.code === "failed-precondition" && String(err?.message || "").toLowerCase().includes("index")) {
              // Fallback sans orderBy: PAS de startAfter (sinon erreur). On recharge juste le bloc courant.
              const qNoOrder = fallback;

              const unsub2 = onSnapshot(
                qNoOrder as Query<DocumentData>,
                (snap2: QuerySnapshot<DocumentData>) => {
                  if (!resolvedOnce) {
                    resolvedOnce = true;
                    pendingStreamsRef.current -= 1;
                    if (pendingStreamsRef.current <= 0) setFiltering(false);
                  }
                  let docsArr = snap2.docs;
                  // Pas de filtrage client prix: tout est fait via Firestore
                  if (clientFilter) docsArr = docsArr.filter((d: any) => clientFilter(d.data()));
                  const mapped = docsArr.map((doc: any) => {
                    const d = doc.data() as any;
                    // -- CHANGEMENT: mapping fallback pour profils coloc --
                    if (isColoc) {
                      const budgetNum = Number(d.budget);
                      const head = [d.profession, typeof d.age === "number" ? `${d.age} ans` : null].filter(Boolean).join(" • ");
                      const tail = (d.description || "").toString();
                      const short = head ? `${head}${tail ? " • " : ""}${tail}` : tail;
                      return {
                        id: doc.id,
                        titre: d.nom || "Recherche colocation",
                        ville: d.ville,
                        prix: Number.isFinite(budgetNum) ? budgetNum : undefined,
                        surface: undefined,
                        description: short.slice(0, 180),
                        imageUrl: d.imageUrl || defaultAnnonceImg,
                        createdAt: d.createdAt,
                      };
                    }
                    // -- annonces (inchangé) --
                    const prixNum = Number(d.prix);
                    return {
                      id: doc.id,
                      titre: d.titre,
                      ville: d.ville,
                      prix: Number.isFinite(prixNum) ? prixNum : undefined,
                      surface: d.surface,
                      description: d.description,
                      imageUrl: d.imageUrl || defaultAnnonceImg,
                      createdAt: d.createdAt,
                      parentSlug: getDocParentSlug(d),
                    };
                  });
                  setAnnonces((prev) => {
                    let arr = resetOnFirstSnapshotRef.current ? [...mapped] : (() => {
                      const byId = new Map(prev.map((x) => [x.id, x]));
                      mapped.forEach((m) => byId.set(m.id, { ...(byId.get(m.id) || {}), ...m }));
                      return Array.from(byId.values());
                    })();
                     const toMs = (x: any) => {
                       const v = x?.createdAt;
                       if (!v) return 0;
                       if (typeof v === "number") return v;
                       if (v?.seconds) return v.seconds * 1000 + (v.nanoseconds ? Math.floor(v.nanoseconds / 1e6) : 0);
                       const p = Date.parse(v);
                       return isNaN(p) ? 0 : p;
                     };
                     if (sortBy === "date") arr.sort((a, b) => toMs(b) - toMs(a));
                     else if (sortBy === "prix-desc") arr.sort((a, b) => (b.prix ?? 0) - (a.prix ?? 0));
                     else arr.sort((a, b) => (a.prix ?? 0) - (b.prix ?? 0));
                      if (resetOnFirstSnapshotRef.current) resetOnFirstSnapshotRef.current = false;
                     return arr;
                   });
                  // Pas d’orderBy en fallback: ne met pas à jour lastDoc pour éviter des curseurs invalides
                  if (docsArr.length === 0) setHasMore(false);
                  setLoadingMore(false);
                },
                (err2: any) => {
                  console.error("[Accueil][onSnapshot][fallback-noOrder][" + label + "]", err2);
                  if (!resolvedOnce) {
                    resolvedOnce = true;
                    pendingStreamsRef.current -= 1;
                    if (pendingStreamsRef.current <= 0) setFiltering(false);
                  }
                  setLoadingMore(false);
                }
              );
              subsRef.current.push(unsub2);
            } else {
              console.error("[Accueil][onSnapshot][" + label + "]", err);
              if (!resolvedOnce) {
                resolvedOnce = true;
                pendingStreamsRef.current -= 1;
                if (pendingStreamsRef.current <= 0) setFiltering(false);
              }
              setLoadingMore(false);
            }
          }
        );
        subsRef.current.push(unsub);
      };

      if (hasCommuneFilter) {
        if (isColoc) {
          // Coloc: on garde le filtrage Firestore par communesSlugs + clientFilter "ET" si besoin
          const field = "communesSlugs";
          const op = "array-contains-any";
          //          const clientFilterCombined = combineFilters(requireAllSelected, undefined);
          //          for (const c of chunks(communesSelected, 10)) {
          // Logique OU: on ne combine pas avec un filtre client “toutes les communes”
          const clientFilterCombined = undefined;
          // Normalise aussi les slugs côté coloc
          for (const c of chunks(normalizedSlugs, 10)) {
            const chunkWhere = where(field as any, op as any, c);
            const qFilterOnly = query(baseColRef, ...commonFiltersWithPrice, chunkWhere);
            const qFilterOnlyNoPrice = query(baseColRef, ...commonFiltersBase, chunkWhere);
            const qOrdered = qWithOrder(qFilterOnly);
            const qPaged = lastDoc && aDocHasOrderField(lastDoc) ? query(qOrdered, startAfter(lastDoc)) : qOrdered;
            attachListener(qPaged as Query<DocumentData>, {
              label: "communes-slugs-coloc",
              clientFilter: clientFilterCombined,
              fallback: qFilterOnly as Query<DocumentData>,
              fallbackNoPrice: qFilterOnlyNoPrice as Query<DocumentData>,
            });
          }
        } else {
          // Annonces: utiliser des requêtes Firestore fiables
          // 1) communeSlug IN [slugs...] (docs récents)
          for (const c of chunks(normalizedSlugs, 10)) {
            const w = where("communeSlug", "in", c);
            const qFilterOnly = query(baseColRef, ...commonFiltersWithPrice, w);
            const qFilterOnlyNoPrice = query(baseColRef, ...commonFiltersBase, w);
            const qOrdered = qWithOrder(qFilterOnly);
            const qPaged = lastDoc && aDocHasOrderField(lastDoc) ? query(qOrdered, startAfter(lastDoc)) : qOrdered;
            attachListener(qPaged as Query<DocumentData>, {
              label: "annonces-communeSlug-in",
              // Sécurité: filtrage client additionnel (évite toute dérive si des données sont incohérentes)
              clientFilter: annoncesClientFilter,
              fallback: qFilterOnly as Query<DocumentData>,
              fallbackNoPrice: qFilterOnlyNoPrice as Query<DocumentData>,
            });
          }
          // 2) ville IN [Noms…] (fallback pour anciennes annonces sans communeSlug)
          const selectedNames = normalizedSlugs
            .map((s) => parentSlugToName[s])
            .filter(Boolean) as string[];
          for (const namesChunk of chunks(selectedNames, 10)) {
            const w = where("ville", "in", namesChunk);
            const qFilterOnly = query(baseColRef, ...commonFiltersWithPrice, w);
            const qFilterOnlyNoPrice = query(baseColRef, ...commonFiltersBase, w);
            const qOrdered = qWithOrder(qFilterOnly);
            const qPaged = lastDoc ? query(qOrdered, startAfter(lastDoc)) : qOrdered;
            attachListener(qPaged as Query<DocumentData>, {
              label: "annonces-ville-in",
              clientFilter: annoncesClientFilter,
              fallback: qFilterOnly as Query<DocumentData>,
              fallbackNoPrice: qFilterOnlyNoPrice as Query<DocumentData>,
            });
          }
          // 3) Fallback client: pas de filtre Firestore, on filtre côté client par slugs normalisés
        }
      } else {
        // Pas de filtre communes: comportement standard
        const qFilterOnly = query(baseColRef, ...commonFiltersWithPrice);
        const qFilterOnlyNoPrice = query(baseColRef, ...commonFiltersBase);
        const qOrdered = qWithOrder(qFilterOnly);
  const qPaged = lastDoc && aDocHasOrderField(lastDoc) ? query(qOrdered, startAfter(lastDoc)) : qOrdered;
        attachListener(qPaged as Query<DocumentData>, {
          label: "page",
          fallback: qFilterOnly as Query<DocumentData>,
          fallbackNoPrice: qFilterOnlyNoPrice as Query<DocumentData>,
        });
      }
    } catch (err: any) {
      console.error("Erreur chargement temps réel :", err);
      setFiltering(false);
      setLoadingMore(false);
    }
  };

  // Reset quand on change d’onglet
  useEffect(() => {
    if (activeHomeTab === null) return;
    clearAllSubs();
    setFirestoreError(null);
    setAnnonces([]);
    setLastDoc(null);
    setHasMore(true);
    // reset filtres ici
    setCommunesSelected([]);
    setVille("");
    setCodePostal("");
    // Ne pas appeler loadAnnonces ici (il sera déclenché par l’effet “filtres”)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHomeTab]);

  // Rechargement quand les filtres changent (sans vider la liste immédiatement)
  useEffect(() => {
    if (activeHomeTab === null) return;
    clearAllSubs();
    setLastDoc(null);
    setHasMore(true);
    setFiltering(true);
    resetOnFirstSnapshotRef.current = true; // remplacera les cartes au premier snapshot
    if (filtersDebounceRef.current) clearTimeout(filtersDebounceRef.current);
    filtersDebounceRef.current = setTimeout(() => {
      loadAnnonces();
    }, 250);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, prixMax, ville, codePostal, communesSelected]);

  // Nettoyage global à l’unmount
  useEffect(() => {
    return () => {
      clearAllSubs();
     if (filtersDebounceRef.current) clearTimeout(filtersDebounceRef.current);
    };
  }, []);

  // NOUVEAU: ouvrir le détail du profil colocataire
  const openColocDetail = async (id: string) => {
    try {
      setColocDetailOpen(true);
      setColocDetailLoading(true);
      setColocDetail(null);
      const ref = doc(db, "colocProfiles", id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setColocDetail({ id: snap.id, ...(snap.data() as any) });
      } else {
        setColocDetail(null);
      }
    } catch (e) {
      console.error("[Accueil][ColocDetail] load error", e);
      setColocDetail(null);
    } finally {
      setColocDetailLoading(false);
    }
  };
  // NOUVEAU: fermer le détail du profil colocataire
  const closeColocDetail = () => {
    setColocDetailOpen(false);
    setColocDetail(null);
    setColocDetailLoading(false);
  };

  // Toggle d'un filtre zone (OU)
  const toggleZoneFilter = (zone: string) => {
    setZoneFilters((prev) => {
      const next = prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone];
      // Union des slugs pour les zones choisies
      const zoneSlugs = Array.from(new Set(next.flatMap((z) => ZONE_TO_SLUGS[z] || [])));
      // Tri stable par nom officiel pour éviter les variations d’ordre
      zoneSlugs.sort((a, b) =>
        (SLUG_TO_NAME[a] || a).localeCompare(SLUG_TO_NAME[b] || b, "fr", { sensitivity: "base" })
      );
      // MAJ groupée pour cohérence UI + requêtes
      setCommunesSelected((prevSlugs) => (sameIds(prevSlugs, zoneSlugs) ? prevSlugs : zoneSlugs));
      setZonesSelected((prevZones) => (sameIds(prevZones, next) ? prevZones : next));
      return next;
    });
  };

  return (
    <main className="min-h-screen p-2 sm:p-6 flex flex-col items-center">
      {/* Ecran de CHOIX initial */}
      {activeHomeTab === null ? (
        <section className="w-full max-w-6xl flex flex-col items-center">
          <h1 className="text-3xl font-bold mb-2 text-center">Que souhaitez-vous rechercher ?</h1>
          <p className="text-slate-600 mb-8 text-center">Choisissez un type de recherche pour commencer.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
            <button
              className="group bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition text-left"
              onClick={() => setActiveHomeTab("annonces")}
            >
              <div className="text-2xl mb-2">🏠</div>
              <h2 className="text-xl font-semibold mb-1">Je cherche une colocation</h2>
              <p className="text-slate-600">Voir les annonces de logements à partager.</p>
              <div className="mt-4 inline-flex items-center gap-2 text-blue-600 group-hover:underline">
                Commencer
                <span>→</span>
              </div>
            </button>
            <button
              className="group bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition text-left"
              onClick={() => setActiveHomeTab("colocataires")}
            >
              <div className="text-2xl mb-2">👥</div>
              <h2 className="text-xl font-semibold mb-1">Je cherche colocataire(s) </h2>
              <p className="text-slate-600">Voir les profils des personnes recherchant une colocation.</p>
              <div className="mt-4 inline-flex items-center gap-2 text-blue-600 group-hover:underline">
                Commencer
                <span>→</span>
              </div>
            </button>
          </div>
        </section>
      ) : (
        <>
          {/* Option: changer de type de recherche */}
          <div className="w-full max-w-7xl flex justify-end mb-2">
            <button
              className="text-sm text-slate-600 underline hover:text-slate-800"
              onClick={() => {
                setActiveHomeTab(null);
                setFirestoreError(null);
                setAnnonces([]);
                setLastDoc(null);
                setHasMore(true);
              }}
            >
              Changer de type de recherche
            </button>
          </div>

          {/* Onglets Accueil (conservés, affichés après le choix) */}
          <div className="w-full max-w-7xl flex gap-2 mb-4">
            <button
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                activeHomeTab === "annonces"
                  ? "bg-blue-600 text-white shadow"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
              onClick={() => setActiveHomeTab("annonces")}
            >
              Annonces
            </button>
            <button
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                activeHomeTab === "colocataires"
                  ? "bg-blue-600 text-white shadow"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
              onClick={() => setActiveHomeTab("colocataires")}
            >
              Colocataires
            </button>
          </div>

          {firestoreError && (
            <div className="w-full max-w-7xl mb-4 px-4 py-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-sm">
              {firestoreError}
            </div>
          )}

          <h1 className="text-3xl font-bold mb-6 text-center">
            {activeHomeTab === "annonces" ? "Annonces de colocation" : "Profils de colocataires"}
          </h1>

          {/* Layout 2 colonnes: filtres à gauche, annonces à droite (sticky filtres) */}
          <div className="w-full max-w-7xl flex flex-col md:flex-row md:items-start gap-6">
            {/* Colonne annonces (droite en ≥md) */}
            <div className="flex-1 min-w-0 md:order-2">
              {/* Indicateur de filtrage en cours */}
              {filtering && (
                <div className="w-full mb-3 text-center text-slate-600 text-sm">
                  Filtrage en cours…
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(Array.isArray(annonces) ? annonces : [])
                  .filter((a: any) => {
                    // Si communes sélectionnées, impose l'appartenance au set normalisé
                    if (selectedParentSlugs.length === 0) return true;
                    const p = a?.parentSlug;
                    return p ? selectedParentSlugs.includes(p) : false;
                  })
                  .filter((a: any) => {
                    if (prixMax === null) return true;
                    if (typeof a?.prix !== "number") return false;
                    return a.prix <= prixMax;
                  })
                  .sort((a: any, b: any) => {
                    if (sortBy === "prix" || sortBy === "prix-desc") {
                      const pa = typeof a?.prix === "number" ? a.prix : Number.POSITIVE_INFINITY;
                      const pb = typeof b?.prix === "number" ? b.prix : Number.POSITIVE_INFINITY;
                      return sortBy === "prix-desc" ? pb - pa : pa - pb;
                    } else {
                      const toMs = (x: any) => {
                        const v = x?.createdAt;
                        if (!v) return 0;
                        if (typeof v === "number") return v;
                        if (v?.seconds) return v.seconds * 1000 + (v.nanoseconds ? Math.floor(v.nanoseconds / 1e6) : 0);
                        const p = Date.parse(v);
                        return isNaN(p) ? 0 : p;
                      };
                      return toMs(b) - toMs(a); // date récente d'abord
                    }
                  })
                  .map((annonce) => {
                    const card = (
                      <AnnonceCard
                        key={annonce.id}
                        id={annonce.id}
                        titre={annonce.titre}
                        ville={annonce.ville}
                        prix={annonce.prix}
                        surface={annonce.surface}
                        description={annonce.description}
                        createdAt={annonce.createdAt}
                        imageUrl={annonce.imageUrl || defaultAnnonceImg}
                      />
                    );
                    // En mode "Colocataires", la carte ouvre le détail
                    return activeHomeTab === "colocataires" ? (
                      <div
                        key={annonce.id}
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          // Intercepte un éventuel <a> à l’intérieur de la carte
                          const target = e.target as HTMLElement;
                          const link = target.closest && target.closest("a");
                          if (link) e.preventDefault();
                          openColocDetail(annonce.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") openColocDetail(annonce.id);
                        }}
                        // Désactive le clic des liens internes de la carte côté CSS (double sécurité)
                        className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg select-none [&_a]:pointer-events-none"
                      >
                        {card}
                      </div>
                    ) : (
                      card
                    );
                  })}

                {loadingMore && (
                  <p className="text-slate-500 text-center mt-4 col-span-full">Chargement...</p>
                )}

                {!hasMore && annonces.length > 0 && (
                  <p className="text-slate-400 text-center mt-4 col-span-full">Toutes les cartes sont affichées.</p>
                )}
              </div>
            </div>

            {/* Colonne filtres (gauche en ≥md) */}
            <div className="w-full md:w-[480px] lg:w-[520px] md:order-1">
              <form
                onSubmit={(e) => {
                  e.preventDefault(); // mise à jour auto: pas d’appel manuel
                }}
                className="sticky top-4 w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-4"
              >
                <div className="flex flex-wrap gap-4 items-end justify-center">
              {/* Commune: saisie libre + ajout multiple */}
              <div className="flex flex-col gap-2">
                <div className="flex items-end gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Commune(s)</label>
                    <input
                      type="text"
                      value={ville}
                      onChange={(e) => onVilleChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setVille("");
                          setCodePostal("");
                        }
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          addTypedCommune();
                        }
                        if (e.key === "Backspace" && !ville) {
                          // supprime le dernier tag si le champ est vide
                          setCommunesSelected((prev) => {
                            if (!prev || prev.length === 0) return prev;
                            const next = prev.slice(0, -1);
                            setZonesSelected((pz) => {
                              const zones = computeZonesFromSlugs(next);
                              return sameIds(pz || [], zones) ? pz : zones;
                            });
                            return next;
                          });
                        }
                      }}
                      onPaste={(e) => {
                        const text = e.clipboardData?.getData("text");
                        if (text && /[\n,;]/.test(text)) {
                          e.preventDefault();
                          addCommunesFromTokens(text);
                        }
                      }}
                      className="border border-gray-300 rounded px-3 py-2 w-56"
                      placeholder="Ex: Saint-Denis"
                      list="communes-reu"
                    />
                  </div>
                  <button
                    type="button"
                    aria-label="Ajouter la commune"
                    title="Ajouter"
                    onClick={addTypedCommune}
                    className="h-9 px-3 rounded border text-sm bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    aria-label="Effacer toutes les communes"
                    title="Effacer tout"
                    disabled={communesSelected.length === 0 && !ville}
                    onClick={() => {
                      setVille("");
                      setCodePostal("");
                      setCommunesSelected([]);
                      setZonesSelected([]);
                    }}
                    className={`h-9 px-3 rounded border text-sm transition ${
                      communesSelected.length || ville
                        ? "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                        : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                    }`}
                  >
                    ✕
                  </button>
                </div>
                {communesSelected.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {communesSelected.map((s) => (
                      <span key={s} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-slate-50 text-slate-700 border border-slate-200">
                        {parentSlugToName[s] || s}
                        <button
                          type="button"
                          className="ml-1 text-slate-500 hover:text-rose-700"
                          aria-label={`Retirer ${parentSlugToName[s] || s}`}
                          onClick={() => {
                            setCommunesSelected((prev) => prev.filter((x) => x !== s));
                            setZonesSelected((prev) => computeZonesFromSlugs((communesSelected || []).filter((x) => x !== s)));
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Suggestions communes (noms + sous-communes) TRIÉES */}
              <datalist id="communes-reu">
                {COMMUNES_CP_SORTED.map((c: { name: string | number | readonly string[] | undefined; cps: any[]; }) => (
                  <option key={`c-${c.name}`} value={c.name}>{`${c.name} (${c.cps[0]})`}</option>
                ))}
                {COMMUNES_CP_SORTED.flatMap((c: { alts: any; name: any; }) =>
                  (c.alts || []).map((a: { name: string | number | readonly string[] | undefined; cp: any; }) => (
                    <option key={`a-${c.name}-${a.name}`} value={a.name}>{`${a.name} (${a.cp})`}</option>
                  ))
                )}
              </datalist>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {activeHomeTab === "annonces" ? "Prix max (€)" : "Budget max (€)"}
                </label>
                <input
                  type="number"
                  value={prixMax ?? ""}
                  onChange={(e) => setPrixMax(Number(e.target.value) || null)}
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                  placeholder={activeHomeTab === "annonces" ? "Ex: 600" : "Ex: 600"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Trier par</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "date" | "prix" | "prix-desc")}
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                >
                  <option value="date">Date récente</option>
                  <option value="prix">{activeHomeTab === "annonces" ? "Prix croissant" : "Budget croissant"}</option>
                  <option value="prix-desc">{activeHomeTab === "annonces" ? "Prix décroissant" : "Budget décroissant"}</option>
                </select>
              </div>

              {/* Mise à jour automatique silencieuse */}

              <button
                type="button"
                onClick={() => {
                  setFirestoreError(null);
                  setVille("");
                  setCodePostal("");
                  setPrixMax(null);
                  setSortBy("date");
                  setCommunesSelected([]);
                  setZonesSelected([]);
                  setAnnonces([]);
                  setLastDoc(null);
                  setHasMore(true);
                  setZoneFilters([]);
                  // Remplacement au 1er snapshot pour éviter les doublons
                  resetOnFirstSnapshotRef.current = true;
                  setFiltering(true);
                  // pas d’appel direct à loadAnnonces: l’effet "filtres" va relancer proprement
                }}
                className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50"
              >
                Réinitialiser
              </button>
            </div>

            {/* NOUVEAU: Filtrer par communes */}
            <div className="mt-2">
              {/* Zones rapides (OU) */}
      <div className="mt-2 grid grid-cols-2 gap-2 text-center justify-items-stretch">
                {Object.keys(GROUPES).map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => toggleZoneFilter(z)}
        className={`w-full px-3 py-1.5 rounded-full text-sm border transition ${
                      zoneFilters.includes(z)
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {z}
                  </button>
                ))}
              </div>
              {showCommuneMap && (
                <div className="mt-3 rounded-2xl border border-slate-200 p-3">
                  <CommuneZoneSelector
                    value={communesSelected}
                    computeZonesFromSlugs={computeZonesFromSlugs}
                    onChange={(slugs, zones = []) => {
                      setCommunesSelected((prev) => (sameIds(prev, slugs as string[]) ? prev : (slugs as string[])));
                      setZonesSelected((prev) => (sameIds(prev, zones as string[]) ? prev : (zones as string[])));
                    }}
                    height={420}
                    className="w-full"
                    alwaysMultiSelect
                  />
                </div>
              )}
              {communesSelected.length > 0 && (
                <p className="mt-2 text-xs text-slate-600">
                  Communes sélectionnées: {communesSelected.join(", ")}
                </p>
              )}
              {zonesSelected.length > 0 && (
                <p className="mt-1 text-xs text-slate-600">
                  Zones sélectionnées: {zonesSelected.join(", ")}
                </p>
              )}
                </div>
              </form>
            </div>
          </div>


          {/* Modal détail profil colocataire */}
          {activeHomeTab === "colocataires" && colocDetailOpen && (
            <div
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
              onMouseDown={(e) => { if (e.target === e.currentTarget) closeColocDetail(); }}
            >
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 relative">
                <button
                  onClick={closeColocDetail}
                  className="absolute top-3 right-3 text-slate-600 hover:text-slate-900"
                  aria-label="Fermer"
                >
                  ✖
                </button>
                <h3 className="text-xl font-semibold mb-4">Profil colocataire</h3>
                {colocDetailLoading ? (
                  <p className="text-slate-600">Chargement…</p>
                ) : !colocDetail ? (
                  <p className="text-slate-600">Profil introuvable.</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-4 items-start">
                      <img
                        src={colocDetail.imageUrl || defaultAnnonceImg}
                        alt={colocDetail.nom || "Profil"}
                        className="w-40 h-28 object-cover rounded-lg border"
                      />
                      <div className="flex-1">
                        <div className="text-2xl font-bold">
                          {colocDetail.nom || "Recherche colocation"}
                        </div>
                        <div className="text-slate-700">
                          {colocDetail.ville || "-"}
                          {typeof colocDetail.budget === "number" && (
                            <span className="ml-2 text-blue-700 font-semibold">
                              • Budget {colocDetail.budget} €
                            </span>
                          )}
                        </div>
                        <div className="text-slate-600 text-sm mt-1">
                          {colocDetail.profession ? colocDetail.profession : ""}
                          {typeof colocDetail.age === "number" ? ` • ${colocDetail.age} ans` : ""}
                          {colocDetail.dateDispo ? ` • Dispo: ${colocDetail.dateDispo}` : ""}
                        </div>
                      </div>
                    </div>

                    {colocDetail.bioCourte && (
                      <div className="text-slate-700">{colocDetail.bioCourte}</div>
                    )}
                    {(colocDetail.genre || colocDetail.orientation) && (
                      <div className="text-sm text-slate-600">
                        {colocDetail.genre ? `Genre: ${colocDetail.genre}` : ""} {colocDetail.orientation ? `• Orientation: ${colocDetail.orientation}` : ""}
                      </div>
                    )}
                    {Array.isArray(colocDetail.langues) && colocDetail.langues.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-slate-700 mb-1">Langues</div>
                        <div className="flex flex-wrap gap-2">
                          {colocDetail.langues.map((l: string) => (
                            <span key={l} className="px-2 py-1 rounded-full text-xs bg-slate-50 text-slate-700 border border-slate-200">{l}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {(colocDetail.prefGenre || colocDetail.prefAgeMin || colocDetail.prefAgeMax) && (
                      <div>
                        <div className="text-sm font-medium text-slate-700 mb-1">Préférences</div>
                        <div className="text-sm text-slate-600">
                          {colocDetail.prefGenre ? `Colocs: ${colocDetail.prefGenre}` : ""}
                          {(colocDetail.prefAgeMin || colocDetail.prefAgeMax) ? ` • Âge: ${colocDetail.prefAgeMin || "?"} - ${colocDetail.prefAgeMax || "?"}` : ""}
                        </div>
                      </div>
                    )}
                    {(typeof colocDetail.accepteFumeurs === "boolean" || typeof colocDetail.accepteAnimaux === "boolean" || colocDetail.rythme || colocDetail.proprete) && (
                      <div>
                        <div className="text-sm font-medium text-slate-700 mb-1">Style de vie</div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {typeof colocDetail.accepteFumeurs === "boolean" && (
                            <span className="px-2 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
                              {colocDetail.accepteFumeurs ? "Accepte fumeurs" : "Non fumeur de préférence"}
                            </span>
                          )}
                          {typeof colocDetail.accepteAnimaux === "boolean" && (
                            <span className="px-2 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
                              {colocDetail.accepteAnimaux ? "Accepte animaux" : "Sans animaux"}
                            </span>
                          )}
                          {colocDetail.rythme && <span className="px-2 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200">Rythme: {colocDetail.rythme}</span>}
                          {colocDetail.proprete && <span className="px-2 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200">Propreté: {colocDetail.proprete}</span>}
                          {colocDetail.sportif && <span className="px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">Sportif</span>}
                          {colocDetail.vegetarien && <span className="px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">Végétarien</span>}
                          {colocDetail.soirees && <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Aime les soirées</span>}
                          {colocDetail.musique && <span className="px-2 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">Musique: {colocDetail.musique}</span>}
                        </div>
                      </div>
                    )}
                    {colocDetail.instagram && (
                      <div className="text-sm">
                        <span className="font-medium text-slate-700">Instagram:</span>{" "}
                        <a href={`https://instagram.com/${String(colocDetail.instagram).replace(/^@/,"")}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                          {colocDetail.instagram}
                        </a>
                      </div>
                    )}

                    {Array.isArray(colocDetail.zones) && colocDetail.zones.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-slate-700 mb-1">Zones recherchées</div>
                        <div className="flex flex-wrap gap-2">
                          {colocDetail.zones.map((z: string) => (
                            <span key={z} className="px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
                              {z}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {Array.isArray(colocDetail.communesSlugs) && colocDetail.communesSlugs.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-slate-700 mb-1">Communes ciblées</div>
                        <div className="flex flex-wrap gap-2">
                          {colocDetail.communesSlugs.map((s: string) => (
                            <span key={s} className="px-2 py-1 rounded-full text-xs bg-slate-50 text-slate-700 border border-slate-200">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {colocDetail.telephone && (
                      <div className="text-sm">
                        <span className="font-medium text-slate-700">Téléphone:</span>{" "}
                        <span className="text-slate-800">{colocDetail.telephone}</span>
                      </div>
                    )}

                    {colocDetail.email && (
                      <div className="text-sm">
                        <span className="font-medium text-slate-700">Email:</span>{" "}
                        <span className="text-slate-800">{colocDetail.email}</span>
                      </div>
                    )}

                    {colocDetail.description && (
                      <div>
                        <div className="text-sm font-medium text-slate-700 mb-1">À propos</div>
                        <p className="text-slate-800 whitespace-pre-line">{colocDetail.description}</p>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        onClick={closeColocDetail}
                        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}

