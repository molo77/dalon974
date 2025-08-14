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
} from "firebase/firestore";
import type { Query, QuerySnapshot, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AnnonceCard from "@/components/AnnonceCard";
// import MapReunion from "@/components/MapReunion";
import dynamic from "next/dynamic";
const MapReunionLeaflet = dynamic(() => import("@/components/MapReunionLeaflet"), { ssr: false });
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
  const [sortBy, setSortBy] = useState<"date" | "prix">("date");

  // NOUVEAU: onglets accueil
  const [activeHomeTab, setActiveHomeTab] = useState<"annonces" | "colocataires" | null>(null);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  // NOUVEAU: communes sélectionnées (slugs)
  const [communesSelected, setCommunesSelected] = useState<string[]>([]);
  const [showCommuneMap, setShowCommuneMap] = useState(false);

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
    setVille(val);
    const norm = slugify(val || "");
    if (!val) {
      setCommunesSelected((prev) => (sameIds(prev, []) ? prev : []));
    } else if (nameToParentSlug[norm]) {
      const next = [nameToParentSlug[norm]];
      setCommunesSelected((prev) => (sameIds(prev, next) ? prev : next));
    }

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

  const subsRef = useRef<(() => void)[]>([]); // abonnements actifs

  const clearAllSubs = () => {
    subsRef.current.forEach((u) => { try { u(); } catch {} });
    subsRef.current = [];
    // IMPORTANT: libérer le blocage de loadAnnonces
    setLoadingMore(false);
  };

  // Helper: déduire le slug parent de l'annonce depuis communeSlug ou ville
  const getDocParentSlug = (d: any) => {
    const raw = d?.communeSlug || d?.ville || "";
    const s = slugify(raw);
    return nameToParentSlug[s] || s;
  };

  const loadAnnonces = async () => {
    // Ne rien charger si aucun choix n’a été fait
    if (activeHomeTab === null) return;
    if (loadingMore || !hasMore || firestoreError) return;

    setLoadingMore(true);

    try {
      const isColoc = activeHomeTab === "colocataires";
      const collectionName = isColoc ? "colocProfiles" : "annonces";
      const priceField = isColoc ? "budget" : "prix";
      const orderField = sortBy === "date" ? "createdAt" : priceField;

      const hasCommuneFilter = communesSelected.length > 0;

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

      const qWithOrder = (qBase: Query<DocumentData>) =>
        query(qBase, orderBy(orderField, sortBy === "date" ? "desc" : "asc"), limit(10));

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
          ? (d: any) => communesSelected.includes(getDocParentSlug(d))
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
        const unsub = onSnapshot(
          qOrdered,
          (snap: QuerySnapshot<DocumentData>) => {
            let docsArr = snap.docs;
            if (clientFilter) docsArr = docsArr.filter((d: any) => clientFilter(d.data()));
            const mapped = docsArr.map((doc: any) => {
              const d = doc.data() as Record<string, any>;
              return isColoc
                ? { id: doc.id, titre: d.nom || "Recherche colocation", ville: d.ville, prix: d.budget, surface: undefined, description: d.description, imageUrl: d.imageUrl || defaultAnnonceImg, createdAt: d.createdAt }
                : { id: doc.id, titre: d.titre, ville: d.ville, prix: d.prix, surface: d.surface, description: d.description, imageUrl: d.imageUrl || defaultAnnonceImg, createdAt: d.createdAt };
            });
            setAnnonces((prev) => {
              const byId = new Map(prev.map((x) => [x.id, x]));
              mapped.forEach((m) => byId.set(m.id, { ...(byId.get(m.id) || {}), ...m }));
              const arr = Array.from(byId.values());
              const toMs = (x: any) => {
                const v = x?.createdAt;
                if (!v) return 0;
                if (typeof v === "number") return v;
                if (v?.seconds) return v.seconds * 1000 + (v.nanoseconds ? Math.floor(v.nanoseconds / 1e6) : 0);
                const p = Date.parse(v);
                return isNaN(p) ? 0 : p;
              };
              if (sortBy === "date") arr.sort((a, b) => toMs(b) - toMs(a));
              else arr.sort((a, b) => (a.prix ?? 0) - (b.prix ?? 0));
              return arr;
            });
            if (docsArr.length > 0) setLastDoc(docsArr[docsArr.length - 1]); else setHasMore(false);
            setLoadingMore(false);
          },
          (err: any) => {
            if (err?.code === "failed-precondition" && String(err?.message || "").toLowerCase().includes("index")) {
              // Fallback sans orderBy. Si le where prix pose problème (index composite manquant),
              // basculer sur une requête SANS prix et filtrer le prix côté client.
              const useNoPrice = !!priceWhere;
              const qNoOrder = lastDoc
                ? query(useNoPrice ? fallbackNoPrice : fallback, startAfter(lastDoc))
                : useNoPrice
                ? fallbackNoPrice
                : fallback;

              const unsub2 = onSnapshot(
                qNoOrder as Query<DocumentData>,
                (snap2: QuerySnapshot<DocumentData>) => {
                  let docsArr = snap2.docs;
                  // Applique filtre client combiné (ET commun(es) + prix si besoin)
                  const combined = combineFilters(clientFilter, useNoPrice ? clientPriceFilter : undefined);
                  if (combined) docsArr = docsArr.filter((d: any) => combined(d.data()));
                  const mapped = docsArr.map((doc: any) => {
                    const d = doc.data() as any;
                    return isColoc
                      ? { id: doc.id, titre: d.nom || "Recherche colocation", ville: d.ville, prix: d.budget, surface: undefined, description: d.description, imageUrl: d.imageUrl || defaultAnnonceImg, createdAt: d.createdAt }
                      : { id: doc.id, titre: d.titre, ville: d.ville, prix: d.prix, surface: d.surface, description: d.description, imageUrl: d.imageUrl || defaultAnnonceImg, createdAt: d.createdAt };
                  });
                  setAnnonces((prev) => {
                    const byId = new Map(prev.map((x) => [x.id, x]));
                    mapped.forEach((m) => byId.set(m.id, { ...(byId.get(m.id) || {}), ...m }));
                    const arr = Array.from(byId.values());
                    const toMs = (x: any) => {
                      const v = x?.createdAt;
                      if (!v) return 0;
                      if (typeof v === "number") return v;
                      if (v?.seconds) return v.seconds * 1000 + (v.nanoseconds ? Math.floor(v.nanoseconds / 1e6) : 0);
                      const p = Date.parse(v);
                      return isNaN(p) ? 0 : p;
                    };
                    if (sortBy === "date") arr.sort((a, b) => toMs(b) - toMs(a));
                    else arr.sort((a, b) => (a.prix ?? 0) - (b.prix ?? 0));
                    return arr;
                  });
                  if (docsArr.length > 0) setLastDoc(docsArr[docsArr.length - 1]); else setHasMore(false);
                  setLoadingMore(false);
                },
                (err2: any) => {
                  console.error("[Accueil][onSnapshot][fallback-noOrder][" + label + "]", err2);
                  setLoadingMore(false);
                }
              );
              subsRef.current.push(unsub2);
            } else {
              console.error("[Accueil][onSnapshot][" + label + "]", err);
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
          const clientFilterCombined = combineFilters(requireAllSelected, undefined);
          for (const c of chunks(communesSelected, 10)) {
            const chunkWhere = where(field as any, op as any, c);
            const qFilterOnly = query(baseColRef, ...commonFiltersWithPrice, chunkWhere);
            const qFilterOnlyNoPrice = query(baseColRef, ...commonFiltersBase, chunkWhere);
            const qOrdered = qWithOrder(qFilterOnly);
            const qPaged = lastDoc ? query(qOrdered, startAfter(lastDoc)) : qOrdered;
            attachListener(qPaged as Query<DocumentData>, {
              label: "communes-slugs-coloc",
              clientFilter: clientFilterCombined,
              fallback: qFilterOnly as Query<DocumentData>,
              fallbackNoPrice: qFilterOnlyNoPrice as Query<DocumentData>,
            });
          }
        } else {
          // Annonces: pas de where("communeSlug","in",...), filtrage communes côté client
          const qFilterOnly = query(baseColRef, ...commonFiltersWithPrice);
          const qFilterOnlyNoPrice = query(baseColRef, ...commonFiltersBase);
          const qOrdered = qWithOrder(qFilterOnly);
          const qPaged = lastDoc ? query(qOrdered, startAfter(lastDoc)) : qOrdered;
          attachListener(qPaged as Query<DocumentData>, {
            label: "annonces-communes-client",
            clientFilter: annoncesClientFilter,
            fallback: qFilterOnly as Query<DocumentData>,
            fallbackNoPrice: qFilterOnlyNoPrice as Query<DocumentData>,
          });
        }
      } else {
        // Pas de filtre communes: comportement standard
        const qFilterOnly = query(baseColRef, ...commonFiltersWithPrice);
        const qFilterOnlyNoPrice = query(baseColRef, ...commonFiltersBase);
        const qOrdered = qWithOrder(qFilterOnly);
        const qPaged = lastDoc ? query(qOrdered, startAfter(lastDoc)) : qOrdered;
        attachListener(qPaged as Query<DocumentData>, {
          label: "page",
          fallback: qFilterOnly as Query<DocumentData>,
          fallbackNoPrice: qFilterOnlyNoPrice as Query<DocumentData>,
        });
      }
    } catch (err: any) {
      console.error("Erreur chargement temps réel :", err);
      setLoadingMore(false);
    }
  };

  // Reset quand on change d’onglet: nettoie + reset filtres (ne dépend que de activeHomeTab)
  useEffect(() => {
    if (activeHomeTab === null) return;
    clearAllSubs();
    setFirestoreError(null);
    setAnnonces([]);
    setLastDoc(null);
    setHasMore(true);
    // reset filtres ici (ok car l’effet ne dépend pas de ces états)
    setCommunesSelected([]);
    setVille("");
    setCodePostal("");
    // Ne pas appeler loadAnnonces ici (il sera déclenché par l’effet “filtres”)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHomeTab]);

  // Rechargement quand les filtres changent (sans réinitialiser les filtres eux‑mêmes)
  useEffect(() => {
    if (activeHomeTab === null) return;
    clearAllSubs();
    setAnnonces([]);
    setLastDoc(null);
    setHasMore(true);
    loadAnnonces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, prixMax, ville, codePostal, communesSelected]);

  // Nettoyage global à l’unmount
  useEffect(() => {
    return () => clearAllSubs();
  }, []);

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
          <div className="w-full max-w-6xl flex justify-end mb-2">
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
          <div className="w-full max-w-6xl flex gap-2 mb-4">
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
            <div className="w-full max-w-6xl mb-4 px-4 py-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-sm">
              {firestoreError}
            </div>
          )}

          <h1 className="text-3xl font-bold mb-6 text-center">
            {activeHomeTab === "annonces" ? "Annonces de colocation" : "Profils de colocataires"}
          </h1>

          <form
            onSubmit={(e) => {
              e.preventDefault(); // mise à jour auto: pas d’appel manuel
            }}
            className="mb-6 w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-4"
          >
            <div className="flex flex-wrap gap-4 items-end justify-center">
              {/* Commune uniquement */}
              <div className="flex">
                <div>
                  <label className="block text-sm font-medium mb-1">Commune</label>
                  <input
                    type="text"
                    value={ville}
                    onChange={(e) => onVilleChange(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 w-56"
                    placeholder="Ex: Saint-Denis"
                    list="communes-reu"
                  />
                </div>
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
                  onChange={(e) => setSortBy(e.target.value as "date" | "prix")}
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                >
                  <option value="date">Date récente</option>
                  <option value="prix">{activeHomeTab === "annonces" ? "Prix croissant" : "Budget croissant"}</option>
                </select>
              </div>

              {/* Retrait du bouton "Filtrer" (maj auto) */}
              <span className="text-xs text-slate-500 self-center">Mise à jour automatique</span>

              <button
                type="button"
                onClick={() => {
                  setFirestoreError(null);
                  setVille("");
                  setCodePostal("");
                  setPrixMax(null);
                  setSortBy("date");
                  setAnnonces([]);
                  setLastDoc(null);
                  setHasMore(true);
                  // pas d’appel direct à loadAnnonces: l’effet "filtres" va relancer proprement
                }}
                className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50"
              >
                Réinitialiser
              </button>
            </div>

            {/* NOUVEAU: Filtrer par communes */}
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowCommuneMap(v => !v)}
                className="text-sm text-blue-700 underline"
              >
                {showCommuneMap ? "Masquer" : "Filtrer par communes (carte)"}
              </button>
              {showCommuneMap && (
                <div className="mt-3 rounded-2xl border border-slate-200 p-3">
                  {/* NOUVEAU: Filtrer par communes (carte satellite) */}
                  <MapReunionLeaflet
                    defaultSelected={communesSelected}
                    onSelectionChange={(ids) =>
                      setCommunesSelected((prev) => (sameIds(prev, ids) ? prev : ids))
                    }
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
            </div>
          </form>

          <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {annonces.map((annonce) => (
              <AnnonceCard
                key={annonce.id}
                id={annonce.id}
                titre={annonce.titre}
                ville={annonce.ville}
                prix={annonce.prix}
                surface={annonce.surface}
                description={annonce.description}
                imageUrl={annonce.imageUrl || defaultAnnonceImg}
              />
            ))}

            {loadingMore && <p className="text-slate-500 text-center mt-4 col-span-full">Chargement...</p>}

            {!hasMore && annonces.length > 0 && (
              <p className="text-slate-400 text-center mt-4 col-span-full">Toutes les cartes sont affichées.</p>
            )}
          </div>
        </>
      )}
    </main>
  );
}
