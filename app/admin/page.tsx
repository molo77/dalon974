"use client";

import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function AdminPage() {
  const [user, loading] = useAuthState(auth);
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [editAnnonceId, setEditAnnonceId] = useState<string | null>(null);
  const [editAnnonceData, setEditAnnonceData] = useState<any>({});
  const [adminDebug, setAdminDebug] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState<{
    type: "annonce" | "user" | null;
    id: string | null;
  }>({ type: null, id: null });
  const [activeTab, setActiveTab] = useState<"annonces" | "users">("annonces");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    const checkAdmin = async () => {
      const userDoc = await getDoc(doc(db, "roles", user.uid));
      if (typeof window !== "undefined") {
        console.log("Résultat Firestore roles :", userDoc.exists() ? userDoc.data() : "Aucun document trouvé");
      }
      const data = userDoc.data();
      const role = data?.role;
      if (typeof window !== "undefined") {
        console.log("Variable role (admin) :", role);
      }
      setIsAdmin(role === "admin");
      setCheckingAdmin(false);
    };
    checkAdmin();
  }, [user, loading, router]);

  useEffect(() => {
    if (checkingAdmin) return; // Attendre la fin de la vérification admin
    if (!loading && (!user || !isAdmin)) {
      router.push("/"); // Redirige vers l'accueil si non admin
    }
  }, [user, isAdmin, loading, checkingAdmin, router]);

  useEffect(() => {
    if (!isAdmin || checkingAdmin) return; // Attendre la fin de la vérification admin
    const fetchData = async () => {
      const annoncesSnap = await getDocs(collection(db, "annonces"));
      setAnnonces(annoncesSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      const usersSnap = await getDocs(collection(db, "roles"));
      setUsers(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      setLoadingData(false);
    };
    fetchData();
  }, [isAdmin, checkingAdmin]);

  const handleDeleteAnnonce = async (id: string) => {
    setConfirmModal({ type: "annonce", id });
  };

  const handleEditAnnonce = (annonce: any) => {
    setEditAnnonceId(annonce.id);
    setEditAnnonceData({
      titre: annonce.titre,
      ville: annonce.ville,
      prix: annonce.prix,
      surface: annonce.surface ?? "",
      chambres: annonce.chambres ?? "",
      description: annonce.description ?? "",
    });
  };

  const handleEditAnnonceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditAnnonceData({
      ...editAnnonceData,
      [e.target.name]: e.target.value,
    });
  };

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(null), 3500);
  };

  const confirmDelete = async () => {
    try {
      if (confirmModal.type === "annonce" && confirmModal.id) {
        await deleteDoc(doc(db, "annonces", confirmModal.id));
        setAnnonces((prev) => prev.filter((a) => a.id !== confirmModal.id));
        showToast("success", "Annonce supprimée avec succès !");
      }
      if (confirmModal.type === "user" && confirmModal.id) {
        await deleteDoc(doc(db, "roles", confirmModal.id));
        setUsers((prev) => prev.filter((u) => u.id !== confirmModal.id));
        showToast("success", "Utilisateur supprimé avec succès !");
      }
    } catch (e) {
      showToast("error", "Erreur lors de la suppression.");
    }
    setConfirmModal({ type: null, id: null });
  };

  const handleSaveAnnonce = async (id: string) => {
    try {
      await updateDoc(doc(db, "annonces", id), {
        titre: editAnnonceData.titre,
        ville: editAnnonceData.ville,
        prix: editAnnonceData.prix,
        surface: editAnnonceData.surface,
        chambres: editAnnonceData.chambres,
        description: editAnnonceData.description,
      });
      setAnnonces((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, ...editAnnonceData }
            : a
        )
      );
      showToast("success", "Annonce modifiée avec succès !");
    } catch (e) {
      showToast("error", "Erreur lors de la modification.");
    }
    setEditAnnonceId(null);
    setEditAnnonceData({});
  };

  const handleCancelEdit = () => {
    setEditAnnonceId(null);
    setEditAnnonceData({});
  };

  const handleDeleteUser = async (id: string) => {
    setConfirmModal({ type: "user", id });
  };

  const cancelDelete = () => {
    setConfirmModal({ type: null, id: null });
  };

  if (loading || checkingAdmin) {
    return (
      <main className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <p className="text-xl">Chargement...</p>
      </main>
    );
  }

  if (!isAdmin) {
    return null; // Ou un message d'accès refusé
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-0 flex">
      {/* Menu latéral gauche */}
      <aside className="w-64 min-h-screen bg-white shadow-lg flex flex-col gap-2 py-8 px-4 border-r border-gray-200">
        <h2 className="text-xl font-bold text-blue-700 mb-8 text-center tracking-wide">Admin Panel</h2>
        <button
          className={`text-left px-4 py-3 rounded-lg transition-all duration-150 ${
            activeTab === "annonces"
              ? "bg-blue-600 text-white font-bold shadow"
              : "hover:bg-blue-50 text-gray-700"
          }`}
          onClick={() => setActiveTab("annonces")}
        >
          📢 Gestion des annonces
        </button>
        <button
          className={`text-left px-4 py-3 rounded-lg transition-all duration-150 ${
            activeTab === "users"
              ? "bg-blue-600 text-white font-bold shadow"
              : "hover:bg-blue-50 text-gray-700"
          }`}
          onClick={() => setActiveTab("users")}
        >
          👤 Gestion des utilisateurs
        </button>
      </aside>

      <section className="flex-1 px-0 md:px-12 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-extrabold text-blue-800 tracking-tight">
            Administration
            {adminDebug?.role && (
              <span className="ml-4 text-lg font-normal text-gray-600 align-middle">
                (Rôle : {adminDebug.role})
              </span>
            )}
          </h1>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-8">
          {loadingData ? (
            <div className="flex items-center justify-center h-40">
              <span className="text-lg text-gray-500">Chargement...</span>
            </div>
          ) : (
            <>
              {/* Gestion des annonces */}
              {activeTab === "annonces" && (
                <section className="mb-12">
                  <h2 className="text-2xl font-semibold mb-6 text-blue-700 flex items-center gap-2">
                    📢 Annonces
                  </h2>
                  <div className="overflow-x-auto">
                    {annonces.length === 0 ? (
                      <p className="text-gray-500">Aucune annonce.</p>
                    ) : (
                      <table className="w-full text-sm border-separate border-spacing-y-2">
                        <thead>
                          <tr className="bg-blue-50">
                            <th className="py-2 px-3 rounded-l-lg">Titre</th>
                            <th className="py-2 px-3">Ville</th>
                            <th className="py-2 px-3">Prix</th>
                            <th className="py-2 px-3">Surface</th>
                            <th className="py-2 px-3">Chambres</th>
                            <th className="py-2 px-3">Description</th>
                            <th className="py-2 px-3">Date création</th>
                            <th className="py-2 px-3 rounded-r-lg">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {annonces.map((a) => (
                            <tr key={a.id} className="bg-gray-50 hover:bg-blue-50 transition">
                              {editAnnonceId === a.id ? (
                                <>
                                  <td className="py-2 px-3">
                                    <input
                                      name="titre"
                                      value={editAnnonceData.titre}
                                      onChange={handleEditAnnonceChange}
                                      className="border rounded px-2 py-1 w-full"
                                    />
                                  </td>
                                  <td className="py-2 px-3">
                                    <input
                                      name="ville"
                                      value={editAnnonceData.ville}
                                      onChange={handleEditAnnonceChange}
                                      className="border rounded px-2 py-1 w-full"
                                    />
                                  </td>
                                  <td className="py-2 px-3">
                                    <input
                                      name="prix"
                                      value={editAnnonceData.prix}
                                      onChange={handleEditAnnonceChange}
                                      className="border rounded px-2 py-1 w-full"
                                      type="number"
                                    />
                                  </td>
                                  <td className="py-2 px-3">
                                    <input
                                      name="surface"
                                      value={editAnnonceData.surface ?? ""}
                                      onChange={handleEditAnnonceChange}
                                      className="border rounded px-2 py-1 w-full"
                                      type="number"
                                    />
                                  </td>
                                  <td className="py-2 px-3">
                                    <input
                                      name="chambres"
                                      value={editAnnonceData.chambres ?? ""}
                                      onChange={handleEditAnnonceChange}
                                      className="border rounded px-2 py-1 w-full"
                                      type="number"
                                    />
                                  </td>
                                  <td className="py-2 px-3">
                                    <input
                                      name="description"
                                      value={editAnnonceData.description ?? ""}
                                      onChange={handleEditAnnonceChange}
                                      className="border rounded px-2 py-1 w-full"
                                    />
                                  </td>
                                  <td className="py-2 px-3">
                                    {/* Date non modifiable */}
                                    {a.createdAt
                                      ? new Date(a.createdAt.seconds ? a.createdAt.seconds * 1000 : a.createdAt).toLocaleString()
                                      : "-"}
                                  </td>
                                  <td className="py-2 px-3 flex gap-2">
                                    <button
                                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                      onClick={() => handleSaveAnnonce(a.id)}
                                    >
                                      Enregistrer
                                    </button>
                                    <button
                                      className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400"
                                      onClick={handleCancelEdit}
                                    >
                                      Annuler
                                    </button>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="py-2 px-3">{a.titre}</td>
                                  <td className="py-2 px-3">{a.ville}</td>
                                  <td className="py-2 px-3">{a.prix}</td>
                                  <td className="py-2 px-3">{a.surface ?? "-"}</td>
                                  <td className="py-2 px-3">{a.chambres ?? "-"}</td>
                                  <td className="py-2 px-3">{a.description ?? "-"}</td>
                                  <td className="py-2 px-3">
                                    {a.createdAt
                                      ? new Date(a.createdAt.seconds ? a.createdAt.seconds * 1000 : a.createdAt).toLocaleString()
                                      : "-"}
                                  </td>
                                  <td className="py-2 px-3 flex gap-2">
                                    <button
                                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                      onClick={() => handleEditAnnonce(a)}
                                    >
                                      Modifier
                                    </button>
                                    <button
                                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                      onClick={() => handleDeleteAnnonce(a.id)}
                                    >
                                      Supprimer
                                    </button>
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </section>
              )}

              {/* Gestion des utilisateurs */}
              {activeTab === "users" && (
                <section>
                  <h2 className="text-2xl font-semibold mb-6 text-blue-700 flex items-center gap-2">
                    👤 Utilisateurs
                  </h2>
                  <div className="overflow-x-auto">
                    {users.length === 0 ? (
                      <p className="text-gray-500">Aucun utilisateur.</p>
                    ) : (
                      <table className="w-full text-sm border-separate border-spacing-y-2">
                        <thead>
                          <tr className="bg-blue-50">
                            <th className="py-2 px-3 rounded-l-lg">Email</th>
                            <th className="py-2 px-3">Nom</th>
                            <th className="py-2 px-3 rounded-r-lg">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((u) => (
                            <tr key={u.id} className="bg-gray-50 hover:bg-blue-50 transition">
                              <td className="py-2 px-3">{u.email}</td>
                              <td className="py-2 px-3">{u.displayName || "-"}</td>
                              <td className="py-2 px-3">
                                <button
                                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                  onClick={() => handleDeleteUser(u.id)}
                                >
                                  Supprimer
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </section>
              )}

              {/* Modal de confirmation */}
              {confirmModal.type && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                  <div className="bg-white rounded shadow p-6 w-full max-w-xs flex flex-col items-center">
                    <p className="mb-4 text-center">
                      Êtes-vous sûr de vouloir supprimer&nbsp;
                      {confirmModal.type === "annonce"
                        ? <>
                            cette annonce
                            {confirmModal.id && (
                              <>
                                <br />
                                <span className="font-semibold text-red-700">
                                  « {annonces.find(a => a.id === confirmModal.id)?.titre ?? ""} »
                                </span>
                              </>
                            )}
                            ?
                          </>
                        : <>
                            cet utilisateur
                            {confirmModal.id && (
                              <>
                                <br />
                                <span className="font-semibold text-red-700">
                                  « {users.find(u => u.id === confirmModal.id)?.displayName || users.find(u => u.id === confirmModal.id)?.email || ""} »
                                </span>
                              </>
                            )}
                            ?
                          </>
                      }
                    </p>
                    <div className="flex gap-4">
                      <button
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                        onClick={confirmDelete}
                      >
                        Supprimer
                      </button>
                      <button
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
                        onClick={cancelDelete}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <footer className="mt-12 text-center text-sm text-gray-500">
                Pour accéder à l'interface d'administration, ouvrez votre navigateur et allez à l'URL suivante :
                <br />
                <code className="bg-gray-200 rounded p-1">
                  http://localhost:3000/admin
                </code>
                <br />
                (ou /admin si votre site est en production)
              </footer>
            </>
          )}
        </div>
        {/* Toast notification en bas à droite */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-6 py-3 rounded shadow-lg text-white transition-all
              ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}
            style={{ minWidth: 220 }}
          >
            {toast.message}
          </div>
        )}
      </section>
    </main>
  );
}

