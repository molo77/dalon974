"use client";
import { useEffect, useState } from "react";
// Firebase supprimé: on bascule sur fetch côté serveur via services Prisma
import {
  listUsers,
  updateUserDoc,
  deleteUserDoc,
  createUserDoc,
  normalizeUsers,
} from "@/core/business/userService";

export default function AdminUsers({
  showToast,
}: {
  showToast: (type: "success" | "error", message: string) => void;
}) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  type EditedUser = { email: string; displayName: string; role: string; ville?: string; telephone?: string };
  const [editedUsers, setEditedUsers] = useState<{ [userId: string]: EditedUser }>({});
  const [editing, setEditing] = useState<{ [userId: string]: boolean }>({});
  const [newUser, setNewUser] = useState({ email: "", displayName: "", role: "", ville: "", telephone: "" });
  const [confirmModal, setConfirmModal] = useState<string | null>(null);
  const [normalizing, setNormalizing] = useState(false);

  // Chargement initial via API/services
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const data = await listUsers();
    setUsers(data as any[]);
    setLoading(false);
  };

  const startEdit = (u: any) => {
    setEditing((prev) => ({ ...prev, [u.id]: true }));
    setEditedUsers((prev) => ({
      ...prev,
      [u.id]: {
        email: u.email,
        displayName: u.displayName || "",
        role: u.role || "user",
        ville: u.ville || "",
        telephone: u.telephone || "",
      },
    }));
  };
  const cancelEdit = (u: any) => {
    setEditing((prev) => ({ ...prev, [u.id]: false }));
    setEditedUsers((prev) => {
      const { [u.id]: _omit, ...rest } = prev;
      return rest;
    });
  };

  const handleUserSave = async (userId: string) => {
    const edited = editedUsers[userId];
    if (!edited) return;
    try {
      await updateUserDoc(userId, {
        email: edited.email,
        displayName: edited.displayName,
        role: edited.role,
        ...(edited.ville !== undefined ? { ville: edited.ville || "" } : {}),
        ...(edited.telephone !== undefined ? { telephone: edited.telephone || "" } : {}),
      });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...edited } : u)));
      setEditing((prev) => ({ ...prev, [userId]: false }));
      setEditedUsers((prev) => {
        const { [userId]: _omit, ...rest } = prev;
        return rest;
      });
      showToast("success", "Utilisateur modifié !");
    } catch (e: any) {
      console.error("[AdminUsers][Save]", e);
  showToast("error", e?.message || "Erreur lors de la modification.");
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
  showToast("error", e?.message || "Erreur lors de la suppression.");
    }
    setConfirmModal(null);
  };

  // handleAdminResetPassword supprimé (API retirée)

  const normalizeExistingUsers = async () => {
    setNormalizing(true);
    try {
      const count = await normalizeUsers();
      if (count) showToast("success", `${count} utilisateur(s) mis à jour.`);
      else showToast("success", "Aucune mise à jour nécessaire.");
      fetchUsers();
    } catch (e:any) {
      console.error("[AdminUsers][Normalize]", e);
  showToast("error", e?.message || "Erreur normalisation.");
    } finally {
      setNormalizing(false);
    }
  };

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-6 text-blue-700 flex items-center gap-2">👤 Utilisateurs</h2>

      {/* Création */}
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
                ...(newUser.ville ? { ville: newUser.ville } : {}),
                ...(newUser.telephone ? { telephone: newUser.telephone } : {}),
              });
              showToast("success", `Utilisateur "${newUser.displayName || newUser.email}" créé !`);
              setNewUser({ email: "", displayName: "", role: "", ville: "", telephone: "" });
              fetchUsers();
            } catch (e: any) {
              console.error("[AdminUsers][Create]", e);
              showToast("error", e?.message || "Erreur lors de la création.");
            }
          }}
          className="grid grid-cols-1 md:grid-cols-6 gap-3 w-full"
        >
          <input
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
            className="border rounded px-3 py-2 md:col-span-2"
            required
          />
          <input
            type="text"
            placeholder="Nom"
            value={newUser.displayName}
            onChange={e => setNewUser({ ...newUser, displayName: e.target.value })}
            className="border rounded px-3 py-2"
          />
          <select
            value={newUser.role}
            onChange={e => setNewUser({ ...newUser, role: e.target.value })}
            className="border rounded px-3 py-2"
            required
          >
            <option value="">Sélectionner un rôle</option>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
          <input
            type="text"
            placeholder="Ville"
            value={newUser.ville}
            onChange={e => setNewUser({ ...newUser, ville: e.target.value })}
            className="border rounded px-3 py-2"
          />
          <input
            type="tel"
            placeholder="Téléphone"
            value={newUser.telephone}
            onChange={e => setNewUser({ ...newUser, telephone: e.target.value })}
            className="border rounded px-3 py-2"
          />
          <button
            type="submit"
            className="bg-purple-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-purple-700 md:justify-self-end"
          >
            Créer
          </button>
        </form>
      </div>

      {/* Normalisation */}
      <div className="mb-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={normalizeExistingUsers}
          disabled={normalizing}
          className="bg-indigo-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-60"
        >
          {normalizing ? "Normalisation..." : "Compléter champs manquants"}
        </button>
      </div>

      {/* Liste utilisateurs - Vue cartes (mobile) */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <span className="text-slate-500">Chargement...</span>
          </div>
        ) : users.length === 0 ? (
          <p className="text-slate-500">Aucun utilisateur.</p>
        ) : (
          users.map((u) => {
            const original = {
              email: u.email,
              displayName: u.displayName || "",
              role: u.role || "user",
              ville: u.ville || "",
              telephone: u.telephone || "",
            };
            const isEditing = !!editing[u.id];
            const edited = isEditing ? (editedUsers[u.id] || original) : original;
            const isEdited =
              isEditing &&
              (edited.email !== original.email ||
                (edited.displayName || "") !== (original.displayName || "") ||
                edited.role !== (original.role || "user") ||
                (edited.ville || "") !== (original.ville || "") ||
                (edited.telephone || "") !== (original.telephone || ""));
            let typeCompte = "Email";
            if (u.providerId === "google.com" || (u.email && u.email.endsWith("@gmail.com") && !u.passwordHash)) {
              typeCompte = "Google";
            }
            return (
              <div key={u.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-800">{edited.displayName || u.email}</h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeCompte === "Google" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}`}>
                    {typeCompte}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <input
                    type="email"
                    value={edited.email}
                    onChange={e => setEditedUsers(prev => ({ ...prev, [u.id]: { ...(prev[u.id] || edited), email: e.target.value } }))}
                    className="border rounded-md px-3 py-2 w-full"
                    placeholder="Email"
                    disabled={!isEditing}
                  />
                  <input
                    type="text"
                    value={edited.displayName}
                    onChange={e => setEditedUsers(prev => ({ ...prev, [u.id]: { ...(prev[u.id] || edited), displayName: e.target.value } }))}
                    className="border rounded-md px-3 py-2 w-full"
                    placeholder="Nom"
                    disabled={!isEditing}
                  />
                  <select
                    value={edited.role}
                    onChange={e => setEditedUsers(prev => ({ ...prev, [u.id]: { ...(prev[u.id] || edited), role: e.target.value } }))}
                    className="border rounded-md px-3 py-2 w-full"
                    disabled={!isEditing}
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                  <input
                    type="text"
                    value={edited.ville || ""}
                    onChange={e => setEditedUsers(prev => ({ ...prev, [u.id]: { ...(prev[u.id] || edited), ville: e.target.value } }))}
                    className="border rounded-md px-3 py-2 w-full"
                    placeholder="Ville"
                    disabled={!isEditing}
                  />
                  <input
                    type="tel"
                    value={edited.telephone || ""}
                    onChange={e => setEditedUsers(prev => ({ ...prev, [u.id]: { ...(prev[u.id] || edited), telephone: e.target.value } }))}
                    className="border rounded-md px-3 py-2 w-full"
                    placeholder="Téléphone"
                    disabled={!isEditing}
                  />
                </div>
                <div className="flex gap-2 justify-end mt-3">
                  {!isEditing ? (
                    <button
                      type="button"
                      title="Modifier"
                      aria-label="Modifier"
                      onClick={() => startEdit(u)}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-slate-600 text-white hover:bg-slate-700"
                    >
                      ✏️
                    </button>
                  ) : (
                    <button
                      type="button"
                      title="Annuler"
                      aria-label="Annuler"
                      onClick={() => cancelEdit(u)}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-500 text-white hover:bg-gray-600"
                    >
                      ↩
                    </button>
                  )}
                  {/* Enregistrer */}
                  <button
                    type="button"
                    onClick={() => handleUserSave(u.id)}
                    disabled={!isEditing || !isEdited}
                    title="Enregistrer"
                    aria-label="Enregistrer"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                  >
                    💾
                  </button>
                  {/* Bouton reset password retiré */}
                  {/* Supprimer */}
                  <button
                    type="button"
                    title="Supprimer"
                    aria-label="Supprimer"
                    onClick={() => handleDeleteUser(u.id)}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-rose-600 text-white hover:bg-rose-700"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Liste utilisateurs - Table (desktop) */}
      <div className="hidden md:block overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm mt-4">
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
                const isEditing = !!editing[u.id];
                const original = { email: u.email, displayName: u.displayName || "", role: u.role || "user", ville: u.ville || "", telephone: u.telephone || "" };
                const edited = isEditing ? (editedUsers[u.id] || original) : original;
                const noChange =
                  edited.email === original.email &&
                  (edited.displayName || "") === (original.displayName || "") &&
                  edited.role === original.role;
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
                            [u.id]: { ...(prev[u.id] || edited), email: e.target.value },
                          }))
                        }
                        className="border rounded-md px-2 py-1 w-48"
                        disabled={!isEditing}
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={edited.displayName}
                        onChange={e =>
                          setEditedUsers((prev) => ({
                            ...prev,
                            [u.id]: { ...(prev[u.id] || edited), displayName: e.target.value },
                          }))
                        }
                        className="border rounded-md px-2 py-1 w-40"
                        disabled={!isEditing}
                      />
                    </td>
                    <td className="py-2 px-3">
                      <select
                        value={edited.role}
                        onChange={e =>
                          setEditedUsers((prev) => ({
                            ...prev,
                            [u.id]: { ...(prev[u.id] || edited), role: e.target.value },
                          }))
                        }
                        className="border rounded-md px-2 py-1 w-32"
                        disabled={!isEditing}
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
                    <td className="py-2 px-3 flex items-center gap-2">
                      {!isEditing ? (
                        <button
                          type="button"
                          title="Modifier"
                          aria-label="Modifier"
                          onClick={() => startEdit(u)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-600 text-white hover:bg-slate-700"
                        >
                          ✏️
                        </button>
                      ) : (
                        <button
                          type="button"
                          title="Annuler"
                          aria-label="Annuler"
                          onClick={() => cancelEdit(u)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-500 text-white hover:bg-gray-600"
                        >
                          ↩
                        </button>
                      )}
                      {/* Enregistrer */}
                      <button
                        type="button"
                        onClick={() => handleUserSave(u.id)}
                        disabled={!isEditing || noChange}
                        title="Enregistrer"
                        aria-label="Enregistrer"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                      >
                        💾
                      </button>
                      {/* Bouton reset password retiré */}
                      {/* Supprimer */}
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u.id)}
                        title="Supprimer"
                        aria-label="Supprimer"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-rose-600 text-white hover:bg-rose-700"
                      >
                        🗑️
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
                className="bg-red-600 text-white px-3 py-1.5 text-sm rounded hover:bg-red-700"
                onClick={confirmDelete}
              >
                Supprimer
              </button>
              <button
                className="bg-gray-300 text-gray-700 px-3 py-1.5 text-sm rounded"
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
