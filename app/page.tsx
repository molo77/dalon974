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
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    try {
      let baseQuery: any = query(
        collection(db, "annonces")
      );

      if (prixMax !== null) {
        baseQuery = query(baseQuery, where("prix", "<=", prixMax));
      }

      if (ville) {
        baseQuery = query(
          baseQuery,
          where("ville", "==", ville)
        );
      }

      // Augmentez la limite pour charger plus d'annonces d'un coup
      baseQuery = query(
        baseQuery,
        orderBy(sortBy === "date" ? "createdAt" : "prix", sortBy === "date" ? "desc" : "asc"),
        limit(10)
      );

      const paginatedQuery = lastDoc
        ? query(baseQuery, startAfter(lastDoc))
        : baseQuery;

      const snapshot = await getDocs(paginatedQuery);

      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Record<string, any>),
      }));

      setAnnonces((prev) => {
        const existingIds = new Set(prev.map((a) => a.id));
        return [...prev, ...docs.filter((d) => !existingIds.has(d.id))];
      });

      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Erreur chargement annonces :", err);
    }

    setLoadingMore(false);
  };

  useEffect(() => {
    loadAnnonces();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const bottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;

      if (bottom && hasMore && !loadingMore) {
        loadAnnonces();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  });

  return (
    <main className="min-h-screen p-2 sm:p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center">Annonces de colocation</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
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
          <label className="block text-sm font-medium mb-1">Prix max (€)</label>
          <input
            type="number"
            value={prixMax ?? ""}
            onChange={(e) => setPrixMax(Number(e.target.value) || null)}
            className="border border-gray-300 rounded px-3 py-2 w-full"
            placeholder="Ex: 600"
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
            <option value="prix">Prix croissant</option>
          </select>
        </div>

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Filtrer
        </button>
        <button
          type="button"
          onClick={() => {
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
          <p className="text-slate-400 text-center mt-4 col-span-full">Toutes les annonces sont affichées.</p>
        )}
      </div>
    </main>
  );
}

