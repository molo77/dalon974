"use client";

import { useState, useEffect } from "react";
import { translateFirebaseError } from "@/lib/firebaseErrors";
import { listUsers, updateUserDoc, deleteUserDoc, createUserDoc, normalizeUsers, sendResetTo } from "@/lib/services/userService";

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
  const [normalizing, setNormalizing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const data = await listUsers();
    setUsers(data as any[]);
    setLoading(false);
  };

  const handleUserSave = async (userId: string) => {
    const edited = editedUsers[userId];
    if (!edited) return;
    try {
      await updateUserDoc(userId, {
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
    } catch (e: any) {
      console.error("[AdminUsers][Save]", e);
      showToast("error", translateFirebaseError(e?.code) || "Erreur lors de la modification.");
    }
  };

  const handleDeleteUser = async (id: string) => {
    setConfirmModal(id);
  };

  const confirmDelete = async () => {
    if (!confirmModal) return;
    try {
      await deleteUserDoc(confirmModal);
      setUsers((prev) => prev.filter((u) => u.id !== confirmModal));
      showToast("success", "Utilisateur supprimé avec succès !");
    } catch (e: any) {
      console.error("[AdminUsers][Delete]", e);
      showToast("error", translateFirebaseError(e?.code) || "Erreur lors de la suppression.");
    }
    setConfirmModal(null);
  };

  const handleAdminResetPassword = async (email: string) => {
    if (!email) {
      showToast("error", "Email manquant pour la réinitialisation.");
      return;
    }
    try {
      await sendResetTo(email);
      showToast("success", `Un email de réinitialisation a été envoyé à ${email}`);
    } catch (e: any) {
      console.error("[AdminUsers][ResetPassword]", e);
      showToast("error", translateFirebaseError(e?.code) || "Erreur lors de la réinitialisation.");
    }
  };

  const normalizeExistingUsers = async () => {
    setNormalizing(true);
    try {
      const count = await normalizeUsers();
      if (count) showToast("success", `${count} utilisateur(s) mis à jour.`);
      else showToast("success", "Aucune mise à jour nécessaire.");
      fetchUsers();
    } catch (e:any) {
      console.error("[AdminUsers][Normalize]", e);
      showToast("error", translateFirebaseError(e?.code) || "Erreur normalisation.");
    } finally {
      setNormalizing(false);
    }
  };

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-6 text-blue-700 flex items-center gap-2">👤 Utilisateurs</h2>
      <div className="mb-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
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
              await createUserDoc({
                email: newUser.email,
                displayName: newUser.displayName,
                role: newUser.role,
              });
              showToast("success", `Utilisateur "${newUser.displayName || newUser.email}" créé !`);
              setNewUser({ email: "", displayName: "", role: "" });
              fetchUsers();
            } catch (e: any) {
              console.error("[AdminUsers][Create]", e);
              showToast("error", translateFirebaseError(e?.code) || "Erreur lors de la création.");
            }
          }}
          className="flex flex-col md:flex-row gap-3 w-full"
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
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Créer
          </button>
        </form>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={normalizeExistingUsers}
          disabled={normalizing}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-60"
        >
          {normalizing ? "Normalisation..." : "Compléter champs manquants"}
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <span className="text-lg text-slate-500">Chargement...</span>
          </div>
        ) : users.length === 0 ? (
          <p className="text-slate-500 p-4">Aucun utilisateur.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="py-2 px-3 text-left">Email</th>
                <th className="py-2 px-3 text-left">Nom</th>
                <th className="py-2 px-3 text-left">Rôle</th>
                <th className="py-2 px-3 text-left">Type de compte</th>
                <th className="py-2 px-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="[&>tr:nth-child(even)]:bg-slate-50/50">
              {users.map((u) => {
                const isEdited = !!editedUsers[u.id];
                const edited = editedUsers[u.id] || { email: u.email, displayName: u.displayName || "", role: u.role || "user" };
                // Détection du type de compte
                let typeCompte = "Email";
                if (u.providerId === "google.com" || (u.email && u.email.endsWith("@gmail.com") && !u.passwordHash)) {
                  typeCompte = "Google";
                }
                return (
                  <tr key={u.id} className="hover:bg-blue-50/50 transition">
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
                        className="border rounded-md px-2 py-1 w-48"
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
                        className="border rounded-md px-2 py-1 w-40"
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
                        className="border rounded-md px-2 py-1 w-32"
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeCompte === "Google" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}`}>
                        {typeCompte}
                      </span>
                    </td>
                    <td className="py-2 px-3 flex gap-2">
                      <button
                        className="bg-purple-600 text-white px-3 py-1.5 rounded-md hover:bg-purple-700"
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
                        className="bg-rose-600 text-white px-3 py-1.5 rounded-md hover:bg-rose-700"
                        onClick={() => handleDeleteUser(u.id)}
                      >
                        Supprimer
                      </button>
                      <button
                        className="bg-amber-400 text-white px-3 py-1.5 rounded-md hover:bg-amber-500"
                        title="Réinitialiser le mot de passe"
                        onClick={() => handleAdminResetPassword(u.email)}
                        type="button"
                      >
                        Réinit.
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


