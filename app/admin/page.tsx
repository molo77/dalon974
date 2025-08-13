"use client";

import { useEffect, useState } from "react";
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
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    const checkAdmin = async () => {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const data = userDoc.data();
      const role = data?.role?.role || data?.role;
      const debugInfo = { email: user.email, data, role };
      setAdminDebug(debugInfo); // <-- debug info
      // Affiche le debug dans la console au lieu de l'UI
      console.debug("Admin debug info:", debugInfo);
      if (role === "admin") {
        setIsAdmin(true);
        console.debug("[DEBUG] Statut admin : utilisateur est ADMIN");
      } else {
        setIsAdmin(false);
        console.debug("[DEBUG] Statut admin : utilisateur NON ADMIN");
        router.push("/"); // Redirige si pas admin
      }
      setCheckingAdmin(false);
    };
    checkAdmin();
  }, [user, loading, router]);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchData = async () => {
      const annoncesSnap = await getDocs(collection(db, "annonces"));
      setAnnonces(annoncesSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      const usersSnap = await getDocs(collection(db, "users"));
      setUsers(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      setLoadingData(false);
    };
    fetchData();
  }, [isAdmin]);

  const handleDeleteAnnonce = async (id: string) => {
    await deleteDoc(doc(db, "annonces", id));
    setAnnonces((prev) => prev.filter((a) => a.id !== id));
  };

  const handleEditAnnonce = (annonce: any) => {
    setEditAnnonceId(annonce.id);
    setEditAnnonceData({
      titre: annonce.titre,
      ville: annonce.ville,
      prix: annonce.prix,
    });
  };

  const handleEditAnnonceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditAnnonceData({
      ...editAnnonceData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveAnnonce = async (id: string) => {
    await updateDoc(doc(db, "annonces", id), {
      titre: editAnnonceData.titre,
      ville: editAnnonceData.ville,
      prix: editAnnonceData.prix,
    });
    setAnnonces((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, ...editAnnonceData }
          : a
      )
    );
    setEditAnnonceId(null);
    setEditAnnonceData({});
  };

  const handleCancelEdit = () => {
    setEditAnnonceId(null);
    setEditAnnonceData({});
  };

  const handleDeleteUser = async (id: string) => {
    await deleteDoc(doc(db, "users", id));
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  if (loading || checkingAdmin) {
    return (
      <main className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <p className="text-xl">Chargement...</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <p className="text-xl text-red-600">Accès refusé.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8">
        Administration
        {adminDebug?.role && (
          <span className="ml-4 text-base font-normal text-gray-600 align-middle">
            (Rôle : {adminDebug.role})
          </span>
        )}
      </h1>
      {loadingData ? (
        <p>Chargement...</p>
      ) : (
        <>
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Annonces</h2>
            <div className="bg-white rounded shadow p-4">
              {annonces.length === 0 ? (
                <p>Aucune annonce.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th>Titre</th>
                      <th>Ville</th>
                      <th>Prix</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {annonces.map((a) => (
                      <tr key={a.id}>
                        {editAnnonceId === a.id ? (
                          <>
                            <td>
                              <input
                                name="titre"
                                value={editAnnonceData.titre}
                                onChange={handleEditAnnonceChange}
                                className="border px-1"
                              />
                            </td>
                            <td>
                              <input
                                name="ville"
                                value={editAnnonceData.ville}
                                onChange={handleEditAnnonceChange}
                                className="border px-1"
                              />
                            </td>
                            <td>
                              <input
                                name="prix"
                                value={editAnnonceData.prix}
                                onChange={handleEditAnnonceChange}
                                className="border px-1"
                                type="number"
                              />
                            </td>
                            <td>
                              <button
                                className="text-green-600 hover:underline mr-2"
                                onClick={() => handleSaveAnnonce(a.id)}
                              >
                                Enregistrer
                              </button>
                              <button
                                className="text-gray-600 hover:underline"
                                onClick={handleCancelEdit}
                              >
                                Annuler
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{a.titre}</td>
                            <td>{a.ville}</td>
                            <td>{a.prix}</td>
                            <td>
                              <button
                                className="text-blue-600 hover:underline mr-2"
                                onClick={() => handleEditAnnonce(a)}
                              >
                                Modifier
                              </button>
                              <button
                                className="text-red-600 hover:underline"
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
          <section>
            <h2 className="text-2xl font-semibold mb-4">Utilisateurs</h2>
            <div className="bg-white rounded shadow p-4">
              {users.length === 0 ? (
                <p>Aucun utilisateur.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Nom</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.email}</td>
                        <td>{u.displayName || "-"}</td>
                        <td>
                          {/* Ajoute ici la gestion de modification utilisateur si besoin */}
                          <button
                            className="text-red-600 hover:underline"
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
    </main>
  );
}
