"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  startAfter,
  where,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import AnnonceCard from "@/components/AnnonceCard";

export default function HomePage() {
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any | null>(null);

  const [ville, setVille] = useState("");
  const [prixMax, setPrixMax] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "prix">("date");

  // NOUVEAU: onglets accueil
  const [activeHomeTab, setActiveHomeTab] = useState<"annonces" | "colocataires" | null>(null);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

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

  const loadAnnonces = async () => {
    // Ne rien charger si aucun choix n’a été fait
    if (activeHomeTab === null) return;
    if (loadingMore || !hasMore || firestoreError) return;
    setLoadingMore(true);

    try {
      // Choix collection et champs selon onglet
      const isColoc = activeHomeTab === "colocataires";
      const collectionName = isColoc ? "colocataires" : "annonces";
      const priceField = isColoc ? "budget" : "prix";
      const orderField = sortBy === "date" ? "createdAt" : priceField;

      let baseQuery: any = query(collection(db, collectionName));

      if (prixMax !== null) {
        baseQuery = query(baseQuery, where(priceField, "<=", prixMax));
      }
      if (ville) {
        baseQuery = query(baseQuery, where("ville", "==", ville));
      }

      baseQuery = query(
        baseQuery,
        orderBy(orderField, sortBy === "date" ? "desc" : "asc"),
        limit(10)
      );

      const paginatedQuery = lastDoc
        ? query(baseQuery, startAfter(lastDoc))
        : baseQuery;

      const snapshot = await getDocs(paginatedQuery);

      // Normalisation: map en forme AnnonceCard-friendly
      const docs = snapshot.docs.map((doc) => {
        const d = doc.data() as Record<string, any>;
        return isColoc
          ? {
              id: doc.id,
              titre: d.nom || "Recherche colocation",
              ville: d.ville,
              prix: d.budget,
              surface: undefined,
              description: d.description,
              imageUrl: d.imageUrl || defaultAnnonceImg,
            }
          : {
              id: doc.id,
              titre: d.titre,
              ville: d.ville,
              prix: d.prix,
              surface: d.surface,
              description: d.description,
              imageUrl: d.imageUrl || defaultAnnonceImg,
            };
      });

      setAnnonces((prev) => {
        const existingIds = new Set(prev.map((a) => a.id));
        return [...prev, ...docs.filter((d) => !existingIds.has(d.id))];
      });

      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      } else {
        setHasMore(false);
      }
    } catch (err: any) {
      console.error("Erreur chargement :", err);
      if (err?.code === "permission-denied") {
        const cible = activeHomeTab === "colocataires" ? "la liste des colocataires" : "les annonces";
        setFirestoreError(
          `Accès refusé pour ${cible}. Vérifie les règles Firestore (lecture publique de la collection "${activeHomeTab}").`
        );
        setHasMore(false);
      }
    }

    setLoadingMore(false);
  };

  // loadAnnonces n'est plus appelé au mount: on attend le choix de l'utilisateur

  // Reset quand on change d’onglet: ne lance que si onglet sélectionné
  useEffect(() => {
    if (activeHomeTab === null) return;
    setFirestoreError(null);
    setAnnonces([]);
    setLastDoc(null);
    setHasMore(true);
    loadAnnonces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHomeTab]);

  useEffect(() => {
    const handleScroll = () => {
      const bottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;

      if (
        activeHomeTab !== null && // bloquer si pas de choix
        bottom &&
        hasMore &&
        !loadingMore &&
        !firestoreError
      ) {
        loadAnnonces();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  });

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
              e.preventDefault();
              setFirestoreError(null);
              setAnnonces([]);
              setLastDoc(null);
              setHasMore(true);
              loadAnnonces();
            }}
            className="mb-6 w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-4 items-end justify-center"
          >
            <div>
              <label className="block text-sm font-medium mb-1">Ville</label>
              <input
                type="text"
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 w-full"
                placeholder="Ex: Saint-Denis"
              />
            </div>

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

            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Filtrer
            </button>
            <button
              type="button"
              onClick={() => {
                setFirestoreError(null);
                setVille("");
                setPrixMax(null);
                setSortBy("date");
                setAnnonces([]);
                setLastDoc(null);
                setHasMore(true);
                loadAnnonces();
              }}
              className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50"
            >
              Réinitialiser
            </button>
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

