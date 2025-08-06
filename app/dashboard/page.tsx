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
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import Image from "next/image";
import AnnonceCard from "@/components/AnnonceCard";
import AnnonceModal from "@/components/AnnonceModal";

export default function DashboardPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  const [mesAnnonces, setMesAnnonces] = useState<any[]>([]);
  const [loadingAnnonces, setLoadingAnnonces] = useState(true);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editAnnonce, setEditAnnonce] = useState<any | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "annonces"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    getDocs(q).then((snapshot) => {
      setMesAnnonces(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoadingAnnonces(false);
    });

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMesAnnonces(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">
        Bienvenue {user?.displayName || user?.email}
      </h1>

      {successMessage && (
        <div className="bg-green-100 text-green-800 px-4 py-2 rounded shadow mb-4">
          {successMessage}
        </div>
      )}

      {user?.photoURL && (
        <Image
          src={user.photoURL}
          alt="Avatar"
          width={100}
          height={100}
          className="rounded-full mb-6"
        />
      )}

      <button
        onClick={() => {
          setEditAnnonce(null); // création
          setModalOpen(true);
        }}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-6"
      >
        ➕ Nouvelle annonce
      </button>

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
                  setEditAnnonce(annonce);
                  setModalOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <AnnonceModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditAnnonce(null);
        }}
        annonce={editAnnonce}
        onSubmit={async ({ titre, ville, prix, imageUrl }) => {
          try {
            if (editAnnonce) {
              const docRef = doc(db, "annonces", editAnnonce.id);
              await updateDoc(docRef, {
                titre,
                ville,
                prix: Number(prix),
                imageUrl,
              });
              setSuccessMessage("Annonce modifiée avec succès ✅");
            } else {
              await addDoc(collection(db, "annonces"), {
                titre,
                ville,
                prix: Number(prix),
                imageUrl,
                createdAt: serverTimestamp(),
                userId: user!.uid,
                userEmail: user!.email,
              });
              setSuccessMessage("Annonce créée avec succès ✅");
            }

            setTimeout(() => setSuccessMessage(null), 3000);
          } catch (err) {
            console.error("Erreur Firestore :", err);
            alert("Une erreur est survenue.");
          }
        }}
      />
    </div>
  );
}
