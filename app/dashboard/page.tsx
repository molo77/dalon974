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
  limit,
  startAfter,
} from "firebase/firestore";
import Image from "next/image";
import AnnonceCard from "@/components/AnnonceCard";
import AnnonceModal from "@/components/AnnonceModal";
import ConfirmModal from "@/components/ConfirmModal";
import Toast, { ToastMessage } from "@/components/Toast";
import { v4 as uuidv4 } from "uuid";

export default function DashboardPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  const [mesAnnonces, setMesAnnonces] = useState<any[]>([]);
  const [loadingAnnonces, setLoadingAnnonces] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editAnnonce, setEditAnnonce] = useState<any | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedAnnonceToDelete, setSelectedAnnonceToDelete] = useState<any | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const showToast = (type: "success" | "error" | "info", message: string) => {
    const id = uuidv4();
    setToasts((prev) => [...prev, { id, type, message }]);
  };
  const [lastDoc, setLastDoc] = useState<any | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadAnnonces = async () => {
    if (!user || loadingMore || !hasMore) return;

    setLoadingMore(true);

    const baseQuery = query(
      collection(db, "annonces"),
      where("userId", "==", user.uid),
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

    if (docs.length > 0) {
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setMesAnnonces((prev) => {
        const newIds = new Set(prev.map((a) => a.id));
        const uniqueDocs = docs.filter((doc) => !newIds.has(doc.id));
        return [...prev, ...uniqueDocs];
      });

    } else {
      setHasMore(false);
    }

    setLoadingMore(false);
  };

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    loadAnnonces();
  }, [user, loading, lastDoc]);

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
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center justify-center">
      {/* Avatar et Bienvenue centrés dans le div */}
      <div className="w-full max-w-2xl flex flex-col items-center justify-center mb-6">
        <div className="flex items-center justify-center gap-4 w-full">
          {user?.photoURL ? (
            <Image
              src={user.photoURL}
              alt="Avatar"
              width={100}
              height={100}
              className="rounded-full"
            />
          ) : (
            <span className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-3xl">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "?"}
            </span>
          )}
          <h1 className="text-3xl font-bold text-center">
            Bienvenue {user?.displayName || user?.email}
          </h1>
        </div>
      </div>

      <button
        onClick={() => {
          setEditAnnonce(null);
          setModalOpen(true);
        }}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-6"
      >
        ➕ Nouvelle annonce
      </button>
      {/* Liste des annonces élargie à la même taille que le div de Bienvenue */}
      <div className="w-full max-w-2xl flex flex-col items-center">
        <h2 className="text-2xl font-semibold mb-4">Mes annonces</h2>

        {loadingAnnonces ? (
          <p className="text-gray-500">Chargement de vos annonces...</p>
        ) : mesAnnonces.length === 0 ? (
          <p className="text-gray-500">Aucune annonce pour le moment.</p>
        ) : (
          <div className="flex flex-col gap-4 w-full">
            {/* Chaque AnnonceCard prend toute la largeur disponible et est centrée */}
            {mesAnnonces.map((annonce) => (
              <div key={annonce.id} className="w-full">
                <AnnonceCard
                  {...annonce}
                  onDelete={() => {
                    setSelectedAnnonceToDelete(annonce);
                    setConfirmModalOpen(true);
                  }}
                  onEdit={() => {
                    setEditAnnonce(annonce);
                    setModalOpen(true);
                  }}
                />
              </div>
            ))}
            {loadingMore && (
              <p className="text-center text-gray-500 mt-4">Chargement…</p>
            )}
            {!hasMore && (
              <p className="text-center text-gray-400 mt-4">Toutes les annonces sont chargées.</p>
            )}
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
              showToast("success", "Annonce modifiée avec succès ✅");
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
              showToast("success", "Annonce créée avec succès ✅");
            }
          } catch (err) {
            console.error("Erreur Firestore :", err);
            showToast("error", "Erreur lors de l'enregistrement ❌");
          }
        }}
      />

      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={async () => {
          if (!selectedAnnonceToDelete) return;
          showToast("info", "Suppression en cours...");
          try {
            await deleteDoc(doc(db, "annonces", selectedAnnonceToDelete.id));
            showToast("success", "Annonce supprimée avec succès ✅");
          } catch (err) {
            console.error(err);
            showToast("error", "Erreur lors de la suppression ❌");
          } finally {
            setSelectedAnnonceToDelete(null);
          }
        }}
      />

      <Toast
        toasts={toasts}
        onRemove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
}

