"use client";
import ColocProfileModal from "@/shared/components/ColocProfileModal";
import AnnonceDetailModal from "@/shared/components/AnnonceDetailModal";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
// Firestore shim uniquement pour la branche coloc (temporaire)
// Firestore supprimé: tout passe par les APIs internes
import { listAnnoncesPage } from "@/core/business/homeService";
import { listColoc } from "@/core/business/colocService";
import dynamic from "next/dynamic";
import ExpandableImage from "@/shared/components/ExpandableImage";
import AnnonceCard from "@/shared/components/AnnonceCard";
import ColocProfileCard from "@/shared/components/ColocProfileCard";
import ConfirmModal from "@/shared/components/ConfirmModal";
import AnnonceModal from "@/shared/components/AnnonceModal";
// AdSense via AdBlock
import AdBlock from "@/shared/components/AdBlock";
// Rôle admin désormais fourni par le contexte d'auth
// AuthProvider n'exporte pas useAuth dans ce projet; on neutralise l'usage pour déverrouiller la build
import { showToast } from "@/infrastructure/communication/toast";
import CommuneZoneSelector from "@/shared/components/CommuneZoneSelector";
import { preloadReunionFeatures } from "@/core/data/reunionGeo";
import DashboardHome from "@/shared/components/DashboardHome";
const ImageLightbox = dynamic(() => import("@/shared/components/ImageLightbox"), { ssr: false });


// === Utilitaires partagés (déplacés hors composant pour éviter recréations) ===
function sameIds(a: string[] | undefined | null, b: string[] | undefined | null): boolean {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  for (let i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) return false;
  return true;
}
// Normalise un champ createdAt potentiellement Firestore-like ou date string/number
function toMsAny(x: any): number {
  const v = x?.createdAt ?? x; // autoriser passage direct de l'objet ou de la valeur
  if (!v) return 0;
  if (typeof v === 'number') return v;
  if (v?.seconds) return (v.seconds * 1000) + (v.nanoseconds ? Math.floor(v.nanoseconds / 1e6) : 0);
  const p = Date.parse(v);
  return isNaN(p) ? 0 : p;
}

export default function HomePage() {
  // Image d'accueil configurable via env (placer l'image dans public/ et utiliser un chemin commençant par "/")
  const homepageImageSrc = process.env.NEXT_PUBLIC_HOMEPAGE_IMAGE || "/images/home-hero.jpg";
  // Rôle admin depuis la session NextAuth
  const { data: session, status } = useSession();
  const isAdmin = (session as any)?.user?.role === 'admin';
  const [editAnnonce, setEditAnnonce] = useState<any|null>(null);
  const [annonceDetail, setAnnonceDetail] = useState<any|null>(null);
  const [_annonceDetailOpen, setAnnonceDetailOpen] = useState(false);
  const [_annonceDetailLoading, setAnnonceDetailLoading] = useState(false);
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
  
  // Filtres de surface
  const [surfaceMin, setSurfaceMin] = useState<number | null>(null);
  const [surfaceMax, setSurfaceMax] = useState<number | null>(null);

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

  // Index des sous-communes par commune parente (clé: parentSlug -> liste de noms de sous-communes)
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
    const arr = Array.from(found);
    arr.sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
    return arr.slice(0, 3).join(', ');
  }, [SUBS_BY_PARENT]);

  // Etats UI et filtres
  const [activeHomeTab, setActiveHomeTab] = useState<null | "annonces" | "colocataires" | "tableau-de-bord">(null);
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
  const [_countFiltered, setCountFiltered] = useState<number | null>(null);
  const pageLimit = 20;
  const offsetRef = useRef<number>(0);
  // Permettre de masquer/afficher la barre de filtres
  const [_filtersCollapsed, _setFiltersCollapsed] = useState<boolean>(false);

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
  const showCommuneMap = true;

  // Saisie par commune désactivée: sélection via carte et zones uniquement

  const computeZonesFromSlugs = useCallback((slugs: string[]): string[] => {
    const names = slugs.map((s) => parentSlugToName[s]).filter(Boolean) as string[];
    const zones: string[] = [];
    Object.entries(GROUPES).forEach(([zone, list]) => {
      if (names.some((n) => list.includes(n))) zones.push(zone);
    });
    return zones;
  }, [parentSlugToName, GROUPES]);

  // Mémoriser la fonction onChange pour éviter les re-rendus infinis
  const handleCommuneZoneChange = useCallback((slugs: string[], zones: string[] = []) => {
    setSelectionSource("map");
    setCommunesSelected((prev) => (sameIds(prev, slugs) ? prev : slugs));
    setZonesSelected((prev) => (sameIds(prev, zones) ? prev : zones));
  }, []);

  const getDocParentSlug = useCallback((d: any) => {
    const s = d?.communeSlug ? String(d.communeSlug) : (d?.ville ? slugify(String(d.ville)) : "");
    return nameToParentSlug[s] || s;
  }, [nameToParentSlug]);

  // Modes UI retirés: les sections sont désormais toujours visibles (secteur, budget, critères)
  const hasMode = useCallback((_m: string) => true, []);

  // Charge données via API
  const loadAnnonces = useCallback(async (append: boolean = false) => {
    if (activeHomeTab === null) return;
    if (loadingMore) return;
    setLoadingMore(true);
    if (!append) setFiltering(true);
    try {
      const isColoc = activeHomeTab === 'colocataires';
      const normalizedSlugs = Array.from(new Set((communesSelected || []).map((s) => altSlugToCanonical[s] || s))).filter(Boolean);
      const currentOffset = append ? offsetRef.current : 0;
      if (!append) offsetRef.current = 0;
      if (isColoc) {
        const result = await listColoc({
          limit: pageLimit,
          offset: currentOffset,
          ville: ville || undefined,
          prixMax: prixMax ?? null,
          slugs: normalizedSlugs,
          ageMin: critAgeMin ?? null,
          ageMax: critAgeMax ?? null,
        });
        const all = result.items;
        const totalCount = result.total;
        
        // Le filtrage est maintenant géré côté serveur par l'API
        // On applique seulement le tri et le mapping
        const mapped = all.map((p: any) => {
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
          const zonesLabel = zonesArr && zonesArr.length ? zonesArr.map((z) => (z === 'Intérieur' ? 'Centre' : z)).join(', ') : (p.ville || '-');
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
            subCommunesLabel: subLabel || undefined,
            age: p.age,
            profession: p.profession,
          };
        });
        mapped.sort((a: any, b: any) => sortBy === 'date'
          ? toMsAny(b) - toMsAny(a)
          : (sortBy === 'prix-desc' ? (b.prix ?? 0) - (a.prix ?? 0) : (a.prix ?? 0) - (b.prix ?? 0))
        );
        setAnnonces((prev) => {
          if (!append) return mapped;
          const existing = new Set(prev.map((x: any) => x.id));
          const additions = mapped.filter(i => !existing.has(i.id));
          if (additions.length === 0) return prev;
          return [...prev, ...additions];
        });
        
        // Utiliser le total retourné par l'API
        if (!append) {
          setCountFiltered(totalCount);
        } else {
          setCountFiltered((prev) => (prev ?? 0) + mapped.length);
        }
        
  offsetRef.current = currentOffset + mapped.length;
  setHasMore(mapped.length === pageLimit);
      } else {
        const result = await listAnnoncesPage(pageLimit, currentOffset, {
          ville: ville || undefined,
          codePostal: codePostal || undefined,
          prixMax: prixMax ?? undefined,
          slugs: normalizedSlugs.length > 0 ? normalizedSlugs : undefined,
          zones: zoneFilters.length > 0 ? zoneFilters : undefined
        });
        const all = result.items;
        const totalCount = result.total;
        
        // Le filtrage est maintenant géré côté serveur par l'API
        // On applique seulement le tri et le mapping
        const mapped = all.map((d: any) => ({
          id: d.id,
          titre: d.titre ?? d.title ?? '',
          ville: d.ville ?? null,
          prix: typeof d.prix === 'number' ? d.prix : undefined,
          surface: d.surface ?? null,
          description: d.description ?? null,
          imageUrl: d.imageUrl || defaultAnnonceImg,
          createdAt: d.createdAt,
          parentSlug: getDocParentSlug(d),
          subCommunesLabel: extractSubCommunesLabel([d.titre ?? d.title, d.description], getDocParentSlug(d)) || undefined,
        }));
        mapped.sort((a, b) => sortBy === 'date'
          ? toMsAny(b) - toMsAny(a)
          : (sortBy === 'prix-desc' ? (b.prix ?? 0) - (a.prix ?? 0) : (a.prix ?? 0) - (b.prix ?? 0))
        );
        setAnnonces((prev) => {
          if (!append) return mapped;
          const existing = new Set(prev.map((x: any) => x.id));
          const additions = mapped.filter(i => !existing.has(i.id));
          if (additions.length === 0) return prev;
          return [...prev, ...additions];
        });
        
        // Utiliser le total retourné par l'API
        if (!append) {
          setCountFiltered(totalCount);
        } else {
          setCountFiltered((prev) => (prev ?? 0) + mapped.length);
        }
        
  offsetRef.current = currentOffset + mapped.length;
  setHasMore(mapped.length === pageLimit);
      }
      if (shouldScrollToResultsOnNextDataRef.current) {
        try {
          if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
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
  }, [activeHomeTab, loadingMore, sortBy, prixMax, ville, codePostal, communesSelected, altSlugToCanonical, parentSlugToName, critAgeMin, critAgeMax, critProfession, computeZonesFromSlugs, getDocParentSlug, nameToParentSlug, pageLimit, ZONE_TO_SLUGS, extractSubCommunesLabel]);

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

  // Reset quand on change d'onglet
  useEffect(() => {
    if (activeHomeTab === null) return;
    // Ne pas faire remonter en haut lors du changement d'onglet
    // shouldScrollToResultsOnNextDataRef.current = true; // Commenté pour éviter le scroll automatique
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
  // Tri par défaut selon l'onglet
  setSortBy(activeHomeTab === 'colocataires' ? 'prix' : 'date');
  // Réinitialiser tous les filtres
  setPrixMax(null);
  setCommunesSelected([]);
  setZonesSelected([]);
  setZoneFilters([]);
  setSelectionSource(null);
  setVille("");
  setCodePostal("");
  setCountFiltered(null);
  // Réinitialiser critères coloc
  setCritAgeMin(null);
  setCritAgeMax(null);
  setCritProfession("");
  
  // Réinitialiser filtres de surface
  setSurfaceMin(null);
  setSurfaceMax(null);
    // Ne pas appeler loadAnnonces ici (il sera déclenché par l'effet "filtres")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHomeTab]);

  // Rechargement quand les filtres changent (sans vider la liste immédiatement)
  useEffect(() => {
    if (activeHomeTab === null) return;
    // Ne pas faire remonter en haut lors des changements de filtres
    // shouldScrollToResultsOnNextDataRef.current = true; // Commenté pour éviter le scroll automatique
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
  }, [sortBy, prixMax, ville, codePostal, communesSelected, zoneFilters, critAgeMin, critAgeMax, critProfession, surfaceMin, surfaceMax]);

  // Totaux globaux (premier affichage par onglet)
  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        if (activeHomeTab === 'annonces' && countAnnoncesTotal === null) {
          const res = await fetch('/api/annonces', { cache: 'no-store' });
          if (!aborted && res.ok) {
            const data = await res.json();
            setCountAnnoncesTotal(data.total || 0);
          }
        } else if (activeHomeTab === 'colocataires' && countProfilsTotal === null) {
          const res = await fetch('/api/coloc', { cache: 'no-store' });
          if (!aborted && res.ok) {
            const data = await res.json();
            setCountProfilsTotal(data.total || 0);
          }
        }
      } catch {}
    })();
    return () => { aborted = true; };
  }, [activeHomeTab, countAnnoncesTotal, countProfilsTotal]);

  // Liste affichée (filtrée + triée) utilisée à la fois pour l'entête et la grille
  const displayedAnnonces = useMemo(() => {
    let list = (Array.isArray(annonces) ? annonces : []);
    
         // Le filtrage par communes et prix est maintenant géré côté serveur par l'API
     // On applique seulement le filtrage par prix si nécessaire (fallback)
     if (prixMax !== null) {
       list = list.filter((a: any) => {
        if (typeof a?.prix !== "number") return false;
        return a.prix <= prixMax;
      });
     }

     // Filtrage par surface (côté client)
     if (surfaceMin !== null) {
       list = list.filter((a: any) => {
         if (typeof a?.surface !== "number") return false;
         return a.surface >= surfaceMin;
       });
     }
     if (surfaceMax !== null) {
       list = list.filter((a: any) => {
         if (typeof a?.surface !== "number") return false;
         return a.surface <= surfaceMax;
       });
     }

    // Filtrage client additionnel pour l'onglet colocataires (critères)
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
      }
      return toMsAny(b) - toMsAny(a);
    });
    return list;
  }, [annonces, prixMax, sortBy, activeHomeTab, critAgeMin, critAgeMax, critProfession, surfaceMin, surfaceMax]);

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
  }, [hasMore, loadingMore, filtering, activeHomeTab, sortBy, prixMax, ville, codePostal, communesSelected.length, critAgeMin, critAgeMax, critProfession, surfaceMin, surfaceMax, loadAnnonces, zoneFilters]);

  // Nettoyage global à l'unmount
  useEffect(() => {
    return () => {
     if (filtersDebounceRef.current) clearTimeout(filtersDebounceRef.current);
    };
  }, []);

  // NOUVEAU: ouvrir le détail d'une annonce (via API)
  const openAnnonceDetail = async (id: string) => {
    try {
      setAnnonceDetailOpen(true);
      setAnnonceDetailLoading(true);
      setAnnonceDetail(null);
      const res = await fetch(`/api/annonces/${id}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        console.log("[Accueil][AnnonceDetail] Données récupérées:", { id: data.id, userId: data.userId });
        setAnnonceDetail(data);
      } else {
        setAnnonceDetail(null);
      }
    } catch (e) {
      console.error("[Accueil][AnnonceDetail] load error", e);
      setAnnonceDetail(null);
    } finally {
      setAnnonceDetailLoading(false);
    }
  };

  // NOUVEAU: fermer le détail d'une annonce
  const _closeAnnonceDetail = () => {
    setAnnonceDetailOpen(false);
    setAnnonceDetail(null);
    setAnnonceDetailLoading(false);
  };

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
      // Tri stable par nom officiel pour éviter les variations d'ordre
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

  // Référence pour la section des options
  const optionsSectionRef = useRef<HTMLDivElement>(null);

  return (
    <>
  <main className="min-h-screen bg-gradient-to-br from-sky-50 via-emerald-50 to-teal-50 p-2 sm:p-6 flex flex-col items-center scroll-pt-28 md:scroll-pt-32">
      {/* Ecran de CHOIX initial */}
      {activeHomeTab === null ? (
  <section className="w-full max-w-[1440px] flex flex-col items-center">
          {/* Hero Section */}
          <div className="w-full max-w-6xl mx-auto mb-16">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-100 to-cyan-100 text-sky-800 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-sky-200 animate-pulse-slow">
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse-slow"></span>
                🌺 La plateforme de colocation à La Réunion
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-sky-600 via-cyan-500 to-teal-500 bg-clip-text text-transparent leading-tight animate-fade-in">
                Trouvez votre colocation
                <br />
                <span className="text-4xl md:text-5xl">idéale</span>
                <br />
              </h1>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Que vous cherchiez un logement à partager ou des colocataires, RodColoc vous aide à trouver votre match parfait à La Réunion.
                <br />
              </p>
            </div>
            
            {/* Image Hero */}
            <div className="w-full max-w-5xl mx-auto mb-12">
              <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-2xl bg-gradient-to-b from-sky-50 to-white transform hover:scale-[1.02] transition-transform duration-500">
              <Image
                src={homepageImageSrc}
                alt="Colocation à La Réunion, colocs sur la terrasse d'une kaz"
                width={1280}
                  height={480}
                priority
        sizes="(max-width: 640px) 92vw, (max-width: 1024px) 70vw, 640px"
                  className="w-full h-72 md:h-96 object-cover object-[center_bottom]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Bouton cliqué !');
                      try {
                        optionsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                      } catch (error) {
                        console.error('Erreur de défilement:', error);
                        // Fallback: redirection vers une ancre
                        window.location.hash = '#options-section';
                      }
                    }}
                    className="w-full bg-white/90 backdrop-blur-sm hover:bg-white hover:scale-105 transition-all duration-300 rounded-2xl p-4 shadow-lg border border-white/20 group cursor-pointer"
                    aria-label="Découvrir les options de colocation"
                    style={{ pointerEvents: 'auto', zIndex: 10 }}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <p className="text-slate-800 font-medium">
                        🌺 Découvrez la vie en colocation à La Réunion
                      </p>
                      <svg className="w-5 h-5 text-slate-600 group-hover:translate-y-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                    {/* Lien de secours pour les cas où JavaScript ne fonctionne pas */}
                    <a 
                      href="#options-section" 
                      className="absolute inset-0 w-full h-full"
                      style={{ zIndex: -1 }}
                      aria-hidden="true"
                    >
                    </a>
                  </button>
          </div>
              </div>
            </div>
          </div>
          
          {/* Options de recherche */}
          <div className="w-full max-w-5xl mx-auto" ref={optionsSectionRef} id="options-section">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-slate-800">Que souhaitez-vous rechercher ?</h2>
              <p className="text-slate-600 text-lg">Choisissez votre type de recherche pour commencer votre aventure</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <button
                className="group relative bg-gradient-to-br from-sky-50 to-cyan-50 rounded-3xl border border-sky-200 shadow-lg p-10 hover:shadow-2xl hover:border-sky-400 hover:scale-105 transition-all duration-500 text-left overflow-hidden animate-slide-up"
              onClick={() => setActiveHomeTab("annonces")}
            >
                <div className="absolute top-4 right-4 w-20 h-20 bg-sky-100 rounded-full opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="absolute bottom-4 left-4 w-16 h-16 bg-cyan-200 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"></div>
                
                <div className="relative z-10">
                  <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform duration-300">🏠🌺</div>
                  <h3 className="text-2xl font-bold mb-4 text-slate-800 group-hover:text-sky-700 transition-colors">Je cherche une colocation</h3>
                  <p className="text-slate-600 mb-4 text-lg leading-relaxed">Découvrez les annonces de logements à partager dans toute La Réunion. Trouvez votre nouveau chez-vous !</p>
                  <div className="inline-flex items-center gap-3 text-sky-600 group-hover:text-sky-700 font-semibold text-lg">
                    <span>Voir les annonces</span>
                    <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
                  </div>
              </div>
            </button>
              
            <button
                className="group relative bg-gradient-to-br from-teal-50 to-cyan-50 rounded-3xl border border-teal-200 shadow-lg p-10 hover:shadow-2xl hover:border-teal-400 hover:scale-105 transition-all duration-500 text-left overflow-hidden animate-slide-up"
              onClick={() => setActiveHomeTab("colocataires")}
            >
                <div className="absolute top-4 right-4 w-20 h-20 bg-green-100 rounded-full opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="absolute bottom-4 left-4 w-16 h-16 bg-emerald-200 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"></div>
                
                <div className="relative z-10">
                  <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform duration-300">👥🌴</div>
                  <h3 className="text-2xl font-bold mb-4 text-slate-800 group-hover:text-teal-700 transition-colors">Je cherche des colocataires</h3>
                  <p className="text-slate-600 mb-4 text-lg leading-relaxed">Rencontrez des personnes qui recherchent une colocation et partagez votre logement. Créez des liens !</p>
                  <div className="inline-flex items-center gap-3 text-teal-600 group-hover:text-teal-700 font-semibold text-lg">
                    <span>Voir les profils</span>
                    <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
                  </div>
              </div>
            </button>
          </div>
          </div>
          
          {/* Bandeau publicitaire (AdSense) géré par le back-office */}
          <div className="w-full max-w-5xl mx-auto mt-12">
            <AdBlock 
              placementKey="home.initial.belowHero" 
              title="Nos partenaires"
              variant="featured"
              className="my-2"
            />
          </div>
        </section>
      ) : (
        <>
          {/* Bouton "Changer de type de recherche" retiré */}

          {/* Ancre au-dessus des onglets */}
          <div ref={tabsTopRef} className="h-0 scroll-mt-28 md:scroll-mt-32" aria-hidden="true" />
          
          {/* Hero Section pour les onglets */}
          <div className="w-full max-w-7xl mx-auto mb-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-100 to-cyan-100 text-sky-800 px-4 py-2 rounded-full text-sm font-medium mb-4 border border-sky-200 animate-bounce-slow">
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse-slow"></span>
                {activeHomeTab === "annonces" ? "Recherche de logements" : activeHomeTab === "colocataires" ? "Recherche de colocataires" : "Tableau de bord"}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-sky-600 via-cyan-500 to-teal-500 bg-clip-text text-transparent animate-fade-in">
                {activeHomeTab === "annonces" ? "Trouvez votre colocation" : activeHomeTab === "colocataires" ? "Rencontrez vos colocataires" : "Tableau de bord"}
              </h1>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto whitespace-nowrap">
                {activeHomeTab === "annonces" 
                  ? "Découvrez les meilleures annonces de colocation à La Réunion" 
                  : activeHomeTab === "colocataires"
                  ? "Connectez-vous avec des personnes qui partagent vos valeurs et votre style de vie"
                  : "Vue d'ensemble de la plateforme et statistiques"
                }
                <br />
              </p>
            </div>
            
          </div>

          {/* Onglets modernes */}
          <div className="w-full max-w-7xl mx-auto mb-8 flex justify-center">
            <div
              role="tablist"
              aria-label="Type de recherche"
              className="inline-flex items-center rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden p-1"
            >
              <button
                role="tab"
                aria-selected={activeHomeTab === "annonces"}
                className={`px-6 py-3 text-sm font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-xl flex items-center gap-2 ${
                  activeHomeTab === "annonces"
                    ? "bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-lg transform scale-105"
                    : "text-slate-700 hover:bg-slate-50 hover:text-sky-600"
                }`}
                onClick={() => setActiveHomeTab("annonces")}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Annonces
              </button>
              <button
                role="tab"
                aria-selected={activeHomeTab === "colocataires"}
                className={`px-6 py-3 text-sm font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-xl flex items-center gap-2 ${
                  activeHomeTab === "colocataires"
                    ? "bg-gradient-to-r from-teal-600 to-cyan-500 text-white shadow-lg transform scale-105"
                    : "text-slate-700 hover:bg-slate-50 hover:text-teal-600"
                }`}
                onClick={() => setActiveHomeTab("colocataires")}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Colocataires
              </button>
              <button
                role="tab"
                aria-selected={activeHomeTab === "tableau-de-bord"}
                className={`px-6 py-3 text-sm font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-xl flex items-center gap-2 ${
                  activeHomeTab === "tableau-de-bord"
                    ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg transform scale-105"
                    : "text-slate-700 hover:bg-slate-50 hover:text-purple-600"
                }`}
                onClick={() => setActiveHomeTab("tableau-de-bord")}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Tableau de bord
              </button>
            </div>
          </div>

          

          {firestoreError && (
            <div className="w-full max-w-7xl mb-4 px-4 py-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-sm">
              {firestoreError}
            </div>
          )}

          {/* Contenu du tableau de bord */}
          {activeHomeTab === "tableau-de-bord" ? (
            <div className="w-full max-w-7xl mx-auto px-4">
              <DashboardHome />
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                {activeHomeTab === "annonces" ? "Annonces de colocation" : "Profils de colocataires"}
              </h1>
                <div className="w-24 h-1 bg-gradient-to-r from-orange-600 to-yellow-500 mx-auto rounded-full"></div>
              </div>

              {/* Layout 3 colonnes (desktop): filtres | annonces | publicité */}
              <div className="w-full max-w-[1400px] flex flex-col md:flex-row md:items-start gap-6">
            {/* Colonne annonces (centre en ≥md) */}
            <div className="flex-1 min-w-0 md:order-2 max-w-2xl">
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
                    // Si en cours de chargement, afficher "Chargement..."
                    if (filtering) {
                      return 'Chargement...';
                    }
                    
                    const hasCommuneSel = selectedParentSlugs.length > 0;
                    const hasBudget = prixMax !== null;
                    const hasVille = !!ville || !!codePostal;
                    const hasCriteres = activeHomeTab === 'colocataires' && (critAgeMin !== null || critAgeMax !== null || !!critProfession);
                     const hasSurface = surfaceMin !== null || surfaceMax !== null;
                     const anyFilter = hasCommuneSel || hasBudget || hasVille || hasCriteres || hasSurface;
                    // Si aucun filtre, montrer le total global par onglet
                    if (!anyFilter) {
                      return activeHomeTab === 'annonces' ? (countAnnoncesTotal ?? '…') : (countProfilsTotal ?? '…');
                    }
                    // Sinon, montrer le nombre d'annonces réellement affichées après filtrage côté client
                    return displayedAnnonces.length;
                  })()}
          {" "}
          {activeHomeTab === 'annonces' ? 'trouvées' : 'trouvés'}
                </div>
              </div>

              <div ref={resultsTopRef} className="h-0 scroll-mt-28 md:scroll-mt-32" aria-hidden="true" />
              <div className="grid grid-cols-1 gap-6 prevent-anchor">
                {(!filtering && displayedAnnonces.length === 0) ? (
                  <p className="text-slate-500 text-center mt-4 col-span-full">Aucune annonce trouvée.</p>
                ) : (
                  displayedAnnonces.flatMap((annonce: any, idx: number) => {
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
                            openAnnonceDetail(annonce.id);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (activeHomeTab === "annonces" && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault();
                            openAnnonceDetail(annonce.id);
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
              zonesLabel={annonce.zonesLabel}
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
                            userId={annonce.userId}
                            priority={idx < 3} // Priorité pour les 3 premières annonces (above the fold)
                            onEdit={isAdmin ? () => setEditAnnonce(annonce) : undefined}
                            onDelete={isAdmin ? () => setDeleteAnnonceId(annonce.id) : undefined}
                            onClick={() => {
                              openAnnonceDetail(annonce.id);
                            }}
                          />
                        )}
                      </div>
                    );
                    const rendered: React.ReactNode[] = [];
                    if (activeHomeTab === "colocataires") {
                      rendered.push(
                        <div
                          key={`wrap-${annonce.id}`}
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
                      rendered.push(card);
                    }
                    // Insérer une pub inline toutes les 8 cartes (annonces et profils)
                    if ((idx + 1) % 8 === 0) {
                      rendered.push(
                        <div key={`ad-inline-${idx}`} className="col-span-full my-6">
                          <AdBlock 
                            placementKey="listing.inline.1" 
                            title="Suggestion pour vous"
                            variant="compact"
                            showBorder={false}
                          />
                        </div>
                      );
                    }
                    return rendered;
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
              
              {/* Publicité après les annonces */}
              {activeHomeTab === "annonces" && displayedAnnonces.length > 0 && (
                <div className="mt-8 mb-6">
                  <AdBlock 
                    placementKey="home.annonces.after" 
                    title="Découvrez nos partenaires"
                    variant="featured"
                    className="max-w-4xl mx-auto"
                  />
                </div>
              )}
              
              {/* Publicité après les profils colocataires */}
              {activeHomeTab === "colocataires" && displayedAnnonces.length > 0 && (
                <div className="mt-8 mb-6">
                  <AdBlock 
                    placementKey="home.colocataires.after" 
                    title="Nos partenaires"
                    variant="featured"
                    className="max-w-4xl mx-auto"
                  />
                </div>
              )}
              
              {/* Style local: empêche l'ancrage automatique qui peut déplacer la page quand du contenu est inséré */}
              <style>{`
                .prevent-anchor { overflow-anchor: none; }
              `}</style>

              {/* Modaux globaux au niveau page (hors boucle) */}
              {activeHomeTab === "annonces" && annonceDetail && annonceDetail.id && (
                <AnnonceDetailModal
                  open={true}
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

            {/* Colonne publicité (droite en ≥md) */}
            <div className="w-full md:order-3 md:basis-[20%] md:flex-shrink-0">
              <div className="sticky top-24 space-y-6">
                <AdBlock 
                  placementKey="home.list.rightSidebar" 
                  title="Annonces partenaires"
                  variant="featured"
                  className="mb-4"
                />
              </div>
            </div>

            {/* Colonne filtres (gauche en ≥md) */}
            <div className="w-full md:order-1 md:basis-[24%] lg:basis-[26%] md:flex-shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault(); // mise à jour auto: pas d'appel manuel
                }}
                className="w-full bg-gradient-to-br from-white to-slate-50 rounded-3xl border border-slate-200/60 shadow-xl backdrop-blur-sm p-6 flex flex-col gap-6"
              >
                {/* Titre Affiner la recherche avec design moderne */}
                <div className="bg-gradient-to-r from-sky-50 to-emerald-50 px-4 py-3 border border-sky-200/50 -mx-6 -mt-6 mb-4 rounded-t-3xl">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-emerald-500 rounded-lg flex items-center justify-center animate-spin-slow">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                    </div>
                    <div className="text-lg font-bold bg-gradient-to-r from-sky-600 to-emerald-500 bg-clip-text text-transparent tracking-tight">
                      Affiner la recherche
                  </div>
                </div>
                </div>
                
                <div className="hidden">
                  {/* anciennement: <div className="grid grid-cols-3 gap-2"> ... */}
                </div>

                {/* Contenu des filtres, masquable */}
                <div id="filters-content" className={_filtersCollapsed ? "hidden" : "block"}>
                {/* Zones rapides (OU) tout en haut - visibles seulement en mode carte */}
                {hasMode('map') && (
                  <div ref={zonesBlockRef} className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-4 border border-slate-200/50">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="text-sm font-semibold text-slate-700">Secteur de recherche</div>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 text-center justify-items-stretch">
                      {Object.keys(GROUPES).map((z) => (
                        <button
                          key={z}
                          type="button"
                          onClick={() => toggleZoneFilter(z)}
                          className={`w-full px-3 py-2 rounded-xl text-xs font-medium leading-none border transition-all duration-200 flex items-center justify-center text-center ${
                            zoneFilters.includes(z)
                              ? "bg-gradient-to-r from-sky-600 to-emerald-500 text-white border-transparent shadow-lg transform scale-105"
                              : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-sky-400 hover:shadow-sm"
                          }`}
                        >
                          {z === "Intérieur" ? "Centre" : z}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Carte (déplacée en bas) */}
                <div ref={communeBlockRef} className="flex flex-col gap-6 items-stretch justify-center">
                  {/* Budget (toujours visible) */}
                  <div ref={budgetBlockRef} className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-4 border border-slate-200/50">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <label className="text-sm font-semibold text-slate-700">
                        {activeHomeTab === "annonces" ? "Prix maximum" : "Budget maximum"}
                    </label>
                    </div>
                    <div className="relative">
                    <input
                      type="number"
                      value={prixMax ?? ""}
                      onChange={(e) => setPrixMax(Number(e.target.value) || null)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-slate-700 placeholder-slate-400"
                      placeholder={activeHomeTab === "annonces" ? "Ex: 600" : "Ex: 600"}
                    />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 font-medium">€</div>
                    </div>
                  </div>

                   {/* Surface (toujours visible) */}
                   <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-4 border border-slate-200/50">
                     <div className="flex items-center gap-2 mb-3">
                       <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                         <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                         </svg>
                       </div>
                       <div className="text-sm font-semibold text-slate-700">Surface</div>
                     </div>
                   <div className="grid grid-cols-2 gap-3 w-full">
                     <div>
                         <label className="block text-xs font-medium text-slate-600 mb-2">Minimum</label>
                         <div className="relative">
                       <input
                         type="number"
                         value={surfaceMin ?? ""}
                         onChange={(e) => setSurfaceMin(Number(e.target.value) || null)}
                             className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200 text-slate-700 placeholder-slate-400"
                         placeholder="Ex: 20"
                       />
                           <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-xs">m²</div>
                         </div>
                     </div>
                     <div>
                         <label className="block text-xs font-medium text-slate-600 mb-2">Maximum</label>
                         <div className="relative">
                       <input
                         type="number"
                         value={surfaceMax ?? ""}
                         onChange={(e) => setSurfaceMax(Number(e.target.value) || null)}
                             className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200 text-slate-700 placeholder-slate-400"
                         placeholder="Ex: 80"
                       />
                           <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-xs">m²</div>
                         </div>
                       </div>
                     </div>
                   </div>

                                     {/* Critères (visibles seulement pour les colocataires) */}
                   {activeHomeTab === 'colocataires' && (
                   <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-4 border border-slate-200/50">
                     <div className="flex items-center gap-2 mb-3">
                       <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                         <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                         </svg>
                       </div>
                       <div className="text-sm font-semibold text-slate-700">Critères colocataires</div>
                     </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                    <div>
                         <label className="block text-xs font-medium text-slate-600 mb-2">Âge min</label>
                         <input 
                           type="number" 
                           className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-slate-700 placeholder-slate-400" 
                           value={critAgeMin ?? ''} 
                           onChange={(e) => setCritAgeMin(Number(e.target.value) || null)} 
                           placeholder="Ex: 20" 
                         />
                    </div>
                    <div>
                         <label className="block text-xs font-medium text-slate-600 mb-2">Âge max</label>
                         <input 
                           type="number" 
                           className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-slate-700 placeholder-slate-400" 
                           value={critAgeMax ?? ''} 
                           onChange={(e) => setCritAgeMax(Number(e.target.value) || null)} 
                           placeholder="Ex: 35" 
                         />
                    </div>
                    <div>
                         <label className="block text-xs font-medium text-slate-600 mb-2">Profession</label>
                         <input 
                           type="text" 
                           className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-slate-700 placeholder-slate-400" 
                           value={critProfession} 
                           onChange={(e) => setCritProfession(e.target.value)} 
                           placeholder="Ex: Étudiant, CDI..." 
                         />
                       </div>
                    </div>
                  </div>
                   )}
                </div>

              {/* Tri retiré de la barre gauche */}

              {/* Mise à jour automatique silencieuse */}

              {/* Bouton Réinitialiser en bas du bloc */}
              <div className="flex justify-center mt-6 pt-4 border-t border-slate-200/50">
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
                    // Réinitialiser les filtres de surface
                    setSurfaceMin(null);
                    setSurfaceMax(null);
                    // Réinitialiser les critères colocataires
                    setCritAgeMin(null);
                    setCritAgeMax(null);
                    setCritProfession("");
                      // Remplacement au 1er snapshot pour éviter les doublons
                      resetOnFirstSnapshotRef.current = true;
                      setFiltering(true);
                      // pas d'appel direct à loadAnnonces: l'effet "filtres" va relancer proprement
                    }}
                  className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-50 to-emerald-50 border border-sky-200 text-sky-700 rounded-xl hover:from-sky-100 hover:to-emerald-100 hover:border-sky-300 hover:shadow-md transition-all duration-200 text-sm font-medium"
                  >
                  <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Réinitialiser tous les filtres
                  </button>
              </div>
              </div>
            </form>

              {/* Carte */}
                              {showCommuneMap && !_filtersCollapsed && (
                <div className="mt-6 bg-gradient-to-br from-white to-slate-50 rounded-3xl border border-slate-200/60 shadow-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-sky-50 to-emerald-50 px-4 py-3 border-b border-sky-200/50">
                      <div className="flex items-center justify-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-emerald-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </div>
                      <div className="text-lg font-bold bg-gradient-to-r from-sky-600 to-emerald-500 bg-clip-text text-transparent tracking-tight">
                        Rechercher par secteur
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                  <CommuneZoneSelector
                    value={communesSelected}
                    computeZonesFromSlugs={computeZonesFromSlugs}
                    onChange={handleCommuneZoneChange}
                    height={420}
                    className="w-full"
                    alwaysMultiSelect
                    // Masque le résumé de sélection sous la carte
                    hideSelectionSummary
                  />
                  </div>
                </div>
              )}


              {/* Blocs de sélection — masqués si filtres repliés */}
              {!_filtersCollapsed && (zonesSelected.length > 0 || communesSelected.length > 0) && (
                <div className="space-y-4 mt-4">
                  <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200/50 shadow-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="text-sm font-semibold text-slate-700">Secteurs sélectionnés</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border border-blue-200 font-medium">{zoneFilters.length}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setZoneFilters([]);
                            setCommunesSelected([]);
                            setZonesSelected([]);
                            setSelectionSource(null);
                          }}
                          disabled={zonesSelected.length === 0 && communesSelected.length === 0 && !ville && !codePostal && zoneFilters.length === 0}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 ${
                            (zonesSelected.length === 0 && communesSelected.length === 0 && !ville && !codePostal && zoneFilters.length === 0)
                              ? "border-slate-200 text-slate-400 bg-slate-100 cursor-not-allowed"
                              : "border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 hover:shadow-sm"
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
                            {z === "Intérieur" ? "Centre" : z}
                            <button
                              type="button"
                              aria-label={`Retirer le secteur ${z}`}
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
            </div>
          </div>


          {/* Modal détail annonce - SUPPRIMÉ, remplacé par AnnonceDetailModal */}

          {/* Modal détail profil colocataire */}
          {activeHomeTab === "colocataires" && colocDetailOpen && (
            <div
              className="fixed inset-0 z-[9999] bg-blue-600/20 backdrop-blur-sm flex items-center justify-center p-4 rounded-2xl"
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
                                            {colocDetail.genre && (
                          <div className="text-sm text-slate-600">
                            Genre: {colocDetail.genre}
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
            </>
          )}
      
    </main>
    </>
  );
}

