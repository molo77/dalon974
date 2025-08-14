"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
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
  const [activeTab, setActiveTab] = useState<"annonces" | "messages">("annonces");

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
    // Cas spécifique: index requis (en cours de build)
    if (code === "failed-precondition" && String(err?.message || "").toLowerCase().includes("index")) {
      showToast("info", "Index Firestore en cours de création. Le tri peut être temporairement indisponible. Réessayez dans quelques minutes.");
      return;
    }
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

    // Premier chargement: activer le spinner principal
    const isInitial = !lastDoc && mesAnnonces.length === 0;
    if (isInitial) setLoadingAnnonces(true);

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
    } finally {
      setLoadingMore(false);
      if (isInitial) setLoadingAnnonces(false);
    }
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
      } catch (err: any) {
        // Fallback si l’index composite (annonceOwnerId + createdAt) n’est pas encore prêt
        if (err?.code === "failed-precondition" && String(err?.message || "").toLowerCase().includes("index")) {
          try {
            const q = query(
              collection(db, "messages"),
              where("annonceOwnerId", "==", user.uid)
            );
            const snap = await getDocs(q);
            const unsorted = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Tri côté client par createdAt desc
            unsorted.sort((a: any, b: any) => (b?.createdAt?.seconds || 0) - (a?.createdAt?.seconds || 0));
            setMessages(unsorted);
            showToast("info", "Index messages en cours de création. Tri appliqué côté client.");
          } catch (fallbackErr: any) {
            handleFirestoreError(fallbackErr, "messages-fallback");
          }
        } else {
          handleFirestoreError(err, "messages");
        }
      }
    })();
  }, [user, firestoreError, userDocLoaded]);

  // Avatar par défaut (SVG embarqué)
  const defaultAvatarSvg =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'>
        <rect fill='#e5e7eb' width='100' height='100'/>
        <circle cx='50' cy='38' r='18' fill='#9ca3af'/>
        <rect x='20' y='60' width='60' height='28' fill='#9ca3af' rx='14'/>
      </svg>`
    );

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

  return (
    <div className="min-h-screen p-2 sm:p-6 flex flex-col items-center">
      {/* {firestoreError && (
        <div className="w-full max-w-3xl mb-4 px-4 py-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
          {firestoreError}
        </div>
      )} */}
      <div className="w-full max-w-3xl flex flex-col items-center mb-6">
        <div className="flex items-center justify-center gap-4 w-full">
          <Image
            src={user?.photoURL || defaultAvatarSvg}
            alt="Avatar"
            width={100}
            height={100}
            className="rounded-full bg-gray-300"
          />
          <h1 className="text-3xl font-bold text-center">
            Bienvenue {user?.displayName || user?.email}
          </h1>
        </div>
      </div>

      {/* Onglets */}
      <div className="w-full max-w-3xl flex gap-2 mb-6">
        <button
          className={`flex-1 px-4 py-2 rounded-t-lg font-semibold transition ${
            activeTab === "annonces"
              ? "bg-blue-600 text-white shadow"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
          onClick={() => setActiveTab("annonces")}
        >
          Mes annonces
        </button>
        <button
          className={`flex-1 px-4 py-2 rounded-t-lg font-semibold transition ${
            activeTab === "messages"
              ? "bg-blue-600 text-white shadow"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
          onClick={() => setActiveTab("messages")}
        >
          Messages reçus
        </button>
      </div>

      {/* Contenu des onglets */}
      <div className="w-full max-w-3xl bg-white rounded-b-xl shadow p-6">
        {activeTab === "annonces" && (
          <>
            <button
              onClick={() => {
                setEditAnnonce(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mb-6 shadow-sm"
            >
              <span>➕</span> Nouvelle annonce
            </button>
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
                      imageUrl={annonce.imageUrl || defaultAnnonceImg}
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
          </>
        )}

        {activeTab === "messages" && (
          <>
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
          </>
        )}
      </div>

      <Toast
        toasts={toasts}
        onRemove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
}

