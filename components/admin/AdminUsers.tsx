"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

export default function AdminUsers({
  showToast,
}: {
  showToast: (type: "success" | "error", message: string) => void;
}) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editedUsers, setEditedUsers] = useState<{ [userId: string]: { email: string; displayName: string; role: string } }>({});
  const [newUser, setNewUser] = useState({ email: "", displayName: "", role: "" });
  const [confirmModal, setConfirmModal] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const usersSnap = await getDocs(collection(db, "users"));
    setUsers(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  const handleUserSave = async (userId: string) => {
    const edited = editedUsers[userId];
    if (!edited) return;
    try {
      await updateDoc(doc(db, "users", userId), {
        email: edited.email,
        displayName: edited.displayName,
        role: edited.role,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, ...edited } : u
        )
      );
      showToast("success", "Utilisateur modifié !");
    } catch (e) {
      showToast("error", "Erreur lors de la modification de l'utilisateur.");
    }
  };

  const handleDeleteUser = async (id: string) => {
    setConfirmModal(id);
  };

  const confirmDelete = async () => {
    if (!confirmModal) return;
    try {
      await deleteDoc(doc(db, "users", confirmModal));
      setUsers((prev) => prev.filter((u) => u.id !== confirmModal));
      showToast("success", "Utilisateur supprimé avec succès !");
    } catch (e) {
      showToast("error", "Erreur lors de la suppression.");
    }
    setConfirmModal(null);
  };

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-6 text-blue-700 flex items-center gap-2">
        👤 Utilisateurs
      </h2>
      {/* Formulaire création utilisateur (admin) */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-end bg-blue-50 rounded p-4">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            // Vérification des doublons email et nom
            const emailExists = users.some(
              (u) => u.email?.toLowerCase() === newUser.email.trim().toLowerCase()
            );
            const nameExists =
              newUser.displayName &&
              users.some(
                (u) =>
                  (u.displayName || "").trim().toLowerCase() ===
                  newUser.displayName.trim().toLowerCase()
              );
            if (emailExists) {
              showToast("error", "Cet email existe déjà.");
              return;
            }
            if (newUser.displayName && nameExists) {
              showToast("error", "Ce nom existe déjà.");
              return;
            }
            try {
              await addDoc(collection(db, "users"), {
                email: newUser.email,
                displayName: newUser.displayName,
                role: newUser.role,
              });
              showToast("success", `Utilisateur "${newUser.displayName || newUser.email}" créé !`);
              setNewUser({ email: "", displayName: "", role: "" });
              fetchUsers();
            } catch {
              showToast("error", "Erreur lors de la création de l'utilisateur.");
            }
          }}
          className="flex flex-col md:flex-row gap-2 w-full"
        >
          <input
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
            className="border rounded px-3 py-2 flex-1"
            required
          />
          <input
            type="text"
            placeholder="Nom"
            value={newUser.displayName}
            onChange={e => setNewUser({ ...newUser, displayName: e.target.value })}
            className="border rounded px-3 py-2 flex-1"
          />
          <select
            value={newUser.role}
            onChange={e => setNewUser({ ...newUser, role: e.target.value })}
            className="border rounded px-3 py-2 flex-1"
            required
          >
            <option value="">Sélectionner un rôle</option>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
          <button
            type="submit"
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Créer
          </button>
        </form>
      </div>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <span className="text-lg text-gray-500">Chargement...</span>
          </div>
        ) : users.length === 0 ? (
          <p className="text-gray-500">Aucun utilisateur.</p>
        ) : (
          <table className="w-full text-sm border-separate border-spacing-y-2">
            <thead>
              <tr className="bg-blue-50">
                <th className="py-2 px-3 rounded-l-lg">Email</th>
                <th className="py-2 px-3">Nom</th>
                <th className="py-2 px-3">Rôle</th>
                <th className="py-2 px-3 rounded-r-lg">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isEdited = !!editedUsers[u.id];
                const edited = editedUsers[u.id] || { email: u.email, displayName: u.displayName || "", role: u.role || "user" };
                return (
                  <tr key={u.id} className="bg-gray-50 hover:bg-blue-50 transition">
                    <td className="py-2 px-3">
                      <input
                        type="email"
                        value={edited.email}
                        onChange={e =>
                          setEditedUsers((prev) => ({
                            ...prev,
                            [u.id]: { ...edited, email: e.target.value },
                          }))
                        }
                        className="border rounded px-2 py-1 w-44"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={edited.displayName}
                        onChange={e =>
                          setEditedUsers((prev) => ({
                            ...prev,
                            [u.id]: { ...edited, displayName: e.target.value },
                          }))
                        }
                        className="border rounded px-2 py-1 w-32"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <select
                        value={edited.role}
                        onChange={e =>
                          setEditedUsers((prev) => ({
                            ...prev,
                            [u.id]: { ...edited, role: e.target.value },
                          }))
                        }
                        className="border rounded px-2 py-1 w-32"
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="py-2 px-3 flex gap-2">
                      <button
                        className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                        onClick={() => handleUserSave(u.id)}
                        disabled={
                          !isEdited ||
                          (
                            edited.email === u.email &&
                            (edited.displayName || "") === (u.displayName || "") &&
                            edited.role === u.role
                          )
                        }
                      >
                        Enregistrer
                      </button>
                      <button
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                        onClick={() => handleDeleteUser(u.id)}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {/* Modal de confirmation suppression */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow p-6 w-full max-w-xs flex flex-col items-center">
            <p className="mb-4 text-center">
              Êtes-vous sûr de vouloir supprimer&nbsp;
              <br />
              <span className="font-semibold text-red-700">
                « {users.find(u => u.id === confirmModal)?.displayName || users.find(u => u.id === confirmModal)?.email || ""} »
              </span>
              ?
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
                onClick={() => setConfirmModal(null)}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
