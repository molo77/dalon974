"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import Image from "next/image";
import AnnonceCard from "@/components/AnnonceCard";

export default function DashboardPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  const [titre, setTitre] = useState("");
  const [ville, setVille] = useState("");
  const [prix, setPrix] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");

  const [mesAnnonces, setMesAnnonces] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "annonces"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMesAnnonces(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) return <p className="p-6">Chargement...</p>;

  if (!user) {
    router.push("/login");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!titre || !ville || !prix) {
      setError("Tous les champs obligatoires doivent être remplis.");
      return;
    }

    try {
      await addDoc(collection(db, "annonces"), {
        titre,
        ville,
        prix: Number(prix),
        imageUrl,
        createdAt: serverTimestamp(),
        userId: user.uid,
        userEmail: user.email,
      });

      setTitre("");
      setVille("");
      setPrix("");
      setImageUrl("");
    } catch (err) {
      console.error("Erreur Firestore :", err);
      setError("Une erreur est survenue lors de la publication.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">Bienvenue {user.displayName || user.email}</h1>

      {user.photoURL && (
        <Image
          src={user.photoURL}
          alt="Avatar"
          width={100}
          height={100}
          className="rounded-full mb-6"
        />
      )}

      {/* Formulaire de publication */}
      <div className="bg-white p-6 rounded-lg shadow w-full max-w-xl mb-10">
        <h2 className="text-xl font-semibold mb-4">Créer une nouvelle annonce</h2>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium">Titre *</label>
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block font-medium">Ville *</label>
            <input
              type="text"
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block font-medium">Prix (€) *</label>
            <input
              type="number"
              value={prix}
              onChange={(e) => setPrix(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block font-medium">Image URL</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Publier
          </button>
        </form>
      </div>

      {/* Liste des annonces de l'utilisateur */}
      <div className="w-full max-w-2xl">
        <h2 className="text-2xl font-semibold mb-4">Mes annonces</h2>
        {mesAnnonces.length === 0 ? (
          <p className="text-gray-500">Aucune annonce pour le moment.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {mesAnnonces.map((annonce) => (
              <AnnonceCard key={annonce.id} {...annonce} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
