"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
  addDoc,
  serverTimestamp,    
} from "firebase/firestore";
import Image from "next/image";
import AnnonceCard from "@/components/AnnonceCard";

export default function DashboardPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  const [mesAnnonces, setMesAnnonces] = useState<any[]>([]);
  
  const [loadingAnnonces, setLoadingAnnonces] = useState(true);

  const [titre, setTitre] = useState("");
  const [ville, setVille] = useState("");
  const [prix, setPrix] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);


  // 🔐 Redirection si non connecté
  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  // 🔁 Chargement initial + abonnement en temps réel
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "annonces"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    // ✅ Chargement initial rapide
    getDocs(q).then((snapshot) => {
      setMesAnnonces(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoadingAnnonces(false);
    });

    // ✅ Écoute en temps réel pour mises à jour
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMesAnnonces(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  if (!titre || !ville || !prix) {
    setError("Tous les champs obligatoires doivent être remplis.");
    return;
  }

  const data = {
    titre,
    ville,
    prix: Number(prix),
    imageUrl,
    createdAt: serverTimestamp(),
    userId: user!.uid,
    userEmail: user!.email,
  };

  try {
    if (editId) {
      // 🛠️ Mise à jour de l’annonce existante
      const docRef = doc(db, "annonces", editId);
      await updateDoc(docRef, data);
      setEditId(null); // 🔁 repasser en mode "création"
    } else {
      // ➕ Création d’une nouvelle annonce
      await addDoc(collection(db, "annonces"), data);
    }

    // ✅ Réinitialise le formulaire
    setTitre("");
    setVille("");
    setPrix("");
    setImageUrl("");
  } catch (err) {
    console.error("Erreur Firestore :", err);
    setError("Une erreur est survenue.");
  }
  };


  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">
        Bienvenue {user?.displayName || user?.email}
      </h1>

      {user?.photoURL && (
        <Image
          src={user.photoURL}
          alt="Avatar"
          width={100}
          height={100}
          className="rounded-full mb-6"
        />
      )}

      {/* Formulaire */}
      {editId && (
        <p className="text-yellow-700 bg-yellow-100 px-4 py-2 rounded mb-4">
          ✏️ Modification d'une annonce en cours
        </p>
      )}

      <div className="bg-white p-6 rounded-lg shadow w-full max-w-xl mb-10">
        <h2 className="text-xl font-semibold mb-4">Créer une nouvelle annonce</h2>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Titre"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="Ville"
            value={ville}
            onChange={(e) => setVille(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="number"
            placeholder="Prix (€)"
            value={prix}
            onChange={(e) => setPrix(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="text"
            placeholder="URL de l’image"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Publier
          </button>
        </form>
      </div>

      {/* Annonces utilisateur */}
      <div className="w-full max-w-2xl">
        <h2 className="text-2xl font-semibold mb-4">Mes annonces</h2>
        {deleteSuccess && (
          <p className="text-green-600 mb-4">Annonce supprimée avec succès ✅</p>
        )}
        {loadingAnnonces ? (
          <p className="text-gray-500">Chargement de vos annonces...</p>
        ) : mesAnnonces.length === 0 ? (
          <p className="text-gray-500">Aucune annonce pour le moment.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {mesAnnonces.map((annonce) => (
              <AnnonceCard
                key={annonce.id}
                {...annonce}
                onDelete={async () => {
                  if (confirm("Supprimer cette annonce ?")) {
                    await deleteDoc(doc(db, "annonces", annonce.id));
                    setDeleteSuccess(true);
                    setTimeout(() => setDeleteSuccess(false), 3000);
                  }
              }}
              onEdit={() => {
                setTitre(annonce.titre);
                setVille(annonce.ville);
                setPrix(annonce.prix.toString());
                setImageUrl(annonce.imageUrl || "");
                setEditId(annonce.id);
              }}
/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
