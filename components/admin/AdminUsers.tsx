"use client";
import { useEffect, useMemo, useState } from "react";
import PhotoUploader from "../PhotoUploader";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { translateFirebaseError } from "@/lib/firebaseErrors";
import {
  listUsers,
  sendResetTo,
  normalizeUsers,
} from "@/lib/services/userService";

export default function AdminUsers({
  showToast,
}: {
  showToast: (type: "success" | "error", message: string) => void;
}) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  type EditedUser = { email: string; displayName: string; role: string; ville?: string; telephone?: string; photos?: string[] };
  type UserRow = { id: string; email: string; displayName?: string; role?: string; ville?: string; telephone?: string; photos?: string[]; [key: string]: any };
  const [editedUsers, setEditedUsers] = useState<{ [userId: string]: EditedUser }>({});
  const [editing, setEditing] = useState<{ [userId: string]: boolean }>({});
  const [newUser, setNewUser] = useState({ email: "", displayName: "", role: "", ville: "", telephone: "" });
  const [confirmModal, setConfirmModal] = useState<string | null>(null);
  const [normalizing, setNormalizing] = useState(false);
  const [sort, setSort] = useState<{ key: "email"|"displayName"|"role"|"type"; dir: "asc"|"desc" }>({ key: "email", dir: "asc" });

  const computeType = (u: any) => (u.providerId === "google.com" || (u.email && u.email.endsWith("@gmail.com") && !u.passwordHash)) ? "Google" : "Email";
  const sortedUsers = useMemo(() => {
    const arr = [...users];
    arr.sort((a: any, b: any) => {
      const dirMul = sort.dir === "asc" ? 1 : -1;
      let va: any, vb: any;
      switch (sort.key) {
        case "displayName": va = (a.displayName || "").toString().toLowerCase(); vb = (b.displayName || "").toString().toLowerCase(); break;
        case "role": va = (a.role || "").toString().toLowerCase(); vb = (b.role || "").toString().toLowerCase(); break;
        case "type": va = computeType(a).toLowerCase(); vb = computeType(b).toLowerCase(); break;
        default: va = (a.email || "").toString().toLowerCase(); vb = (b.email || "").toString().toLowerCase();
      }
      if (va < vb) return -1 * dirMul;
      if (va > vb) return 1 * dirMul;
      return 0;
    });
    return arr;
  }, [users, sort]);

  // Abonnement temps réel aux utilisateurs
  useEffect(() => {
    const qUsers = query(collection(db, "users"), orderBy("email", "asc"));
    const unsub = onSnapshot(
      qUsers,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setUsers(data as any[]);
        setLoading(false);
      },
      (err) => {
        console.error("[AdminUsers][onSnapshot]", err);
        setLoading(false);
        showToast("error", translateFirebaseError((err as any)?.code) || "Erreur chargement temps réel.");
      }
    );
    return () => unsub();
  }, [showToast]);

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
        photos: Array.isArray((u as UserRow).photos) ? (u as UserRow).photos : [],
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
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          email: edited.email,
          displayName: edited.displayName,
          role: edited.role,
          ville: edited.ville,
          telephone: edited.telephone,
          photos: edited.photos || [],
        }),
      });
      if (!res.ok) throw new Error('Erreur API update user');
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...edited } : u)));
      setEditing((prev) => ({ ...prev, [userId]: false }));
      setEditedUsers((prev) => {
        const { [userId]: _omit, ...rest } = prev;
        return rest;
      });
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
      const res = await fetch('/api/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: confirmModal }),
      });
      if (!res.ok) throw new Error('Erreur API delete user');
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
              const res = await fetch('/api/user/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: newUser.email,
                  displayName: newUser.displayName,
                  role: newUser.role,
                  ville: newUser.ville,
                  telephone: newUser.telephone,
                }),
              });
              if (!res.ok) throw new Error('Erreur API create user');
              showToast("success", `Utilisateur "${newUser.displayName || newUser.email}" créé !`);
              setNewUser({ email: "", displayName: "", role: "", ville: "", telephone: "" });
              fetchUsers();
            } catch (e: any) {
              console.error("[AdminUsers][Create]", e);
              showToast("error", translateFirebaseError(e?.code) || "Erreur lors de la création.");
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
          sortedUsers.map((u) => {
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
                {/* Photos profil colocataire */}
                <div className="mt-2">
                  <label className="block text-xs text-slate-500 mb-1">Photos du profil colocataire</label>
                  <PhotoUploader
                    initial={Array.isArray((edited as EditedUser).photos) ? (edited as EditedUser).photos! : []}
                    openOnClick={true}
                    onChange={(list) => setEditedUsers(prev => ({
                      ...prev,
                      [u.id]: { ...(prev[u.id] || edited), photos: list.map(l => l.url) }
                    }))}
                  />
                </div>
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
                  {/* Réinitialiser mot de passe */}
                  <button
                    type="button"
                    title="Réinitialiser le mot de passe"
                    aria-label="Réinitialiser le mot de passe"
                    onClick={() => handleAdminResetPassword(u.email)}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-amber-500 text-white hover:bg-amber-600"
                  >
                    🔑
                  </button>
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
                <th className="py-2 px-3 text-left cursor-pointer select-none" onClick={() => setSort(prev => prev.key === "email" ? { key: "email", dir: prev.dir === "asc" ? "desc" : "asc" } : { key: "email", dir: "asc" })}>Email <span className="text-xs opacity-60">{sort.key !== "email" ? "↕" : sort.dir === "asc" ? "▲" : "▼"}</span></th>
                <th className="py-2 px-3 text-left cursor-pointer select-none" onClick={() => setSort(prev => prev.key === "displayName" ? { key: "displayName", dir: prev.dir === "asc" ? "desc" : "asc" } : { key: "displayName", dir: "asc" })}>Nom <span className="text-xs opacity-60">{sort.key !== "displayName" ? "↕" : sort.dir === "asc" ? "▲" : "▼"}</span></th>
                <th className="py-2 px-3 text-left cursor-pointer select-none" onClick={() => setSort(prev => prev.key === "role" ? { key: "role", dir: prev.dir === "asc" ? "desc" : "asc" } : { key: "role", dir: "asc" })}>Rôle <span className="text-xs opacity-60">{sort.key !== "role" ? "↕" : sort.dir === "asc" ? "▲" : "▼"}</span></th>
                <th className="py-2 px-3 text-left cursor-pointer select-none" onClick={() => setSort(prev => prev.key === "type" ? { key: "type", dir: prev.dir === "asc" ? "desc" : "asc" } : { key: "type", dir: "asc" })}>Type de compte <span className="text-xs opacity-60">{sort.key !== "type" ? "↕" : sort.dir === "asc" ? "▲" : "▼"}</span></th>
                <th className="py-2 px-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="[&>tr:nth-child(even)]:bg-slate-50/50">
              {sortedUsers.map((u) => {
                const isEditing = !!editing[u.id];
                const original: EditedUser = { email: u.email, displayName: u.displayName || "", role: u.role || "user", ville: u.ville || "", telephone: u.telephone || "", photos: Array.isArray((u as UserRow).photos) ? (u as UserRow).photos : [] };
                const edited = isEditing ? (editedUsers[u.id] || original) : original;
                const noChange =
                  edited.email === original.email &&
                  (edited.displayName || "") === (original.displayName || "") &&
                  edited.role === original.role;
                // Détection du type de compte
                const typeCompte = computeType(u);
                return (
                  <tr key={u.id} className="hover:bg-blue-50/50 transition">
                    <td className="py-2 px-3 align-middle">
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
                    <td className="py-2 px-3 align-middle">
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
                    <td className="py-2 px-3 align-middle">
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
                    <td className="py-2 px-3 align-middle">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeCompte === "Google" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}`}>
                        {typeCompte}
                      </span>
                    </td>
                    <td className="py-2 px-3 align-middle flex items-center gap-2">
                      {/* Photos profil colocataire */}
                      <div className="min-w-[120px]">
                        <PhotoUploader
                          initial={Array.isArray((edited as EditedUser).photos) ? (edited as EditedUser).photos! : []}
                          openOnClick={true}
                          onChange={(list) => setEditedUsers((prev) => ({
                            ...prev,
                            [u.id]: { ...(prev[u.id] || edited), photos: list.map(l => l.url) }
                          }))}
                        />
                      </div>
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
                      {/* Réinitialiser mot de passe */}
                      <button
                        type="button"
                        onClick={() => handleAdminResetPassword(u.email)}
                        title="Réinitialiser le mot de passe"
                        aria-label="Réinitialiser le mot de passe"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 text-white hover:bg-amber-600"
                      >
                        🔑
                      </button>
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
