
"use client";
import ColocProfileModal from "@/components/ColocProfileModal";
import AnnonceDetailModal from "@/components/AnnonceDetailModal";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Image from "next/image";
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
  getCountFromServer,
} from "firebase/firestore";
import type { Query, QuerySnapshot, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import dynamic from "next/dynamic";
import ExpandableImage from "@/components/ExpandableImage";
import AnnonceCard from "@/components/AnnonceCard";
import ColocProfileCard from "@/components/ColocProfileCard";
import ConfirmModal from "@/components/ConfirmModal";
import AnnonceModal from "@/components/AnnonceModal";
// Rôle admin désormais fourni par le contexte d'auth
import { useAuth } from "@/components/AuthProvider";
import { showToast } from "@/lib/toast";
import CommuneZoneSelector from "@/components/CommuneZoneSelector";
import useCommuneCp from "@/hooks/useCommuneCp";
import { preloadReunionFeatures } from "@/lib/reunionGeo";
const ImageLightbox = dynamic(() => import("@/components/ImageLightbox"), { ssr: false });


export default function HomePage() {
  // Helper: compare deux listes de slugs sans tenir compte de l’ordre
  function sameIds(a: string[], b: string[]): boolean {
    if (a === b) return true;
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    const sa = [...a].sort();
    const sb = [...b].sort();
    for (let i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) return false;
    return true;
  }
  // Admin depuis AuthProvider (suivi temps réel Firestore)
  const { isAdmin } = useAuth();
  const [editAnnonce, setEditAnnonce] = useState<any|null>(null);
  const [annonceDetail, setAnnonceDetail] = useState<any|null>(null);
  const [deleteAnnonceId, setDeleteAnnonceId] = useState<string|null>(null);
  const [editColoc, setEditColoc] = useState<any|null>(null);
  const [deleteColocId, setDeleteColocId] = useState<string|null>(null);

  // Rôle fourni par useAuth(); plus besoin de récupérer manuellement
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [galleryIndex, setGalleryIndex] = useState<number>(0);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);

  // État détail profil coloc nécessaire pour la navigation clavier sur lightbox
  const [colocDetail, setColocDetail] = useState<any | null>(null);

  // Keyboard handlers for lightbox (Esc to close, arrows to navigate)
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
  if (e.key === 'ArrowLeft') setGalleryIndex((i: number) => Math.max(0, i - 1));
  if (e.key === 'ArrowRight') setGalleryIndex((i: number) => {
    const len = Array.isArray((colocDetail as any)?.photos) ? ((colocDetail as any).photos as string[]).length : 0;
        return Math.min(len - 1, i + 1);
      });
    };
    try { window.addEventListener('keydown', onKey); } catch {}
    return () => { try { window.removeEventListener('keydown', onKey); } catch {} };
  }, [lightboxOpen, colocDetail]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any | null>(null);

  const [ville, setVille] = useState("");
  const [codePostal, setCodePostal] = useState("");
  const [prixMax, setPrixMax] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "prix" | "prix-desc">("date");

  // NOUVEAU: onglets accueil
  const [activeHomeTab, setActiveHomeTab] = useState<"annonces" | "colocataires" | null>("annonces");
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  // NOUVEAU: communes sélectionnées (slugs)
  const [communesSelected, setCommunesSelected] = useState<string[]>([]);
  const [showCommuneMap] = useState(true);
  const [zonesSelected, setZonesSelected] = useState<string[]>([]); // zones calculées depuis les slugs
  const [zoneFilters, setZoneFilters] = useState<string[]>([]); // zones choisies via boutons rapides

  // NOUVEAU: état et handlers pour le détail du profil colocataire
  const [colocDetailOpen, setColocDetailOpen] = useState(false);
  const [colocDetailLoading, setColocDetailLoading] = useState(false);
  const [filtering, setFiltering] = useState(false);
  // Accordéons UI (section carte unique)
  // Source de la sélection (carte, saisie, zones) pour piloter l'affichage des chips sous le champ
  const [selectionSource, setSelectionSource] = useState<"map" | "input" | "zones" | null>(null);
  // Refonte scroll: marquer pour scroller vers l’ancre résultats au premier snapshot suivant un changement de filtres
  const shouldScrollToResultsOnNextDataRef = useRef(false);

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
  const slugify = (s: string): string =>
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
  const GROUPES: Record<string, string[]> = useMemo(() => ({
    Nord: ["Saint-Denis", "Sainte-Marie", "Sainte-Suzanne"],
    Est: ["Saint-André", "Bras-Panon", "Saint-Benoît", "La Plaine-des-Palmistes", "Sainte-Rose", "Saint-Philippe"],
    Ouest: ["Le Port", "La Possession", "Saint-Paul", "Trois-Bassins", "Saint-Leu", "Les Avirons", "L'Étang-Salé"],
    Sud: ["Saint-Louis", "Saint-Pierre", "Le Tampon", "Entre-Deux", "Petite-Île", "Saint-Joseph"],
    Intérieur: ["Cilaos", "Salazie"],
  }), []);

  // Précharge les zones de la carte en arrière-plan pour une ouverture instantanée
  useEffect(() => {
    preloadReunionFeatures();
  }, []);

  // Charger les compteurs globaux au montage
  useEffect(() => {
    (async () => {
      try {
        const annoncesCount = await getCountFromServer(query(collection(db, 'annonces')));
        setCountAnnoncesTotal(annoncesCount.data().count || 0);
      } catch {}
      try {
        const profilsCount = await getCountFromServer(query(collection(db, 'colocProfiles')));
        setCountProfilsTotal(profilsCount.data().count || 0);
      } catch {}
    })();
  }, []);

  // NOUVEAU: map “nom (commune/sous-commune) -> slug parent de la commune”
  const nameToParentSlug = useMemo(() => {
    const m: Record<string, string> = {};
    (COMMUNES_CP_SORTED as any[]).forEach((c) => {
      const parentSlug = slugify(c.name);
      // La commune pointe vers elle-même (slug canonique)
      m[parentSlug] = parentSlug;
      // Alias sans article (ex: le-/la-/les-/l-)
      const noArticle = parentSlug.replace(/^(l|le|la|les)-/, "");
      if (noArticle && !m[noArticle]) m[noArticle] = parentSlug;
      // Variante compactée (sécurité)
      const compact = noArticle.replace(/-+/g, "-");
      if (compact && !m[compact]) m[compact] = parentSlug;
      (c.alts || []).forEach((a: any) => {
        const alt = slugify(a.name);
        m[alt] = parentSlug; // la sous-commune pointe vers la commune parente
        // Alias pour la sous-commune également
        const altNoArticle = alt.replace(/^(l|le|la|les)-/, "");
        if (altNoArticle && !m[altNoArticle]) m[altNoArticle] = parentSlug;
        const altCompact = altNoArticle.replace(/-+/g, "-");
        if (altCompact && !m[altCompact]) m[altCompact] = parentSlug;
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
  const computeZonesFromSlugs = useCallback((slugs: string[]): string[] => {
    const names = (slugs || []).map((s) => SLUG_TO_NAME[s]).filter(Boolean);
    const zones: string[] = [];
    Object.entries(GROUPES).forEach(([zone, list]) => {
      if (names.some((n) => list.includes(n))) zones.push(zone);
    });
    return zones;
  }, [SLUG_TO_NAME, GROUPES]);

  // NOUVEAU: lister les sous-communes couvertes par les zones sélectionnées (zoneFilters)
  const selectedSubCommunesLabel = useMemo(() => {
    if (!Array.isArray(zoneFilters) || zoneFilters.length === 0) return "";
    const set = new Set<string>();
    for (const z of zoneFilters) {
      const slugs = (ZONE_TO_SLUGS as any)[z] || [];
      for (const s of slugs) {
        const entry = (COMMUNES_CP_SORTED as any[]).find((c) => slugify(c.name) === s);
        const alts = (entry?.alts || []) as Array<{ name: string; cp: string }>;
        alts.forEach((a) => { if (a?.name) set.add(a.name); });
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" })).join(", ");
  }, [zoneFilters, ZONE_TO_SLUGS, COMMUNES_CP_SORTED]);

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
  // onCpChange supprimé (non utilisé)

  // Ajoute la commune saisie (si reconnue) à la sélection multiple
  const addTypedCommune = () => {
    const val = (ville || "").trim();
    if (!val) return;
    const norm = slugify(val);
    const parent = nameToParentSlug[norm];
    if (!parent) return; // non reconnue
  setSelectionSource("input");
    setCommunesSelected((prev: string[]) => {
      const next = Array.from(new Set([...(prev || []), parent]));
      // recalcul zones sur la même base "next"
      setZonesSelected((pz: string[]) => {
        const zones = computeZonesFromSlugs(next as string[]);
        return sameIds((pz || []) as string[], zones) ? pz : zones;
      });
      return sameIds((prev || []) as string[], next) ? prev : next;
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
  setSelectionSource("input");
    setCommunesSelected((prev: string[]) => {
      const set = new Set(prev || []);
      for (const t of tokens) {
        const norm = slugify(t);
        const parent = nameToParentSlug[norm];
        if (parent) set.add(parent);
      }
      const next = Array.from(set);
      if (!sameIds((prev || []) as string[], next)) added = next.length - (prev?.length || 0);
      setZonesSelected((pz: string[]) => {
        const zones = computeZonesFromSlugs(next as string[]);
        return sameIds((pz || []) as string[], zones) ? pz : zones;
      });
      return sameIds((prev || []) as string[], next) ? prev : next;
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
  // Mémorise la position du scroll pendant les changements de filtres
  const scrollPosBeforeFilterRef = useRef<number | null>(null);
  // Référence du conteneur de la carte (pour stabiliser sa position visible)
  const mapWrapRef = useRef<HTMLDivElement | null>(null);
  const mapTopBeforeRef = useRef<number | null>(null);
  // Ancre au-dessus des onglets
  const tabsTopRef = useRef<HTMLDivElement | null>(null);
  // Référence pour ancrer le haut de la liste des résultats
  const resultsTopRef = useRef<HTMLDivElement | null>(null);
  // Référence et observer pour le bloc des chips "Communes sélectionnées"
  const selectedChipsRef = useRef<HTMLDivElement | null>(null);
  const chipsPrevHRef = useRef<number>(0);
  const chipsRORef = useRef<ResizeObserver | null>(null);
  // Sentinel de fin de liste pour scroll infini
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  // Throttle pour l'IntersectionObserver (évite les déclenchements en rafale)
  const lastIoTriggerAtRef = useRef<number>(0);
  // Réfs pour menu d'ancrage (zone/budget/commune)
  const zonesBlockRef = useRef<HTMLDivElement | null>(null);
  const communeBlockRef = useRef<HTMLDivElement | null>(null);
  const budgetBlockRef = useRef<HTMLDivElement | null>(null);
  // Modes d'affichage des filtres principaux (multi-sélection). [] = menu seul
  const [filterMenuModes, setFilterMenuModes] = useState<Array<"map" | "commune" | "budget" | "criteres">>([]);
  const hasMode = useCallback((m: "map" | "commune" | "budget" | "criteres") => filterMenuModes.includes(m), [filterMenuModes]);
  const toggleMode = useCallback((m: "map" | "commune" | "budget" | "criteres") => {
    setFilterMenuModes((prev: Array<"map" | "commune" | "budget" | "criteres">) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);
  }, []);

  // Critères (onglet colocataires)
  const [critAgeMin, setCritAgeMin] = useState<number | null>(null);
  const [critAgeMax, setCritAgeMax] = useState<number | null>(null);
  const [critProfession, setCritProfession] = useState<string>("");

  // Compteurs
  const [countAnnoncesTotal, setCountAnnoncesTotal] = useState<number | null>(null);
  const [countProfilsTotal, setCountProfilsTotal] = useState<number | null>(null);
  const [countFiltered, setCountFiltered] = useState<number | null>(null);

  const clearAllSubs = () => {
  subsRef.current.forEach((u: () => void) => { try { u(); } catch {} });
    subsRef.current = [];
    // IMPORTANT: libérer le blocage de loadAnnonces
    setLoadingMore(false);
    // Stopper l’indicateur si on nettoie au milieu d’un filtrage
    setFiltering(false);
  };

  // Helper: déduire le slug parent de l’annonce depuis communeSlug ou ville
  const getDocParentSlug = useCallback((d: any) => {
  // Priorité au communeSlug (plus fiable), fallback sur la ville
  const raw = d?.communeSlug || d?.ville || "";
    const s = slugify(raw);
    return nameToParentSlug[s] || s;
  }, [nameToParentSlug]);

  // Liste normalisée des slugs sélectionnés (disponible au rendu)
  const selectedParentSlugs = useMemo(() => {
    return Array.from(
      new Set(
        (communesSelected || [])
          .map((s: string) => altSlugToCanonical[s] || s)
          .filter(Boolean)
      )
    );
  }, [communesSelected, altSlugToCanonical]);

  // Fallback image pour profils colocataires (utilisé uniquement pour l'UI coloc)
  const defaultColocImg = "/images/coloc-holder.svg";

  const loadAnnonces = useCallback(async (append: boolean = false) => {
    // Ne rien charger si aucun choix n’a été fait
    if (activeHomeTab === null) return;
    if (loadingMore || !hasMore || firestoreError) return;
    // Debug: trace des appels
    try { console.debug('[Accueil] loadAnnonces called', { append, activeHomeTab, loadingMore, hasMore, firestoreError, filtering }); } catch {}
  
    setLoadingMore(true);
    if (!append) {
      setFiltering(true);
      pendingStreamsRef.current = 0;
    }
    // Ne rien charger si aucun choix n’a été fait
    if (activeHomeTab === null) return;
    if (loadingMore || !hasMore || firestoreError) return;
  // Debug: trace des appels
  try { console.debug('[Accueil] loadAnnonces called', { append, activeHomeTab, loadingMore, hasMore, firestoreError, filtering }); } catch {}

    setLoadingMore(true);
    if (!append) {
      setFiltering(true);
      pendingStreamsRef.current = 0;
    }

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

  const PAGE_SIZE = 15;
      const qWithOrder = (qBase: Query<DocumentData>) => {
        const direction = sortBy === "date" ? "desc" : sortBy === "prix-desc" ? "desc" : "asc";
        return query(qBase, orderBy(orderField, direction as any), limit(PAGE_SIZE));
      };

      // Helper: vérifier que le curseur possède bien le champ d’ordre
      const aDocHasOrderField = (d: any): boolean => {
        try {
          const v = typeof d.get === 'function' ? d.get(orderField) : (d?.data?.() || {})[orderField];
          return typeof v !== 'undefined';
        } catch { return false; }
      };

      // Filtre client "ET" pour coloc (toutes les communes sélectionnées)
  // requireAllSelected supprimé (non utilisé)

      // Filtre client pour annonces: slug parent ∈ communesSelected
      const annoncesClientFilter =
        !isColoc && hasCommuneFilter
          ? (d: any) => normalizedSlugs.includes(getDocParentSlug(d))
          : undefined;

      // Filtre prix client (utilisé si l’index composite manque)
  // clientPriceFilter supprimé (non utilisé)

  // combineFilters supprimé (non utilisé)

      const attachListener = (
        qOrdered: Query<DocumentData>,
        {
          label,
          clientFilter,
          fallback,
        }: {
          label: string;
          clientFilter?: (d: any) => boolean;
          fallback: Query<DocumentData>;
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
                // Déduire un slug parent pour la localisation (marqueur carte)
                let parentSlug: string | undefined;
                const slugsArr = Array.isArray((d as any).communesSlugs) ? (d as any).communesSlugs as string[] : [];
                if (slugsArr.length > 0) {
                  const s0 = altSlugToCanonical[slugsArr[0]] || slugsArr[0];
                  parentSlug = s0;
                } else if (d.ville) {
                  const s = slugify(String(d.ville));
                  parentSlug = nameToParentSlug[s] || s;
                }
                // Zones recherchées (priorité au champ zones, sinon déduction depuis communesSlugs)
                const zonesFromSlugs = slugsArr.length
                  ? computeZonesFromSlugs(slugsArr.map((s) => altSlugToCanonical[s] || s))
                  : [];
                const zonesArr: string[] = Array.isArray((d as any).zones) && (d as any).zones.length
                  ? ((d as any).zones as string[])
                  : zonesFromSlugs;
                const zonesLabel = zonesArr && zonesArr.length ? zonesArr.join(", ") : (d.ville || "-");
                return {
                  id: doc.id,
                  titre: d.nom || "Recherche colocation",
                  ville: zonesLabel, // Affiche les zones recherchées à la place de la commune
                  prix: Number.isFinite(budgetNum) ? budgetNum : undefined, // AnnonceCard affiche “prix” -> budget ici
                  surface: undefined,
                  description: short.slice(0, 180), // extrait court
                  imageUrl: d.imageUrl || defaultAnnonceImg,
                  createdAt: d.createdAt,
                  parentSlug,
                  zonesLabel,
                  subCommunesLabel: selectedSubCommunesLabel || undefined,
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
                subCommunesLabel: selectedSubCommunesLabel || undefined,
              };
            });
            setAnnonces((prev: any[]) => {
              // Premier snapshot après changement de filtres: remplacer entièrement
              const arr = resetOnFirstSnapshotRef.current ? [...mapped] : (() => {
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
              if (sortBy === "date") arr.sort((a: any, b: any) => toMs(b) - toMs(a));
              else if (sortBy === "prix-desc") arr.sort((a: any, b: any) => (b.prix ?? 0) - (a.prix ?? 0));
              else arr.sort((a: any, b: any) => (a.prix ?? 0) - (b.prix ?? 0));
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
            if (docsArr.length < PAGE_SIZE) setHasMore(false);
            setLoadingMore(false);

            // NOUVEAU: scroller vers les résultats au premier snapshot suivant un changement de filtres
            if (shouldScrollToResultsOnNextDataRef.current) {
              try {
                const el = resultsTopRef.current;
                if (el && typeof el.scrollIntoView === 'function') {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else if (typeof window !== 'undefined') {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              } catch {
                try { window.scrollTo(0, 0); } catch {}
              } finally {
                shouldScrollToResultsOnNextDataRef.current = false;
              }
            }
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
                      let parentSlug: string | undefined;
                      const slugsArr = Array.isArray((d as any).communesSlugs) ? (d as any).communesSlugs as string[] : [];
                      if (slugsArr.length > 0) {
                        const s0 = altSlugToCanonical[slugsArr[0]] || slugsArr[0];
                        parentSlug = s0;
                      } else if (d.ville) {
                        const s = slugify(String(d.ville));
                        parentSlug = nameToParentSlug[s] || s;
                      }
                      const zonesFromSlugs = slugsArr.length
                        ? computeZonesFromSlugs(slugsArr.map((s) => altSlugToCanonical[s] || s))
                        : [];
                      const zonesArr: string[] = Array.isArray((d as any).zones) && (d as any).zones.length
                        ? ((d as any).zones as string[])
                        : zonesFromSlugs;
                      const zonesLabel = zonesArr && zonesArr.length ? zonesArr.join(", ") : (d.ville || "-");
                      return {
                        id: doc.id,
                        titre: d.nom || "Recherche colocation",
                        ville: zonesLabel,
                        prix: Number.isFinite(budgetNum) ? budgetNum : undefined,
                        surface: undefined,
                        description: short.slice(0, 180),
                        imageUrl: d.imageUrl || defaultAnnonceImg,
                        createdAt: d.createdAt,
                        parentSlug,
                        zonesLabel,
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
                    const arr = resetOnFirstSnapshotRef.current ? [...mapped] : (() => {
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

                  // NOUVEAU: scroller vers les résultats au premier snapshot (fallback)
                  if (shouldScrollToResultsOnNextDataRef.current) {
                    try {
                      const el = resultsTopRef.current;
                      if (el && typeof el.scrollIntoView === 'function') {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      } else if (typeof window !== 'undefined') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    } catch {
                      try { window.scrollTo(0, 0); } catch {}
                    } finally {
                      shouldScrollToResultsOnNextDataRef.current = false;
                    }
                  }
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
            // qFilterOnlyNoPrice supprimé (non utilisé)
            const qOrdered = qWithOrder(qFilterOnly);
            const qPaged = lastDoc && aDocHasOrderField(lastDoc) ? query(qOrdered, startAfter(lastDoc)) : qOrdered;
            if (append) {
              let skipBranch = false;
              try {
                // Ensure we page after lastDoc if possible; if startAfter fails, disable pagination for this branch
                let qForGet: Query<DocumentData> = qPaged as Query<DocumentData>;
                try {
                  if (lastDoc) qForGet = query(qOrdered, startAfter(lastDoc));
                } catch (e) {
                  try { console.debug('[Accueil][append][communes-slugs-coloc] startAfter failed, disabling pagination for this branch', e); } catch {}
                  setHasMore(false);
                  setLoadingMore(false);
                  skipBranch = true;
                }
                if (!skipBranch) {
                  const snap = await getDocs(qForGet as Query<DocumentData>);
                try { console.debug('[Accueil][append][communes-slugs-coloc] getDocs result', { snapLength: snap.docs.length }); } catch {}
                const docsArr = snap.docs.filter((d: any) => {
                  if (typeof clientFilterCombined === 'function') return (clientFilterCombined as any)(d.data());
                  return true;
                });
                if (docsArr.length) {
                  setAnnonces((prev: any[]) => {
                    const ids = new Set(prev.map((x: any) => x.id));
                    const items = docsArr.map((doc: any) => {
                      const d = doc.data() as any;
                      const budgetNum = Number(d.budget);
                      const head = [d.profession, typeof d.age === "number" ? `${d.age} ans` : null].filter(Boolean).join(" • ");
                      const tail = (d.description || "").toString();
                      const short = head ? `${head}${tail ? " • " : ""}${tail}` : tail;
                      let parentSlug: string | undefined;
                      const slugsArr = Array.isArray((d as any).communesSlugs) ? (d as any).communesSlugs as string[] : [];
                      if (slugsArr.length > 0) {
                        const s0 = altSlugToCanonical[slugsArr[0]] || slugsArr[0];
                        parentSlug = s0;
                      } else if (d.ville) {
                        const s = slugify(String(d.ville));
                        parentSlug = nameToParentSlug[s] || s;
                      }
                      const zonesFromSlugs = slugsArr.length
                        ? computeZonesFromSlugs(slugsArr.map((s) => altSlugToCanonical[s] || s))
                        : [];
                      const zonesArr: string[] = Array.isArray((d as any).zones) && (d as any).zones.length
                        ? ((d as any).zones as string[])
                        : zonesFromSlugs;
                      const zonesLabel = zonesArr && zonesArr.length ? zonesArr.join(", ") : (d.ville || "-");
                      return {
                        id: doc.id,
                        titre: d.nom || "Recherche colocation",
                        ville: zonesLabel,
                        prix: Number.isFinite(budgetNum) ? budgetNum : undefined,
                        surface: undefined,
                        description: short.slice(0, 180),
                        imageUrl: d.imageUrl || defaultAnnonceImg,
                        createdAt: d.createdAt,
                        parentSlug,
                        zonesLabel,
                        subCommunesLabel: selectedSubCommunesLabel || undefined,
                      };
                    });
                    const merged = [...prev, ...items.filter(i => !ids.has(i.id))];
                    // Tri identique à celui du listener
                    const toMs = (x: any) => {
                      const v = x?.createdAt;
                      if (!v) return 0;
                      if (typeof v === "number") return v;
                      if (v?.seconds) return v.seconds * 1000 + (v.nanoseconds ? Math.floor(v.nanoseconds / 1e6) : 0);
                      const p = Date.parse(v);
                      return isNaN(p) ? 0 : p;
                    };
                    if (sortBy === "date") merged.sort((a, b) => toMs(b) - toMs(a));
                    else if (sortBy === "prix-desc") merged.sort((a, b) => (b.prix ?? 0) - (a.prix ?? 0));
                    else merged.sort((a, b) => (a.prix ?? 0) - (b.prix ?? 0));
                    return merged;
                  });
                }
                const docsWithField = snap.docs.filter((snapDoc: any) => {
                  try {
                    const v = typeof snapDoc.get === 'function' ? snapDoc.get(orderField) : (snapDoc.data?.() || {})[orderField];
                    return typeof v !== 'undefined';
                  } catch { return false; }
                });
                try { console.debug('[Accueil][append][communes-slugs-coloc] docsWithField', { docsWithField: docsWithField.length, newLastId: docsWithField.length ? (docsWithField[docsWithField.length - 1].id) : null }); } catch {}
                if (docsWithField.length > 0) setLastDoc(docsWithField[docsWithField.length - 1]);
                if (snap.docs.length < PAGE_SIZE) setHasMore(false);
                setLoadingMore(false);
                }
              } catch (e) {
                console.error('[Accueil][loadAnnonces][append][communes-slugs-coloc]', e);
                setLoadingMore(false);
              }
              if (skipBranch) break;
            } else {
              attachListener(qPaged as Query<DocumentData>, {
                label: "communes-slugs-coloc",
                clientFilter: clientFilterCombined,
                fallback: qFilterOnly as Query<DocumentData>,
              });
            }
          }
        } else {
          // Annonces: utiliser des requêtes Firestore fiables
          // 1) communeSlug IN [slugs...] (docs récents)
          for (const c of chunks(normalizedSlugs, 10)) {
            const w = where("communeSlug", "in", c);
            const qFilterOnly = query(baseColRef, ...commonFiltersWithPrice, w);
            // qFilterOnlyNoPrice supprimé (non utilisé)
            const qOrdered = qWithOrder(qFilterOnly);
            const qPaged = lastDoc && aDocHasOrderField(lastDoc) ? query(qOrdered, startAfter(lastDoc)) : qOrdered;
            if (append) {
              let skipBranch = false;
              try {
                let qForGet: Query<DocumentData> = qPaged as Query<DocumentData>;
                try {
                  if (lastDoc) qForGet = query(qOrdered, startAfter(lastDoc));
                } catch (e) {
                  try { console.debug('[Accueil][append][annonces-communeSlug-in] startAfter failed, disabling pagination for this branch', e); } catch {}
                  setHasMore(false);
                  setLoadingMore(false);
                  skipBranch = true;
                }
                if (!skipBranch) {
                const snap = await getDocs(qForGet as Query<DocumentData>);
                try { console.debug('[Accueil][append][annonces-communeSlug-in] getDocs result', { snapLength: snap.docs.length }); } catch {}
                const docsArr = snap.docs.filter((d: any) => {
                  if (typeof annoncesClientFilter === 'function') return (annoncesClientFilter as any)(d.data());
                  return true;
                });
                if (docsArr.length) {
                  setAnnonces((prev) => {
                    const ids = new Set(prev.map((x) => x.id));
                    const items = docsArr.map((doc: any) => {
                      const d = doc.data() as any;
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
                        subCommunesLabel: selectedSubCommunesLabel || undefined,
                      };
                    });
                    const merged = [...prev, ...items.filter(i => !ids.has(i.id))];
                    const toMs = (x: any) => {
                      const v = x?.createdAt;
                      if (!v) return 0;
                      if (typeof v === "number") return v;
                      if (v?.seconds) return v.seconds * 1000 + (v.nanoseconds ? Math.floor(v.nanoseconds / 1e6) : 0);
                      const p = Date.parse(v);
                      return isNaN(p) ? 0 : p;
                    };
                    if (sortBy === "date") merged.sort((a, b) => toMs(b) - toMs(a));
                    else if (sortBy === "prix-desc") merged.sort((a, b) => (b.prix ?? 0) - (a.prix ?? 0));
                    else merged.sort((a, b) => (a.prix ?? 0) - (b.prix ?? 0));
                    return merged;
                  });
                }
                const docsWithField = snap.docs.filter((snapDoc: any) => {
                  try {
                    const v = typeof snapDoc.get === 'function' ? snapDoc.get(orderField) : (snapDoc.data?.() || {})[orderField];
                    return typeof v !== 'undefined';
                  } catch { return false; }
                });
                try { console.debug('[Accueil][append][annonces-communeSlug-in] docsWithField', { docsWithField: docsWithField.length, newLastId: docsWithField.length ? (docsWithField[docsWithField.length - 1].id) : null }); } catch {}
                if (docsWithField.length > 0) setLastDoc(docsWithField[docsWithField.length - 1]);
                if (snap.docs.length < PAGE_SIZE) setHasMore(false);
                setLoadingMore(false);
                }
              } catch (e) {
                console.error('[Accueil][loadAnnonces][append][annonces-communeSlug-in]', e);
                setLoadingMore(false);
              }
              if (skipBranch) break;
            } else {
              attachListener(qPaged as Query<DocumentData>, {
                label: "annonces-communeSlug-in",
                // Sécurité: filtrage client additionnel (évite toute dérive si des données sont incohérentes)
                clientFilter: annoncesClientFilter,
                fallback: qFilterOnly as Query<DocumentData>,
              });
            }
          }
          // 2) ville IN [Noms…] (fallback pour anciennes annonces sans communeSlug)
          const selectedNames = normalizedSlugs
            .map((s) => parentSlugToName[s])
            .filter(Boolean) as string[];
          for (const namesChunk of chunks(selectedNames, 10)) {
            const w = where("ville", "in", namesChunk);
            const qFilterOnly = query(baseColRef, ...commonFiltersWithPrice, w);
            // qFilterOnlyNoPrice supprimé (non utilisé)
            const qOrdered = qWithOrder(qFilterOnly);
            const qPaged = lastDoc ? query(qOrdered, startAfter(lastDoc)) : qOrdered;
            if (append) {
              let skipBranch = false;
              try {
                let qForGet: Query<DocumentData> = qPaged as Query<DocumentData>;
                try {
                  if (lastDoc) qForGet = query(qOrdered, startAfter(lastDoc));
                } catch (e) {
                  try { console.debug('[Accueil][append][annonces-communeSlug-in] startAfter failed (ville), disabling pagination for this branch', e); } catch {}
                  setHasMore(false);
                  setLoadingMore(false);
                  skipBranch = true;
                }
                if (!skipBranch) {
                const snap = await getDocs(qForGet as Query<DocumentData>);
                try { console.debug('[Accueil][append][annonces-communeSlug-in] getDocs result (ville)', { snapLength: snap.docs.length }); } catch {}
                const docsArr = snap.docs.filter((d: any) => {
                  if (annoncesClientFilter) return annoncesClientFilter(d.data());
                  return true;
                });
                if (docsArr.length) {
                  setAnnonces((prev) => {
                    const ids = new Set(prev.map((x) => x.id));
                    const items = docsArr.map((doc: any) => {
                      const d = doc.data() as any;
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
                        subCommunesLabel: selectedSubCommunesLabel || undefined,
                      };
                    });
                    const merged = [...prev, ...items.filter(i => !ids.has(i.id))];
                    const toMs = (x: any) => {
                      const v = x?.createdAt;
                      if (!v) return 0;
                      if (typeof v === "number") return v;
                      if (v?.seconds) return v.seconds * 1000 + (v.nanoseconds ? Math.floor(v.nanoseconds / 1e6) : 0);
                      const p = Date.parse(v);
                      return isNaN(p) ? 0 : p;
                    };
                    if (sortBy === "date") merged.sort((a, b) => toMs(b) - toMs(a));
                    else if (sortBy === "prix-desc") merged.sort((a, b) => (b.prix ?? 0) - (a.prix ?? 0));
                    else merged.sort((a, b) => (a.prix ?? 0) - (b.prix ?? 0));
                    return merged;
                  });
                }
                const docsWithField = snap.docs.filter((snapDoc: any) => {
                  try {
                    const v = typeof snapDoc.get === 'function' ? snapDoc.get(orderField) : (snapDoc.data?.() || {})[orderField];
                    return typeof v !== 'undefined';
                  } catch { return false; }
                });
                try { console.debug('[Accueil][append][annonces-ville-in] docsWithField', { docsWithField: docsWithField.length, newLastId: docsWithField.length ? (docsWithField[docsWithField.length - 1].id) : null }); } catch {}
                if (docsWithField.length > 0) setLastDoc(docsWithField[docsWithField.length - 1]);
                if (snap.docs.length < PAGE_SIZE) setHasMore(false);
                setLoadingMore(false);
                }
              } catch (e) {
                console.error('[Accueil][loadAnnonces][append][annonces-ville-in]', e);
                setLoadingMore(false);
              }
              if (skipBranch) break;
            } else {
              attachListener(qPaged as Query<DocumentData>, {
                label: "annonces-ville-in",
                clientFilter: annoncesClientFilter,
                fallback: qFilterOnly as Query<DocumentData>,
              });
            }
          }
          // 3) Fallback client: pas de filtre Firestore, on filtre côté client par slugs normalisés
        }
      } else {
        // Pas de filtre communes: comportement standard
  const qFilterOnly = query(baseColRef, ...commonFiltersWithPrice);
  // qFilterOnlyNoPrice supprimé (non utilisé)
  const qOrdered = qWithOrder(qFilterOnly);
        // Si on est en affichage total par défaut, on ne pagine pas
        const noExtraCriteria = isColoc
          ? (critAgeMin === null && critAgeMax === null && !critProfession && !ville)
          : (!ville && !codePostal);
        const isDefaultAll = !hasCommuneFilter && prixMax === null && noExtraCriteria;
  const qPaged = (!isDefaultAll && lastDoc && aDocHasOrderField(lastDoc)) ? query(qOrdered, startAfter(lastDoc)) : qOrdered;
  if (append) {
      try {
            let qForGet: Query<DocumentData> = qPaged as Query<DocumentData>;
            try {
              if (lastDoc) qForGet = query(qOrdered, startAfter(lastDoc));
                } catch (e) {
              try { console.debug('[Accueil][append][page] startAfter failed, disabling pagination for this branch', e); } catch {}
                  setHasMore(false);
                  setLoadingMore(false);
                  // no-op: skipBranch flag not used further
            }
            const snap = await getDocs(qForGet as Query<DocumentData>);
            try { console.debug('[Accueil][append][page] getDocs result', { snapLength: snap.docs.length }); } catch {}
            if (snap.docs.length) {
              setAnnonces((prev) => {
                const ids = new Set(prev.map((x) => x.id));
                const items = snap.docs.map((doc: any) => {
                  const d = doc.data() as any;
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
                    subCommunesLabel: selectedSubCommunesLabel || undefined,
                  };
                });
                const merged = [...prev, ...items.filter(i => !ids.has(i.id))];
                const toMs = (x: any) => {
                  const v = x?.createdAt;
                  if (!v) return 0;
                  if (typeof v === "number") return v;
                  if (v?.seconds) return v.seconds * 1000 + (v.nanoseconds ? Math.floor(v.nanoseconds / 1e6) : 0);
                  const p = Date.parse(v);
                  return isNaN(p) ? 0 : p;
                };
                if (sortBy === "date") merged.sort((a, b) => toMs(b) - toMs(a));
                else if (sortBy === "prix-desc") merged.sort((a, b) => (b.prix ?? 0) - (a.prix ?? 0));
                else merged.sort((a, b) => (a.prix ?? 0) - (b.prix ?? 0));
                return merged;
              });
            }
            const docsWithField = snap.docs.filter((snapDoc: any) => {
              try {
                const v = typeof snapDoc.get === 'function' ? snapDoc.get(orderField) : (snapDoc.data?.() || {})[orderField];
                return typeof v !== 'undefined';
              } catch { return false; }
            });
            if (docsWithField.length > 0) setLastDoc(docsWithField[docsWithField.length - 1]);
            if (snap.docs.length < PAGE_SIZE) setHasMore(false);
            setLoadingMore(false);
          } catch (e) {
            console.error('[Accueil][loadAnnonces][append][page]', e);
            setLoadingMore(false);
          }
        } else {
          attachListener(qPaged as Query<DocumentData>, {
            label: "page",
            fallback: qFilterOnly as Query<DocumentData>,
          });
        }
      }
    } catch (err: any) {
      console.error("Erreur chargement temps réel :", err);
      setFiltering(false);
      setLoadingMore(false);
    }
  }, [activeHomeTab, loadingMore, hasMore, firestoreError, sortBy, prixMax, ville, codePostal, communesSelected, altSlugToCanonical, parentSlugToName, selectedSubCommunesLabel, critAgeMin, critAgeMax, critProfession, lastDoc, computeZonesFromSlugs, defaultAnnonceImg, filtering, getDocParentSlug, nameToParentSlug]);

  // Reset quand on change d’onglet
  useEffect(() => {
    if (activeHomeTab === null) return;
    // Si les onglets sont masqués derrière le header, remonter juste jusqu'à l'ancre
    try {
      const anchor = tabsTopRef.current;
      if (anchor) {
        const rect = anchor.getBoundingClientRect();
        if (rect && rect.top < 12) {
          anchor.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
      }
    } catch {}
    clearAllSubs();
    setFirestoreError(null);
    setAnnonces([]);
  setLastDoc(null);
  setHasMore(true);
    // Désactiver le tri par date pour l’onglet colocataires: par défaut trier par budget croissant
    if (activeHomeTab === "colocataires" && sortBy === "date") {
      setSortBy("prix");
    }
    // reset filtres ici
    setCommunesSelected([]);
    setVille("");
    setCodePostal("");
  // reset critères coloc
  setCritAgeMin(null);
  setCritAgeMax(null);
  setCritProfession("");
    // Ne pas appeler loadAnnonces ici (il sera déclenché par l’effet “filtres”)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHomeTab]);

  // Rechargement quand les filtres changent (sans vider la liste immédiatement)
  useEffect(() => {
    if (activeHomeTab === null) return;
    // Marque pour scroller après le premier snapshot reçu
    shouldScrollToResultsOnNextDataRef.current = true;
    // Neutralise les anciennes compensations de scroll et d'ancrage carte
    scrollPosBeforeFilterRef.current = null;
    mapTopBeforeRef.current = null;
    clearAllSubs();
    setLastDoc(null);
    setHasMore(true);
    setFiltering(true);
    resetOnFirstSnapshotRef.current = true; // remplacera les cartes au premier snapshot
    if (filtersDebounceRef.current) clearTimeout(filtersDebounceRef.current);
    filtersDebounceRef.current = setTimeout(() => {
      loadAnnonces(false);
    }, 250);

    // Met à jour un compteur filtré approximatif basé sur Firestore count (sans pagination)
    (async () => {
      try {
        const isColoc = activeHomeTab === 'colocataires';
        const col = collection(db, isColoc ? 'colocProfiles' : 'annonces');
        const filters: any[] = [];
        if (prixMax !== null) filters.push(where(isColoc ? 'budget' : 'prix', '<=', prixMax));
        if (!isColoc) {
          if (codePostal) filters.push(where('codePostal', '==', codePostal));
          else if (ville) filters.push(where('ville', '==', ville));
        } else {
          if (ville) filters.push(where('ville', '==', ville));
          // critères client (age/profession) non indexés: on ne les ajoute pas ici car count exige un index valide
        }
        // communes sélectionnées: utiliser un count sur un IN/array-contains-any si possible pour les chunks (prendre la somme des chunks)
        let total = 0;
        const slugs = selectedParentSlugs;
        if (slugs.length > 0) {
          const chunks = (arr: string[], size = 10) => {
            const out: string[][] = []; for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size)); return out;
          };
          const field = isColoc ? 'communesSlugs' : 'communeSlug';
          const op = isColoc ? 'array-contains-any' : 'in';
          for (const c of chunks(slugs, 10)) {
            try {
              const qCount = query(col, ...filters, where(field as any, op as any, c));
              const snap = await getCountFromServer(qCount);
              total += snap.data().count || 0;
            } catch {}
          }
          setCountFiltered(total);
        } else {
          try {
            const qCount = query(col, ...filters);
            const snap = await getCountFromServer(qCount);
            total = snap.data().count || 0;
            setCountFiltered(total);
          } catch {
            setCountFiltered(null);
          }
        }
      } catch {
        setCountFiltered(null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, prixMax, ville, codePostal, communesSelected, critAgeMin, critAgeMax, critProfession]);

  // Liste affichée (filtrée + triée) utilisée à la fois pour l'entête et la grille
  const displayedAnnonces = useMemo(() => {
    let list = (Array.isArray(annonces) ? annonces : [])
      .filter((a: any) => {
        if (selectedParentSlugs.length === 0) return true;
        const p = a?.parentSlug;
        return p ? selectedParentSlugs.includes(p) : false;
      })
      .filter((a: any) => {
        if (prixMax === null) return true;
        if (typeof a?.prix !== "number") return false;
        return a.prix <= prixMax;
      });

    // Filtrage client additionnel pour l’onglet colocataires (critères)
    if (activeHomeTab === 'colocataires') {
      list = list.filter((a: any) => {
        // Le mapping coloc place le "prix" dans a.prix (budget) et calcule un short desc dans a.description
        const age = Number((a as any).age ?? (a as any).Age ?? NaN);
        const profession = String((a as any).profession ?? '').toLowerCase();
        if (critAgeMin !== null && !(Number.isFinite(age) && age >= critAgeMin)) return false;
        if (critAgeMax !== null && !(Number.isFinite(age) && age <= critAgeMax)) return false;
        if (critProfession && !profession.includes(critProfession.toLowerCase())) return false;
        return true;
      });
    }

    list = list.sort((a: any, b: any) => {
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
          return toMs(b) - toMs(a);
        }
      });
    return list;
  }, [annonces, selectedParentSlugs, prixMax, sortBy, activeHomeTab, critAgeMin, critAgeMax, critProfession]);

  // Quand le filtrage se termine, restaurer la position de scroll initiale
  useEffect(() => {
    // Nouveau comportement: ne restaure pas l'ancienne position; rester en haut de la liste
    if (!filtering) {
      scrollPosBeforeFilterRef.current = null;
      mapTopBeforeRef.current = null;
    }
  }, [filtering]);

  // Observer la hauteur du bloc des chips et compenser instantanément les variations
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Si la source est la carte, les chips sont masqués: débrancher l'observer
    if (selectionSource === "map") {
      if (chipsRORef.current) {
        chipsRORef.current.disconnect();
        chipsRORef.current = null;
      }
      chipsPrevHRef.current = 0;
      return;
    }
    const el = selectedChipsRef.current;
    // Nettoyage si pas de bloc
    if (!el) {
      if (chipsRORef.current) {
        chipsRORef.current.disconnect();
        chipsRORef.current = null;
      }
      chipsPrevHRef.current = 0;
      return;
    }
    // Installer un ResizeObserver
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const newH = entry.contentRect?.height ?? el.offsetHeight;
      if (chipsPrevHRef.current === 0) {
        chipsPrevHRef.current = newH;
        return; // ignorer la première mesure
      }
      const delta = newH - chipsPrevHRef.current;
      if (delta !== 0) {
        const mapEl = mapWrapRef.current;
        if (mapEl) {
          const rect = mapEl.getBoundingClientRect();
          const visible = rect.top < window.innerHeight && rect.bottom > 0;
          if (visible) {
            try {
              window.scrollBy({ top: delta, behavior: "auto" });
            } catch {
              window.scrollBy(0, delta);
            }
          }
        }
      }
      chipsPrevHRef.current = newH;
    });
    ro.observe(el);
    chipsRORef.current = ro;
    return () => {
      ro.disconnect();
      chipsRORef.current = null;
      chipsPrevHRef.current = 0;
    };
  }, [communesSelected.length, selectionSource]);

  // Scroll infini: observer le sentinel en bas de page
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = loadMoreRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
  try { console.debug('[Accueil] IntersectionObserver', { isIntersecting: entry?.isIntersecting, time: Date.now(), hasMore, loadingMore, filtering }); } catch {}
      if (!entry?.isIntersecting) return;
      // Throttle: au moins 400ms entre deux déclenchements
      const now = Date.now();
      if (now - (lastIoTriggerAtRef.current || 0) < 400) return;
      // Charger la page suivante si possible
      if (!loadingMore && hasMore && !filtering) {
        lastIoTriggerAtRef.current = now;
        loadAnnonces(true);
      }
    }, { root: null, rootMargin: '200px', threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadingMore, filtering, activeHomeTab, sortBy, prixMax, ville, codePostal, communesSelected.length, critAgeMin, critAgeMax, critProfession, loadAnnonces]);

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
  setSelectionSource("zones");
      setCommunesSelected((prevSlugs) => (sameIds(prevSlugs, zoneSlugs) ? prevSlugs : zoneSlugs));
      setZonesSelected((prevZones) => (sameIds(prevZones, next) ? prevZones : next));
      return next;
    });
  };

  return (
  <main className="min-h-screen p-2 sm:p-6 flex flex-col items-center scroll-pt-28 md:scroll-pt-32">
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
          {/* Bouton “Changer de type de recherche” retiré */}

          {/* Ancre au-dessus des onglets */}
          <div ref={tabsTopRef} className="h-0 scroll-mt-28 md:scroll-mt-32" aria-hidden="true" />
          {/* Onglets Accueil — version légèrement agrandie et centrée */}
          <div className="w-full max-w-7xl mb-4 flex justify-center">
            <div
              role="tablist"
              aria-label="Type de recherche"
              className="inline-flex items-center rounded-full border border-slate-200 bg-white shadow-sm overflow-hidden"
            >
              <button
                role="tab"
                aria-selected={activeHomeTab === "annonces"}
                className={`px-4 sm:px-5 py-1.5 sm:py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  activeHomeTab === "annonces"
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
                onClick={() => setActiveHomeTab("annonces")}
              >
                🏠 <span className="ml-1.5">Annonces</span>
              </button>
              <div className="w-px h-5 bg-slate-200" aria-hidden="true" />
              <button
                role="tab"
                aria-selected={activeHomeTab === "colocataires"}
                className={`px-4 sm:px-5 py-1.5 sm:py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  activeHomeTab === "colocataires"
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
                onClick={() => setActiveHomeTab("colocataires")}
              >
                👥 <span className="ml-1.5">Colocataires</span>
              </button>
            </div>
          </div>

          {firestoreError && (
            <div className="w-full max-w-7xl mb-4 px-4 py-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-sm">
              {firestoreError}
            </div>
          )}

          <h1 className="text-3xl font-bold mb-6 text-center">
            {activeHomeTab === "annonces" ? "Annonces de colocation" : "Profils de colocataires"}
          </h1>

          {/* Layout 3 colonnes (desktop): ruban communes | filtres | annonces */}
          <div className="w-full max-w-7xl flex flex-col md:flex-row md:items-start gap-6">
            {/* Colonne annonces (droite en ≥md) */}
            <div className="flex-1 min-w-0 md:order-2">
              {/* Indicateur de filtrage en cours */}
              {filtering && (
                <div className="w-full mb-3 text-center text-slate-600 text-sm">
                  Filtrage en cours…
                </div>
              )}

        {/* Entête: libellé : compteur (total si aucun filtre au 1er affichage, sinon nombre filtré) + suffixe "trouvé(e)s" */}
              <div className="flex items-center mb-2">
                <div className="text-sm text-slate-700">
                  {activeHomeTab === 'annonces' ? 'Nombre d\'annonces' : 'Nombre de profils'}
                  {" : "}
                  {(() => {
                    const hasCommuneSel = selectedParentSlugs.length > 0;
                    const hasBudget = prixMax !== null;
                    const hasVille = !!ville || !!codePostal;
                    const hasCriteres = activeHomeTab === 'colocataires' && (critAgeMin !== null || critAgeMax !== null || !!critProfession);
                    const anyFilter = hasCommuneSel || hasBudget || hasVille || hasCriteres;
                    // Si aucun filtre et premier affichage, montrer le total global par onglet
                    if (!anyFilter && annonces.length === 0) {
                      return activeHomeTab === 'annonces' ? (countAnnoncesTotal ?? '…') : (countProfilsTotal ?? '…');
                    }
                    // Sinon, montrer le nombre filtré retourné par Firestore si dispo, sinon fallback sur la liste affichée
                    return (countFiltered ?? displayedAnnonces.length);
                  })()}
          {" "}
          {activeHomeTab === 'annonces' ? 'trouvées' : 'trouvés'}
                </div>
              </div>

              <div ref={resultsTopRef} className="h-0 scroll-mt-28 md:scroll-mt-32" aria-hidden="true" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 prevent-anchor">
                {(!filtering && displayedAnnonces.length === 0) ? (
                  <p className="text-slate-500 text-center mt-4 col-span-full">Aucune annonce trouvée.</p>
                ) : (
                  displayedAnnonces.map((annonce: any) => {
                    // isAdmin non utilisé ici
                    const card = (
                      <div
                        key={annonce.id}
                        style={activeHomeTab === "annonces" ? { cursor: 'pointer' } : {}}
                        tabIndex={0}
                        role="button"
                        onClick={(e) => {
                          if (activeHomeTab === "annonces") {
                            e.preventDefault();
                            setAnnonceDetail(annonce);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (activeHomeTab === "annonces" && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault();
                            setAnnonceDetail(annonce);
                          }
                        }}
                      >
                        {activeHomeTab === "colocataires" ? (
                          <ColocProfileCard
                            id={annonce.id}
                            nom={annonce.nom}
                            ville={annonce.ville}
                            age={annonce.age}
                            description={annonce.description}
                            createdAt={annonce.createdAt}
                            imageUrl={annonce.imageUrl}
                            onClick={() => {
                              setColocDetail(annonce);
                              setColocDetailOpen(true);
                            }}
                          />
                        ) : (
                          <AnnonceCard
                            id={annonce.id}
                            titre={annonce.titre}
                            ville={annonce.ville}
                            prix={annonce.prix}
                            surface={annonce.surface}
                            description={annonce.description}
                            createdAt={annonce.createdAt}
                            imageUrl={annonce.imageUrl || defaultAnnonceImg}
                            zonesLabel={annonce.zonesLabel}
                            onEdit={isAdmin ? () => setEditAnnonce(annonce) : undefined}
                            onDelete={isAdmin ? () => setDeleteAnnonceId(annonce.id) : undefined}
                          />
                        )}
                      </div>
                    );
                    if (activeHomeTab === "colocataires") {
                      return (
                        <div
                          key={annonce.id}
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            const target = e.target as HTMLElement;
                            const link = target.closest && target.closest("a");
                            if (link) e.preventDefault();
                            openColocDetail(annonce.id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") openColocDetail(annonce.id);
                          }}
                          className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg select-none [&_a]:pointer-events-none"
                        >
                          {card}
                        </div>
                      );
                    } else {
                      return card;
                    }
                  })
                )}

                {loadingMore && (
                  <p className="text-slate-500 text-center mt-4 col-span-full">Chargement...</p>
                )}

                {/* Sentinel pour scroll infini */}
                <div ref={loadMoreRef} className="col-span-full h-8" aria-hidden="true" />

                {!hasMore && !loadingMore && displayedAnnonces.length > 0 && (
                  <p className="text-slate-400 text-center text-xs mt-2 col-span-full">Fin de liste</p>
                )}

                {/* Message de fin de liste retiré à la demande */}
              </div>
              {/* Style local: empêche l'ancrage automatique qui peut déplacer la page quand du contenu est inséré */}
              <style jsx>{`
                .prevent-anchor { overflow-anchor: none; }
              `}</style>

              {/* Modaux globaux au niveau page (hors boucle) */}
              {activeHomeTab === "annonces" && annonceDetail && (
                <AnnonceDetailModal
                  open={!!annonceDetail}
                  onClose={() => setAnnonceDetail(null)}
                  annonce={annonceDetail}
                  isAdmin={!!isAdmin}
                  onEdit={(a) => { setEditAnnonce(a); setAnnonceDetail(null); }}
                  onDelete={(id) => { setDeleteAnnonceId(id); setAnnonceDetail(null); }}
                />
              )}

              <ConfirmModal
                isOpen={!!deleteAnnonceId}
                onClose={() => setDeleteAnnonceId(null)}
                onConfirm={async () => {
                  if (deleteAnnonceId) {
                    try {
                      const res = await fetch(`/api/annonce/${deleteAnnonceId}`, { method: 'DELETE' });
                      if (!res.ok) throw new Error('Erreur lors de la suppression');
                      showToast('success', "Annonce supprimée ✅");
                      setDeleteAnnonceId(null);
                      await loadAnnonces(false);
                    } catch {
                      showToast('error', "Erreur lors de la suppression ❌");
                      setDeleteAnnonceId(null);
                    }
                  } else {
                    setDeleteAnnonceId(null);
                  }
                }}
                title="Supprimer l'annonce ?"
                description="Voulez-vous vraiment supprimer cette annonce ? Cette action est irréversible."
              />

              <ConfirmModal
                isOpen={!!deleteColocId}
                onClose={() => setDeleteColocId(null)}
                onConfirm={async () => {
                  if (deleteColocId) {
                    try {
                      const res = await fetch(`/api/coloc/${deleteColocId}`, { method: 'DELETE' });
                      if (!res.ok) throw new Error('Erreur lors de la suppression');
                      showToast('success', "Profil colocataire supprimé ✅");
                      setDeleteColocId(null);
                      await loadAnnonces(false);
                    } catch {
                      showToast('error', "Erreur lors de la suppression ❌");
                      setDeleteColocId(null);
                    }
                  } else {
                    setDeleteColocId(null);
                  }
                }}
                title="Supprimer le profil colocataire ?"
                description="Voulez-vous vraiment supprimer ce profil ? Cette action est irréversible."
              />

              <AnnonceModal
                isOpen={!!editAnnonce}
                onClose={() => setEditAnnonce(null)}
                onSubmit={async (data) => {
                  if (editAnnonce?.id) {
                    try {
                      const res = await fetch(`/api/annonce/${editAnnonce.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                      });
                      if (!res.ok) throw new Error('Erreur lors de la modification');
                      showToast('success', "Annonce modifiée ✅");
                      setEditAnnonce(null);
                      await loadAnnonces(false);
                    } catch {
                      showToast('error', "Erreur lors de la modification ❌");
                      setEditAnnonce(null);
                    }
                  } else {
                    setEditAnnonce(null);
                  }
                }}
                annonce={editAnnonce}
              />

              <ColocProfileModal
                open={!!editColoc}
                onClose={() => setEditColoc(null)}
                profile={editColoc}
                onSubmit={async (data) => {
                  if (editColoc?.id) {
                    try {
                      const res = await fetch(`/api/coloc/${editColoc.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                      });
                      if (!res.ok) throw new Error('Erreur lors de la modification');
                      showToast('success', "Profil colocataire modifié ✅");
                      setEditColoc(null);
                      await loadAnnonces(false);
                    } catch {
                      showToast('error', "Erreur lors de la modification ❌");
                      setEditColoc(null);
                    }
                  } else {
                    setEditColoc(null);
                  }
                }}
              />
            </div>

            {/* Colonne filtres (gauche en ≥md) */}
            <div className="w-full md:order-1 md:basis-[34%] lg:basis-[36%] md:flex-shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault(); // mise à jour auto: pas d’appel manuel
                }}
                className="sticky top-4 w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-4"
              >
                {/* Menu navigation */}
                <div className="flex items-center justify-center gap-3 mb-3">
                  <span className="hidden md:block h-px w-8 bg-slate-200" />
                  <div className="text-base md:text-lg font-semibold text-slate-700 tracking-tight">Filtrer par</div>
                  <span className="hidden md:block h-px w-8 bg-slate-200" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    className={`px-3 py-1.5 rounded-lg text-xs border ${hasMode('map') ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
                    onClick={() => {
                      toggleMode('map');
                    }}
                  >
                    Secteur de recherche
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1.5 rounded-lg text-xs border ${hasMode('budget') ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
                    onClick={() => {
                      toggleMode('budget');
                    }}
                  >
                    Budget
                  </button>
                  {activeHomeTab === 'annonces' ? (
                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-lg text-xs border ${hasMode('commune') ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
                      onClick={() => {
                        toggleMode('commune');
                      }}
                    >
                      Commune
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-lg text-xs border ${hasMode('criteres') ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
                      onClick={() => {
                        toggleMode('criteres');
                      }}
                    >
                      Critères
                    </button>
                  )}
                </div>
                {/* Zones rapides (OU) tout en haut - visibles seulement en mode carte */}
                {hasMode('map') && (
                  <div ref={zonesBlockRef}>
                    <div className="mb-2 text-xs font-medium text-slate-600">Zones</div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1 text-center justify-items-stretch">
                      {Object.keys(GROUPES).map((z) => (
                        <button
                          key={z}
                          type="button"
                          onClick={() => toggleZoneFilter(z)}
                          className={`w-full px-2 py-1 rounded-full text-xs leading-none border transition ${
                            zoneFilters.includes(z)
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          {z === "Intérieur" ? "Centre" : z}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Carte sera rendue plus bas (sous Commune/Budget) */}

                {/* Carte (déplacée en bas) */}
                <div ref={communeBlockRef} className="flex flex-wrap gap-4 items-end justify-center">
              {/* Commune: saisie libre + ajout multiple */}
              {activeHomeTab === 'annonces' && hasMode('commune') && (
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
                      setSelectionSource(null);
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
                {/* Affichage des communes sélectionnées (chips) désactivé à la demande */}
              </div>
              )}

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

              {hasMode('budget') && (
                <div ref={budgetBlockRef}>
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
              )}

              {/* Bloc Critères (uniquement en mode colocataires) */}
              {activeHomeTab === 'colocataires' && hasMode('criteres') && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                  <div>
                    <label className="block text-sm font-medium mb-1">Âge min</label>
                    <input type="number" className="border border-gray-300 rounded px-3 py-2 w-full" value={critAgeMin ?? ''} onChange={(e) => setCritAgeMin(Number(e.target.value) || null)} placeholder="Ex: 20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Âge max</label>
                    <input type="number" className="border border-gray-300 rounded px-3 py-2 w-full" value={critAgeMax ?? ''} onChange={(e) => setCritAgeMax(Number(e.target.value) || null)} placeholder="Ex: 35" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Profession</label>
                    <input type="text" className="border border-gray-300 rounded px-3 py-2 w-full" value={critProfession} onChange={(e) => setCritProfession(e.target.value)} placeholder="Ex: Étudiant, CDI..." />
                  </div>
                </div>
              )}

              {/* Tri retiré de la barre gauche */}

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
                  setSelectionSource(null);
                  // Remplacement au 1er snapshot pour éviter les doublons
                  resetOnFirstSnapshotRef.current = true;
                  setFiltering(true);
                  // pas d’appel direct à loadAnnonces: l’effet "filtres" va relancer proprement
                }}
                className="border border-slate-300 text-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-50 text-sm"
              >
                Réinitialiser filtre
              </button>
            </div>

              {/* Carte (sous Commune et Budget) */}
              {showCommuneMap && hasMode('map') && (
                <div id="map-section" ref={mapWrapRef} className="rounded-2xl border border-slate-200 p-3 overflow-hidden">
                  <CommuneZoneSelector
                    value={communesSelected}
                    computeZonesFromSlugs={computeZonesFromSlugs}
                    onChange={(slugs, zones = []) => {
                      setSelectionSource("map");
                      setCommunesSelected((prev) => (sameIds(prev, slugs as string[]) ? prev : (slugs as string[])));
                      setZonesSelected((prev) => (sameIds(prev, zones as string[]) ? prev : (zones as string[])));
                    }}
                    height={420}
                    className="w-full"
                    alwaysMultiSelect
                    // Masque le résumé de sélection sous la carte
                    hideSelectionSummary
                  />
                </div>
              )}

              {/* Blocs de sélection — déscendus en bas de la barre gauche */}
              {(zonesSelected.length > 0 || communesSelected.length > 0) && (
                <div className="space-y-3 mt-3">
                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-medium text-slate-600">Zones sélectionnées</div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200">{zonesSelected.length}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setZoneFilters([]);
                            setCommunesSelected([]);
                            setZonesSelected([]);
                            setSelectionSource(null);
                          }}
                          disabled={zonesSelected.length === 0 && communesSelected.length === 0 && !ville && !codePostal && zoneFilters.length === 0}
                          className={`text-[11px] px-2 py-0.5 rounded border transition ${
                            (zonesSelected.length === 0 && communesSelected.length === 0 && !ville && !codePostal && zoneFilters.length === 0)
                              ? "border-slate-200 text-slate-400 bg-slate-100 cursor-not-allowed"
                              : "border-slate-300 text-slate-700 hover:bg-slate-50"
                          }`}
                          title="Tout effacer"
                          aria-label="Tout effacer les zones et communes"
                        >
                          Tout effacer
                        </button>
                      </div>
                    </div>
                    <div className="max-h-[22vh] overflow-auto pr-1">
                      <div className="flex flex-wrap gap-1">
                        {zonesSelected.map((z) => (
                          <span key={z} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
                            {z}
                            <button
                              type="button"
                              aria-label={`Retirer la zone ${z}`}
                              title="Retirer"
                              className="ml-1 rounded text-blue-700/80 hover:text-blue-900"
                              onClick={() => {
                                if (zoneFilters.includes(z)) {
                                  const nextZF = zoneFilters.filter((x) => x !== z);
                                  const union = Array.from(new Set(nextZF.flatMap((x) => ZONE_TO_SLUGS[x] || [])));
                                  union.sort((a, b) => (SLUG_TO_NAME[a] || a).localeCompare(SLUG_TO_NAME[b] || b, "fr", { sensitivity: "base" }));
                                  setSelectionSource("zones");
                                  setZoneFilters(nextZF);
                                  setCommunesSelected(union);
                                  setZonesSelected(nextZF);
                                } else {
                                  const toRemove = new Set((ZONE_TO_SLUGS[z] || []).map((s) => altSlugToCanonical[s] || s));
                                  setSelectionSource("zones");
                                  setCommunesSelected((prev) => {
                                    const next = (prev || []).filter((s) => !toRemove.has(altSlugToCanonical[s] || s));
                                    setZonesSelected(computeZonesFromSlugs(next));
                                    setZoneFilters([]);
                                    return sameIds(prev || [], next) ? prev : next;
                                  });
                                }
                              }}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-medium text-slate-600">Communes sélectionnées</div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200">{communesSelected.length}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setVille("");
                            setCodePostal("");
                            setZoneFilters([]);
                            setCommunesSelected([]);
                            setZonesSelected([]);
                            setSelectionSource(null);
                          }}
                          disabled={communesSelected.length === 0 && zonesSelected.length === 0 && !ville && !codePostal && zoneFilters.length === 0}
                          className={`text-[11px] px-2 py-0.5 rounded border transition ${
                            (communesSelected.length === 0 && zonesSelected.length === 0 && !ville && !codePostal && zoneFilters.length === 0)
                              ? "border-slate-200 text-slate-400 bg-slate-100 cursor-not-allowed"
                              : "border-slate-300 text-slate-700 hover:bg-slate-50"
                          }`}
                          title="Tout effacer"
                          aria-label="Tout effacer les communes et zones"
                        >
                          Tout effacer
                        </button>
                      </div>
                    </div>
                    <div ref={selectedChipsRef} className="max-h-[22vh] overflow-auto pr-1">
                      <div className="flex flex-wrap gap-1">
                        {communesSelected.map((s) => (
                          <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-50 text-slate-700 border border-slate-200" title={parentSlugToName[s] || s}>
                            {parentSlugToName[s] || s}
                            <button
                              type="button"
                              aria-label={`Retirer ${parentSlugToName[s] || s}`}
                              title="Retirer"
                              className="ml-1 rounded text-slate-600 hover:text-slate-900"
                              onClick={() => {
                                const canon = altSlugToCanonical[s] || s;
                                setSelectionSource("input");
                                setCommunesSelected((prev) => {
                                  const next = (prev || []).filter((x) => (altSlugToCanonical[x] || x) !== canon);
                                  setZonesSelected(computeZonesFromSlugs(next));
                                  setZoneFilters([]);
                                  return sameIds(prev || [], next) ? prev : next;
                                });
                              }}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* fin blocs sélection */}
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
                      <div className="flex-shrink-0 w-44">
                        {/* Gallery: main image + thumbnails */}
                        <div className="rounded-lg overflow-hidden bg-gray-100 w-44 h-44 relative group">
                          <ExpandableImage
                            src={
                              Array.isArray(colocDetail.photos) && (colocDetail.photos as string[]).length
                                ? (colocDetail.photos as string[])[galleryIndex] || colocDetail.imageUrl || defaultColocImg
                                : colocDetail.imageUrl || defaultColocImg
                            }
                            images={Array.isArray(colocDetail.photos) && (colocDetail.photos as string[]).length ? (colocDetail.photos as string[]) : (colocDetail.imageUrl ? [colocDetail.imageUrl] : [defaultColocImg])}
                            initialIndex={galleryIndex}
                            className="w-full h-full"
                            alt={colocDetail.nom || "Profil"}
                          />
                          {/* Hover/focus overlay: magnifier */}
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 group-focus-within:bg-black/30 transition-colors" aria-hidden="true">
                            <svg className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="11" cy="11" r="6" />
                              <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                          </div>
                          <button
                            aria-label="Agrandir l'image"
                            className="absolute right-2 top-2 bg-white/80 px-2 py-1 rounded text-sm text-slate-700"
                            onClick={() => setLightboxOpen(true)}
                          >
                            Agrandir
                          </button>
                        </div>
                        {Array.isArray(colocDetail.photos) && (colocDetail.photos as string[]).length > 1 && (
                          <div className="mt-2 grid grid-cols-4 gap-2">
                            {(colocDetail.photos as string[]).map((p: string, i: number) => (
                              <button
                                key={p + i}
                                onClick={() => { setGalleryIndex(i); /* no modal open from thumbnail */ }}
                                className={`w-10 h-10 overflow-hidden rounded-md border relative group ${i === galleryIndex ? 'border-blue-600' : 'border-slate-200'}`}
                                aria-label={`Image ${i + 1}`}
                              >
                                <Image
                                  src={p}
                                  alt={`thumb-${i}`}
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                  sizes="40px"
                                />
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors" aria-hidden="true">
                                  <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="6" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                  </svg>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-2xl font-bold">
                          {colocDetail.nom || "Recherche colocation"}
                        </div>
                        <div className="text-slate-700">
                          {(() => {
                            const zonesFromData = Array.isArray(colocDetail.zones) && colocDetail.zones.length
                              ? colocDetail.zones as string[]
                              : [];
                            const zonesFromSlugs = Array.isArray(colocDetail.communesSlugs) && colocDetail.communesSlugs.length
                              ? computeZonesFromSlugs((colocDetail.communesSlugs as string[]).map((s: string) => (altSlugToCanonical[s] || s)))
                              : [];
                            const zonesToShow = (zonesFromData.length ? zonesFromData : zonesFromSlugs);
                            return zonesToShow.length ? zonesToShow.join(", ") : (colocDetail.ville || "-");
                          })()}
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
                    {lightboxOpen && (
                      <ImageLightbox
                        images={Array.isArray(colocDetail.photos) && (colocDetail.photos as string[]).length ? (colocDetail.photos as string[]) : (colocDetail.imageUrl ? [colocDetail.imageUrl] : [defaultColocImg])}
                        initialIndex={galleryIndex}
                        onClose={() => setLightboxOpen(false)}
                      />
                    )}

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

                    <div className="flex justify-end gap-2">
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => { setEditColoc(colocDetail); closeColocDetail(); }}
                            className="px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => { setDeleteColocId(colocDetail.id); closeColocDetail(); }}
                            className="px-4 py-2 rounded bg-rose-600 text-white hover:bg-rose-700"
                          >
                            Supprimer
                          </button>
                        </>
                      )}
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

