"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, startAfter, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AnnonceCard from "@/components/AnnonceCard";

export default function HomePage() {
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any | null>(null);

  const loadAnnonces = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);

    try {
      const baseQuery = query(
        collection(db, "annonces"),
        orderBy("createdAt", "desc"),
        limit(5)
      );

      const paginatedQuery = lastDoc
        ? query(baseQuery, startAfter(lastDoc))
        : baseQuery;

      const snapshot = await getDocs(paginatedQuery);

      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Éviter les doublons
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
    <main className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center">Annonces de colocation</h1>

      <div className="w-full max-w-3xl flex flex-col gap-4 items-center">
        {annonces.map((annonce) => (
          <AnnonceCard key={annonce.id} {...annonce} />
        ))}

        {loadingMore && (
          <p className="text-gray-500 text-center mt-4">Chargement...</p>
        )}

        {!hasMore && annonces.length > 0 && (
          <p className="text-gray-400 text-center mt-4">Toutes les annonces sont affichées.</p>
        )}
      </div>
    </main>
  );
}
