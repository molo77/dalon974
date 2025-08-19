
"use client";
import ColocProfileModal from "@/components/ColocProfileModal";
import AnnonceDetailModal from "@/components/AnnonceDetailModal";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Image from "next/image";
// Firestore shim uniquement pour la branche coloc (temporaire)
// Firestore supprimé: tout passe par les APIs internes
import { listAnnoncesPage } from "@/lib/services/homeService";
import { listColoc } from "@/lib/services/colocService";
import dynamic from "next/dynamic";
import ExpandableImage from "@/components/ExpandableImage";
import AnnonceCard from "@/components/AnnonceCard";
import ColocProfileCard from "@/components/ColocProfileCard";
import ConfirmModal from "@/components/ConfirmModal";
import AnnonceModal from "@/components/AnnonceModal";
// Rôle admin désormais fourni par le contexte d'auth
// AuthProvider n'exporte pas useAuth dans ce projet; on neutralise l'usage pour déverrouiller la build
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
  const isAdmin = false; // TODO: remplacer par un vrai rôle admin via session
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
  const [colocDetailOpen, setColocDetailOpen] = useState(false);
  const [colocDetailLoading, setColocDetailLoading] = useState(false);

  // Critères spécifiques à l'onglet colocataires
  const [critAgeMin, setCritAgeMin] = useState<number | null>(null);
  const [critAgeMax, setCritAgeMax] = useState<number | null>(null);
  const [critProfession, setCritProfession] = useState<string>("");

  // Constantes et helpers UI + géo
  const defaultAnnonceImg = "/images/annonce-holder.svg";
  const defaultColocImg = "/images/coloc-holder.svg";

  const GROUPES = useMemo<Record<string, string[]>>(() => ({
    "Nord": ["Saint-Denis","Sainte-Marie","Sainte-Suzanne"],
    "Est": ["Saint-André","Bras-Panon","Salazie","Saint-Benoît","La Plaine-des-Palmistes","Sainte-Rose","Saint-Philippe"],
    "Ouest": ["Le Port","La Possession","Saint-Paul","Trois-Bassins","Saint-Leu","Les Avirons","L'Étang-Salé"],
    "Sud": ["Saint-Louis","Saint-Pierre","Le Tampon","Entre-Deux","Petite-Île","Saint-Joseph","Cilaos"],
    "Intérieur": ["Cilaos","Salazie","La Plaine-des-Palmistes"],
  }), []);
  const SUB_COMMUNES = useMemo<{ name: string; parent: string }[]>(() => ([
    { name: "Sainte-Clotilde", parent: "Saint-Denis" },
    { name: "La Montagne", parent: "Saint-Denis" },
    { name: "Saint-Gilles-les-Bains", parent: "Saint-Paul" },
    { name: "L'Hermitage-les-Bains", parent: "Saint-Paul" },
    { name: "Saint-Gilles-les-Hauts", parent: "Saint-Paul" },
    { name: "La Saline", parent: "Saint-Paul" },
    { name: "La Saline-les-Hauts", parent: "Saint-Paul" },
    { name: "Bois-de-Nèfles Saint-Paul", parent: "Saint-Paul" },
    { name: "Plateau-Caillou", parent: "Saint-Paul" },
    { name: "La Chaloupe", parent: "Saint-Leu" },
    { name: "Piton Saint-Leu", parent: "Saint-Leu" },
    { name: "L'Étang-Salé-les-Bains", parent: "L'Étang-Salé" },
    { name: "La Rivière", parent: "Saint-Louis" },
    { name: "La Plaine des Cafres", parent: "Le Tampon" },
    { name: "Terre-Sainte", parent: "Saint-Pierre" },
    { name: "Dos d'Âne", parent: "La Possession" },
  ]), []);
  const slugify = (s: string) => (s || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const COMMUNES: string[] = useMemo(() => {
    const set = new Set<string>();
    Object.values(GROUPES).forEach(list => list.forEach(n => set.add(n)));
    return Array.from(set);
  }, [GROUPES]);
  const SLUG_TO_NAME = useMemo(() => (
    COMMUNES.reduce<Record<string,string>>((acc, name) => { acc[slugify(name)] = name; return acc; }, {})
  ), [COMMUNES]);
  const ZONE_TO_SLUGS = useMemo(() => (
    Object.fromEntries(Object.entries(GROUPES).map(([zone, names]) => [zone, names.map(n => slugify(n))]))
  ), [GROUPES]);

  // Mappings parent/alt
  const parentSlugToName = SLUG_TO_NAME; // parents uniquement
  const nameToParentSlug = useMemo(() => {
    const map: Record<string, string> = {};
    // communes -> elles-mêmes
    Object.entries(SLUG_TO_NAME).forEach(([slug]) => { map[slug] = slug; });
    // sous-communes -> parent
    SUB_COMMUNES.forEach(({ name, parent }) => { map[slugify(name)] = slugify(parent); });
    return map;
  }, [SLUG_TO_NAME, SUB_COMMUNES]);
  const altSlugToCanonical = nameToParentSlug;

  // Sous-communes par commune parente (clé: parentSlug -> liste de noms de sous-communes)
  const SUBS_BY_PARENT = useMemo(() => {
    const map: Record<string, string[]> = {};
    SUB_COMMUNES.forEach(({ name, parent }) => {
      const ps = slugify(parent);
      if (!map[ps]) map[ps] = [];
      map[ps].push(name);
    });
    return map;
  }, [SUB_COMMUNES]);

  // Extrait un label de sous-communes détectées dans les textes fournis, limité à quelques occurrences
  const extractSubCommunesLabel = useCallback((texts: Array<string | null | undefined>, parentSlug?: string) => {
    if (!parentSlug) return undefined;
    const names = SUBS_BY_PARENT[parentSlug];
    if (!names || names.length === 0) return undefined;
    const found = new Set<string>();
    for (const t of texts) {
      const s = (t || '').toString();
      if (!s) continue;
      for (const n of names) {
        if (s.includes(n)) found.add(n);
      }
    }
    if (found.size === 0) return undefined;
    return Array.from(found).slice(0, 3).join(', ');
  }, [SUBS_BY_PARENT]);

  // Etats UI et filtres
  const [activeHomeTab, setActiveHomeTab] = useState<null | "annonces" | "colocataires">(null);
  const [filtering, setFiltering] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "prix" | "prix-desc">("date");
  const [prixMax, setPrixMax] = useState<number | null>(null);
  const [ville, setVille] = useState("");
  const [codePostal, setCodePostal] = useState("");
  const [communesSelected, setCommunesSelected] = useState<string[]>([]);
  const [zonesSelected, setZonesSelected] = useState<string[]>([]);
  const [zoneFilters, setZoneFilters] = useState<string[]>([]);
  const [selectionSource, setSelectionSource] = useState<"map" | "zones" | "input" | null>(null);
  const [countAnnoncesTotal, setCountAnnoncesTotal] = useState<number | null>(null);
  const [countProfilsTotal, setCountProfilsTotal] = useState<number | null>(null);
  const [countFiltered, setCountFiltered] = useState<number | null>(null);
  const pageLimit = 20;
  const offsetRef = useRef<number>(0);

  // Refs diverses
  const resultsTopRef = useRef<HTMLDivElement | null>(null);
  const tabsTopRef = useRef<HTMLDivElement | null>(null);
  const mapWrapRef = useRef<HTMLDivElement | null>(null);
  const selectedChipsRef = useRef<HTMLDivElement | null>(null);
  const chipsRORef = useRef<ResizeObserver | null>(null);
  const chipsPrevHRef = useRef<number>(0);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const filtersDebounceRef = useRef<any>(null);
  const lastIoTriggerAtRef = useRef<number | null>(null);
  const resetOnFirstSnapshotRef = useRef<boolean>(true);
  const shouldScrollToResultsOnNextDataRef = useRef<boolean>(false);
  const zonesBlockRef = useRef<HTMLDivElement | null>(null);
  const communeBlockRef = useRef<HTMLDivElement | null>(null);
  const budgetBlockRef = useRef<HTMLDivElement | null>(null);
  const mapTopBeforeRef = useRef<number | null>(null);
  const scrollPosBeforeFilterRef = useRef<number | null>(null);

  const selectedParentSlugs = useMemo(() => {
    const norm = (communesSelected || []).map((s) => altSlugToCanonical[s] || s);
    return Array.from(new Set(norm));
  }, [communesSelected, altSlugToCanonical]);
  const selectedSubCommunesLabel = "";
  const showCommuneMap = true;

  // Hook villes/CP
  const { COMMUNES_CP_SORTED, onVilleChange } = useCommuneCp({ setVille, setCodePostal });

  const computeZonesFromSlugs = useCallback((slugs: string[]): string[] => {
    const names = slugs.map((s) => parentSlugToName[s]).filter(Boolean) as string[];
    const zones: string[] = [];
    Object.entries(GROUPES).forEach(([zone, list]) => {
      if (names.some((n) => list.includes(n))) zones.push(zone);
    });
    return zones;
  }, [parentSlugToName, GROUPES]);

  const getDocParentSlug = useCallback((d: any) => {
    const s = d?.communeSlug ? String(d.communeSlug) : (d?.ville ? slugify(String(d.ville)) : "");
    return nameToParentSlug[s] || s;
  }, [nameToParentSlug]);

  // Modes UI
  const [uiModes, setUiModes] = useState<string[]>(["map", "budget"]);
  const hasMode = useCallback((m: string) => uiModes.includes(m), [uiModes]);
  const toggleMode = useCallback((m: string) => {
    setUiModes((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);
  }, []);

  // Ajout communes depuis l'input
  const addTypedCommune = useCallback(() => {
    const val = (ville || "").trim();
    if (!val) return;
    const slug = slugify(val);
    const parent = nameToParentSlug[slug] || slug;
    setSelectionSource("input");
    setCommunesSelected((prev) => {
      if (prev.includes(parent)) return prev;
      const next = [...prev, parent];
      setZonesSelected(computeZonesFromSlugs(next));
      return next;
    });
    setVille("");
  }, [ville, nameToParentSlug, computeZonesFromSlugs]);
  const addCommunesFromTokens = useCallback((text: string) => {
    const tokens = String(text).split(/[\n,;]+/).map((t) => t.trim()).filter(Boolean);
    if (tokens.length === 0) return;
    setSelectionSource("input");
    setCommunesSelected((prev) => {
      const set = new Set(prev);
      tokens.forEach((t) => {
        const slug = slugify(t);
        const parent = nameToParentSlug[slug] || slug;
        set.add(parent);
      });
      const next = Array.from(set);
      setZonesSelected(computeZonesFromSlugs(next));
      return next;
    });
    setVille("");
  }, [nameToParentSlug, computeZonesFromSlugs]);

  // Charge données via API
  const loadAnnonces = useCallback(async (append: boolean = false) => {
    if (activeHomeTab === null) return;
    if (loadingMore || filtering) return;
    setLoadingMore(true);
    if (!append) setFiltering(true);
    try {
      const isColoc = activeHomeTab === 'colocataires';
      const normalizedSlugs = Array.from(new Set((communesSelected || []).map((s) => altSlugToCanonical[s] || s))).filter(Boolean);
      const currentOffset = append ? offsetRef.current : 0;
      if (!append) offsetRef.current = 0;
      if (isColoc) {
        const all = await listColoc({
          limit: pageLimit,
          offset: currentOffset,
          ville: ville || undefined,
          prixMax: prixMax ?? null,
          slugs: normalizedSlugs,
          ageMin: critAgeMin ?? null,
          ageMax: critAgeMax ?? null,
        });
        const filtered = (Array.isArray(all) ? all : []).filter((p: any) => {
          if (normalizedSlugs.length > 0) {
            const slugsArr = Array.isArray(p.communesSlugs) ? p.communesSlugs.map((s: string) => altSlugToCanonical[s] || s) : [];
            const hasOverlap = slugsArr.some((s: string) => normalizedSlugs.includes(s));
            if (!hasOverlap) return false;
          }
          if (critAgeMin !== null && !(typeof p.age === 'number' && p.age >= critAgeMin)) return false;
          if (critAgeMax !== null && !(typeof p.age === 'number' && p.age <= critAgeMax)) return false;
          if (critProfession && !String(p.profession || '').toLowerCase().includes(critProfession.toLowerCase())) return false;
          return true;
        });
        const mapped = filtered.map((p: any) => {
          const budgetNum = Number(p.budget);
          const head = [p.profession, typeof p.age === 'number' ? `${p.age} ans` : null].filter(Boolean).join(' • ');
          const tail = (p.description || '').toString();
          const short = head ? `${head}${tail ? ' • ' : ''}${tail}` : tail;
          let parentSlug: string | undefined;
          const slugsArr = Array.isArray(p.communesSlugs) ? p.communesSlugs.map((s: string) => altSlugToCanonical[s] || s) : [];
          if (slugsArr.length > 0) parentSlug = slugsArr[0];
          else if (p.ville) { const s = slugify(String(p.ville)); parentSlug = nameToParentSlug[s] || s; }
          const zonesFromSlugs = slugsArr.length ? computeZonesFromSlugs(slugsArr) : [];
          const zonesArr: string[] = Array.isArray(p.zones) && p.zones.length ? (p.zones as string[]) : zonesFromSlugs;
          const zonesLabel = zonesArr && zonesArr.length ? zonesArr.join(', ') : (p.ville || '-');
          const subLabel = extractSubCommunesLabel([p.nom, p.description, p.ville], parentSlug);
          return {
            id: p.id,
            titre: p.nom || 'Recherche colocation',
            nom: p.nom || 'Recherche colocation',
            ville: zonesLabel,
            prix: Number.isFinite(budgetNum) ? budgetNum : undefined,
            surface: undefined,
            description: String(short).slice(0, 180),
            imageUrl: p.imageUrl || defaultAnnonceImg,
            createdAt: p.createdAt,
            parentSlug,
            zonesLabel,
            subCommunesLabel: subLabel,
            age: p.age,
            profession: p.profession,
          };
        });
        const toMs = (x: any) => {
          const v = x?.createdAt; if (!v) return 0; if (typeof v === 'number') return v;
          if ((v as any)?.seconds) return (v as any).seconds * 1000 + ((v as any).nanoseconds ? Math.floor((v as any).nanoseconds / 1e6) : 0);
          const p = Date.parse(v); return isNaN(p) ? 0 : p;
        };
        mapped.sort((a: any, b: any) => sortBy === 'date' ? toMs(b) - toMs(a) : (sortBy === 'prix-desc' ? (b.prix ?? 0) - (a.prix ?? 0) : (a.prix ?? 0) - (b.prix ?? 0)));
  setAnnonces((prev) => append ? [...prev, ...mapped.filter(i => !(new Set(prev.map((x: any) => x.id))).has(i.id))] : mapped);
  setCountFiltered((prev) => (append ? (prev ?? 0) : 0) + mapped.length);
  offsetRef.current = currentOffset + mapped.length;
  setHasMore(mapped.length === pageLimit);
      } else {
  const all = await listAnnoncesPage(pageLimit, currentOffset);
        const villeSet = new Set(normalizedSlugs.map((s) => parentSlugToName[s]).filter(Boolean));
        const filtered = all.filter((d: any) => {
          if (normalizedSlugs.length > 0) {
            const parentSlug = getDocParentSlug(d);
            if (!normalizedSlugs.includes(parentSlug)) return false;
            if (villeSet.size > 0 && d.ville && !villeSet.has(d.ville)) return false;
          } else {
            if (ville && d.ville !== ville) return false;
            if (codePostal && d.codePostal && d.codePostal !== codePostal) return false;
          }
          if (prixMax !== null && typeof d.prix === 'number' && d.prix > prixMax) return false;
          return true;
        });
        const mapped = filtered.map((d: any) => {
          const parentSlug = getDocParentSlug(d);
          const subLabel = extractSubCommunesLabel([d.titre ?? d.title, d.description, d.ville], parentSlug);
          return {
            id: d.id,
            titre: d.titre ?? d.title ?? '',
            ville: d.ville ?? null,
            prix: typeof d.prix === 'number' ? d.prix : undefined,
            surface: d.surface ?? null,
            description: d.description ?? null,
            imageUrl: d.imageUrl || defaultAnnonceImg,
            createdAt: d.createdAt,
            parentSlug,
            subCommunesLabel: subLabel,
          };
        });
        const toMs = (x: any) => {
          const v = x?.createdAt; if (!v) return 0; if (typeof v === 'number') return v;
          if ((v as any)?.seconds) return (v as any).seconds * 1000 + ((v as any).nanoseconds ? Math.floor((v as any).nanoseconds / 1e6) : 0);
          const p = Date.parse(v); return isNaN(p) ? 0 : p;
        };
        mapped.sort((a, b) => sortBy === 'date' ? toMs(b) - toMs(a) : (sortBy === 'prix-desc' ? (b.prix ?? 0) - (a.prix ?? 0) : (a.prix ?? 0) - (b.prix ?? 0)));
  setAnnonces((prev) => append ? [...prev, ...mapped.filter(i => !(new Set(prev.map((x: any) => x.id))).has(i.id))] : mapped);
  setCountFiltered((prev) => (append ? (prev ?? 0) : 0) + mapped.length);
  offsetRef.current = currentOffset + mapped.length;
  setHasMore(mapped.length === pageLimit);
      }
      if (shouldScrollToResultsOnNextDataRef.current) {
        try {
          const el = resultsTopRef.current;
          if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          else if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch { try { window.scrollTo(0, 0); } catch {} } finally {
          shouldScrollToResultsOnNextDataRef.current = false;
        }
      }
    } catch (err) {
      console.error('[Accueil] loadAnnonces', err);
    } finally {
      setLoadingMore(false);
      setFiltering(false);
    }
  }, [activeHomeTab, loadingMore, filtering, sortBy, prixMax, ville, codePostal, communesSelected, altSlugToCanonical, parentSlugToName, selectedSubCommunesLabel, critAgeMin, critAgeMax, critProfession, computeZonesFromSlugs, getDocParentSlug, nameToParentSlug, pageLimit]);

  // Gestion clavier pour la lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft') setGalleryIndex((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setGalleryIndex((i) => i + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen]);

  // Préchargement silencieux des features de carte (si utilisé)
  useEffect(() => { try { preloadReunionFeatures(); } catch {} }, []);

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
  setFirestoreError(null);
    setAnnonces([]);
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
    setHasMore(true);
    setFiltering(true);
    resetOnFirstSnapshotRef.current = true; // remplacera les cartes au premier snapshot
    if (filtersDebounceRef.current) clearTimeout(filtersDebounceRef.current);
    filtersDebounceRef.current = setTimeout(() => {
      loadAnnonces(false);
    }, 250);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, prixMax, ville, codePostal, communesSelected, critAgeMin, critAgeMax, critProfession]);

  // Totaux globaux (premier affichage par onglet)
  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        if (activeHomeTab === 'annonces' && countAnnoncesTotal === null) {
          const res = await fetch('/api/annonces', { cache: 'no-store' });
          if (!aborted && res.ok) {
            const arr = await res.json();
            setCountAnnoncesTotal(Array.isArray(arr) ? arr.length : 0);
          }
        } else if (activeHomeTab === 'colocataires' && countProfilsTotal === null) {
          const res = await fetch('/api/coloc', { cache: 'no-store' });
          if (!aborted && res.ok) {
            const arr = await res.json();
            setCountProfilsTotal(Array.isArray(arr) ? arr.length : 0);
          }
        }
      } catch {}
    })();
    return () => { aborted = true; };
  }, [activeHomeTab, countAnnoncesTotal, countProfilsTotal]);

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
     if (filtersDebounceRef.current) clearTimeout(filtersDebounceRef.current);
    };
  }, []);

  // NOUVEAU: ouvrir le détail du profil colocataire (via API)
  const openColocDetail = async (id: string) => {
    try {
      setColocDetailOpen(true);
      setColocDetailLoading(true);
      setColocDetail(null);
      const res = await fetch(`/api/coloc/${id}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setColocDetail(data);
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
                    // Sinon, montrer le nombre filtré calculé côté client, sinon fallback sur la liste affichée
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
                            subCommunesLabel={annonce.subCommunesLabel}
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
                            subCommunesLabel={annonce.subCommunesLabel}
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
                      const res = await fetch(`/api/annonces/${deleteAnnonceId}`, { method: 'DELETE' });
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
                      const res = await fetch(`/api/annonces/${editAnnonce.id}`, {
                        method: 'PATCH',
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
                        method: 'PATCH',
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

