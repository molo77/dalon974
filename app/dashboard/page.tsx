"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
// import { collection, getDocs, onSnapshot, query, where, orderBy, doc, deleteDoc, addDoc, updateDoc, serverTimestamp, limit, startAfter, getDoc } from "firebase/firestore";
import Image from "next/image";
import AnnonceCard from "@/components/AnnonceCard";
import AnnonceModal from "@/components/AnnonceModal";
import ConfirmModal from "@/components/ConfirmModal";
import Toast, { ToastMessage } from "@/components/Toast";
import { v4 as uuidv4 } from "uuid";
import MessageModal from "@/components/MessageModal";
import { translateFirebaseError } from "@/lib/firebaseErrors";
import { listUserAnnoncesPage, addAnnonce, updateAnnonce, deleteAnnonce as deleteAnnonceSvc } from "@/lib/services/annonceService";
import { listMessagesForOwner } from "@/lib/services/messageService";
import { getUserRole } from "@/lib/services/userService";

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
  const [messages, setMessages] = useState<any[]>([]);
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userDocLoaded, setUserDocLoaded] = useState(false);

  const loadUserDoc = async (u: any) => {
    try {
      if (!u) return;
      const role = await getUserRole(u.uid);
      setUserRole(role);
    } catch (e) {
      console.warn("[Dashboard][UserDoc] échec :", e);
    } finally {
      setUserDocLoaded(true);
    }
  };

  const handleFirestoreError = (err: any, context: string) => {
    console.error(`[Dashboard][${context}]`, err);
    const code = err?.code;
    if (code === "permission-denied") {
      let msg = "Accès refusé (permission-denied).";
      msg += userRole
        ? ` Rôle Firestore détecté: "${userRole}".`
        : " Aucun rôle Firestore détecté (doc manquant / champ 'role').";
      msg += " Vérifie les règles Firestore: utilisent-elles la lecture du doc users ou un custom claim que tu n'emploies plus ?";
      setFirestoreError(msg);
      showToast("error", msg);
      setHasMore(false);
    } else {
      showToast("error", code ? translateFirebaseError(code) : "Erreur Firestore.");
    }
  };

  const loadAnnonces = async () => {
    if (!user || loadingMore || !hasMore || firestoreError) return;

    setLoadingMore(true);

    try {
      const { items, lastDoc: newLast } = await listUserAnnoncesPage(user.uid, { lastDoc, pageSize: 10 });

      if (items.length) {
        setLastDoc(newLast);
        setMesAnnonces(prev => {
          const ids = new Set(prev.map(a => a.id));
          return [...prev, ...items.filter(i => !ids.has(i.id))];
        });
      } else {
        setHasMore(false);
      }
    } catch (err:any) {
      handleFirestoreError(err, "loadAnnonces");
    }

    setLoadingMore(false);
  };

  useEffect(() => {
    if (user) loadUserDoc(user);
  }, [user]);

  useEffect(() => {
    if (loading || firestoreError) return;

    if (!user) {
      router.push("/login");
      return;
    }
    // Attendre d’avoir tenté de charger le doc user pour éviter permission-denied précoce
    if (!userDocLoaded) return;
    loadAnnonces();
  }, [user, loading, lastDoc, firestoreError, userDocLoaded]);

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

  // Charger les messages reçus
  useEffect(() => {
    if (!user || firestoreError || !userDocLoaded) return;
    (async () => {
      try {
        const msgs = await listMessagesForOwner(user.uid);
        setMessages(msgs);
      } catch (err:any) {
        handleFirestoreError(err, "messages");
      }
    })();
  }, [user, firestoreError, userDocLoaded]);

  return (
    <div className="min-h-screen p-2 sm:p-6 flex flex-col items-center">
      {firestoreError && (
        <div className="w-full max-w-3xl mb-4 px-4 py-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
          {firestoreError}
        </div>
      )}
      <div className="w-full max-w-3xl flex flex-col items-center mb-6">
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
        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mb-6 shadow-sm"
      >
        <span>➕</span> Nouvelle annonce
      </button>

      <div className="w-full max-w-3xl">
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
        onSubmit={async ({ titre, ville, prix, imageUrl, surface, description, nbChambres, equipements }) => {
          try {
            const annonceData: any = { titre, ville, prix: prix ? Number(prix) : null, imageUrl, surface: surface ? Number(surface) : null, description: description || "", nbChambres: nbChambres ? Number(nbChambres) : null, equipements: equipements || "" };
            Object.keys(annonceData).forEach(k => (annonceData[k] === null || annonceData[k] === "") && delete annonceData[k]);
            if (editAnnonce) {
              await updateAnnonce(editAnnonce.id, annonceData);
              showToast("success", "Annonce modifiée avec succès ✅");
            } else {
              await addAnnonce({ uid: user!.uid, email: user!.email }, annonceData);
              showToast("success", "Annonce créée avec succès ✅");
            }
          } catch (err: any) {
            console.error("[Dashboard][AnnonceSubmit] Erreur Firestore brute :", err);
            showToast("error", err?.code ? translateFirebaseError(err.code) : "Erreur lors de l'enregistrement ❌");
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
            await deleteAnnonceSvc(selectedAnnonceToDelete.id);
            showToast("success", "Annonce supprimée avec succès ✅");
          } catch (err: any) {
            console.error("[Dashboard][DeleteAnnonce] Erreur brute :", err);
            showToast("error", err?.code ? translateFirebaseError(err.code) : "Erreur lors de la suppression ❌");
          } finally {
            setSelectedAnnonceToDelete(null);
          }
        }}
      />

      {/* Section messagerie */}
      <div className="w-full max-w-3xl mt-10">
        <h2 className="text-2xl font-bold mb-4">Messages reçus</h2>
        {messages.length === 0 ? (
          <p className="text-gray-500">Aucun message reçu.</p>
        ) : (
          <ul className="space-y-4">
            {messages.map((msg) => (
              <li key={msg.id} className="bg-white rounded shadow p-4">
                <div className="mb-2 text-gray-700">
                  <span className="font-semibold">De :</span> {msg.fromEmail}
                </div>
                <div className="mb-2 text-gray-700">
                  <span className="font-semibold">Message :</span> {msg.content}
                </div>
                <div className="mb-2 text-gray-500 text-xs">
                  {msg.createdAt?.seconds
                    ? new Date(msg.createdAt.seconds * 1000).toLocaleString()
                    : ""}
                </div>
                <button
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  onClick={() => setReplyTo(msg)}
                >
                  Répondre
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal pour répondre */}
      {replyTo && (
        <MessageModal
          annonceId={replyTo.annonceId}
          annonceOwnerId={replyTo.fromUserId}
          isOpen={!!replyTo}
          onClose={() => setReplyTo(null)}
          onSent={() => setReplyTo(null)}
        />
      )}

      <Toast
        toasts={toasts}
        onRemove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
}

