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
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

export default function HomePage() {
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any | null>(null);

  const [ville, setVille] = useState("");
  const [prixMax, setPrixMax] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "prix">("date");
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  const loadAnnonces = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    try {
      // Base de la requête avec le tri
      let baseQuery: any = query(
        collection(db, "annonces")
      );

      // Applique les filtres dans un ordre spécifique pour éviter les erreurs d'index
      if (prixMax !== null) {
        baseQuery = query(baseQuery, where("prix", "<=", prixMax));
      }

      if (ville) {
        baseQuery = query(
          baseQuery,
          where("ville", "==", ville) // Changé de >= à == pour éviter les conflits d'index
        );
      }

      // Ajoute le tri à la fin
      baseQuery = query(
        baseQuery,
        orderBy(sortBy === "date" ? "createdAt" : "prix", sortBy === "date" ? "desc" : "asc"),
        limit(5)
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

  const handleEmailSignup = async () => {
    const auth = getAuth();
    const email = prompt("Votre email :");
    const password = prompt("Votre mot de passe :");
    if (!email || !password) return;
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setAuthMessage("Inscription Email réussie !");
    } catch (error: any) {
      setAuthMessage("Erreur Email : " + error.message);
    }
  };

  const handleEmailLogin = async () => {
    const auth = getAuth();
    const email = prompt("Votre email :");
    const password = prompt("Votre mot de passe :");
    if (!email || !password) return;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setAuthMessage("Connexion Email réussie !");
    } catch (error: any) {
      setAuthMessage("Erreur Connexion Email : " + error.message);
    }
  };

  const handleGoogleLogin = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setAuthMessage("Connexion Google réussie !");
    } catch (error: any) {
      setAuthMessage("Erreur Connexion Google : " + error.message);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-center">Annonces de colocation</h1>

      {/* Bouton d'inscription Email uniquement */}
      <div className="flex gap-4 mb-2">
        <button
          className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
          onClick={handleEmailSignup}
        >
          S'inscrire avec Email
        </button>
      </div>
      {/* Boutons de connexion */}
      <div className="flex gap-4 mb-6">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={handleEmailLogin}
        >
          Se connecter avec Email
        </button>
        <button
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          onClick={handleGoogleLogin}
        >
          Se connecter avec Google
        </button>
      </div>
      {authMessage && (
        <div className="mb-4 text-center text-sm text-green-700">{authMessage}</div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setAnnonces([]);
          setLastDoc(null);
          setHasMore(true);
          loadAnnonces();
        }}
        className="mb-6 w-full max-w-3xl flex flex-wrap gap-4 items-end justify-center"
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

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
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
          className="border border-gray-400 text-gray-700 px-4 py-2 rounded hover:bg-gray-100"
        >
          Réinitialiser
        </button>
      </form>

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
