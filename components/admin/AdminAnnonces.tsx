"use client";

import { useState, useEffect, useMemo } from "react";

type AdminAnnoncesProps = {
  showToast: (type: "success" | "error", message: string) => void;
  // Sélection multiple (optionnelle)
  selectable?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onSelectAll?: (allIds?: string[]) => void;
  onDeselectAll?: () => void;
  onBulkDelete?: (ids?: string[]) => Promise<void> | void;
  bulkDeleting?: boolean;
};

export default function AdminAnnonces({
  showToast,
  selectable,
  selectedIds = [],
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onBulkDelete,
  bulkDeleting,
}: AdminAnnoncesProps) {
  const [annonces, setAnnonces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editAnnonceId, setEditAnnonceId] = useState<string | null>(null);
  const [editAnnonceData, setEditAnnonceData] = useState<any>({});
  const [showCreateAnnonce, setShowCreateAnnonce] = useState(false);
  const [newAnnonce, setNewAnnonce] = useState({
    titre: "",
    ville: "",
    prix: "",
    surface: "",
    chambres: "",
    description: "",
  });
  const [confirmModal, setConfirmModal] = useState<string | null>(null);

  useEffect(() => {
    fetchAnnonces();
  }, []);

  const fetchAnnonces = async () => {
    setLoading(true);
    const annoncesSnap = await getDocs(
      collection(db, "annonces")
    );
    setAnnonces(annoncesSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
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
          a.id === id ? { ...a, ...editAnnonceData } : a
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

  const handleDeleteAnnonce = (id: string) => {
    setConfirmModal(id);
  };

  const confirmDelete = async () => {
    if (!confirmModal) return;
    try {
      await deleteDoc(doc(db, "annonces", confirmModal));
      setAnnonces((prev) => prev.filter((a) => a.id !== confirmModal));
      showToast("success", "Annonce supprimée avec succès !");
    } catch (e) {
      showToast("error", "Erreur lors de la suppression.");
    }
    setConfirmModal(null);
  };

  const handleCreateAnnonce = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "annonces"), {
        ...newAnnonce,
        prix: Number(newAnnonce.prix),
        surface: Number(newAnnonce.surface),
        chambres: Number(newAnnonce.chambres),
        createdAt: Timestamp.now(),
      });
      showToast("success", "Annonce créée !");
      setShowCreateAnnonce(false);
      setNewAnnonce({
        titre: "",
        ville: "",
        prix: "",
        surface: "",
        chambres: "",
        description: "",
      });
      fetchAnnonces();
    } catch (e) {
      showToast("error", "Erreur lors de la création de l'annonce.");
    }
  };

  // Récupère les IDs visibles pour "Tout sélectionner"
  const visibleIds = useMemo(() => {
    return annonces.map(a => a.id);
  }, [annonces]);

  const handleSelectAll = () => {
    if (onSelectAll) onSelectAll(visibleIds);
  };

  const handleBulkDelete = async () => {
    if (!onBulkDelete || selectedIds.length === 0) return;
    await onBulkDelete(selectedIds);
  };

  return (
    <>
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-blue-700 flex items-center gap-2">
          📢 Annonces
        </h2>
        {/* Bouton création annonce */}
        <div className="mb-4 flex justify-end">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            onClick={() => setShowCreateAnnonce(true)}
          >
            + Nouvelle annonce
          </button>
        </div>
        {/* Modal création annonce */}
        {showCreateAnnonce && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <form
              onSubmit={handleCreateAnnonce}
              className="bg-white rounded shadow p-6 w-full max-w-md flex flex-col gap-4"
            >
              <h2 className="text-xl font-bold mb-2 text-center">Créer une annonce</h2>
              <input
                type="text"
                placeholder="Titre"
                value={newAnnonce.titre}
                onChange={e => setNewAnnonce({ ...newAnnonce, titre: e.target.value })}
                className="border rounded px-3 py-2"
                required
              />
              <input
                type="text"
                placeholder="Ville"
                value={newAnnonce.ville}
                onChange={e => setNewAnnonce({ ...newAnnonce, ville: e.target.value })}
                className="border rounded px-3 py-2"
                required
              />
              <input
                type="number"
                placeholder="Prix"
                value={newAnnonce.prix}
                onChange={e => setNewAnnonce({ ...newAnnonce, prix: e.target.value })}
                className="border rounded px-3 py-2"
                required
              />
              <input
                type="number"
                placeholder="Surface"
                value={newAnnonce.surface}
                onChange={e => setNewAnnonce({ ...newAnnonce, surface: e.target.value })}
                className="border rounded px-3 py-2"
              />
              <input
                type="number"
                placeholder="Chambres"
                value={newAnnonce.chambres}
                onChange={e => setNewAnnonce({ ...newAnnonce, chambres: e.target.value })}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Description"
                value={newAnnonce.description}
                onChange={e => setNewAnnonce({ ...newAnnonce, description: e.target.value })}
                className="border rounded px-3 py-2"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex-1"
                >
                  Créer
                </button>
                <button
                  type="button"
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded flex-1"
                  onClick={() => setShowCreateAnnonce(false)}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}
        {/* Barre d’actions sélection multiple */}
        {selectable && (
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={!onSelectAll}
              className="border px-3 py-1.5 rounded hover:bg-slate-50 disabled:opacity-60"
            >
              Tout sélectionner
            </button>
            <button
              type="button"
              onClick={onDeselectAll}
              disabled={!onDeselectAll || selectedIds.length === 0}
              className="border px-3 py-1.5 rounded hover:bg-slate-50 disabled:opacity-60"
            >
              Tout désélectionner
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={!onBulkDelete || selectedIds.length === 0 || bulkDeleting}
              className="bg-rose-600 text-white px-3 py-1.5 rounded hover:bg-rose-700 disabled:opacity-60"
            >
              {bulkDeleting ? "Suppression..." : `Supprimer la sélection (${selectedIds.length})`}
            </button>
          </div>
        )}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <span className="text-lg text-gray-500">Chargement...</span>
            </div>
          ) : annonces.length === 0 ? (
            <p className="text-gray-500">Aucune annonce.</p>
          ) : (
            <table className="w-full text-sm border-separate border-spacing-y-2">
              <thead>
                <tr className="bg-blue-50">
                  {selectable && <th className="py-2 px-3 rounded-l-lg align-middle">Sélection</th>}
                  <th className="py-2 px-3 rounded-l-lg align-middle">Titre</th>
                  <th className="py-2 px-3 align-middle">Ville</th>
                  <th className="py-2 px-3 align-middle">Prix</th>
                  <th className="py-2 px-3 align-middle">Surface</th>
                  <th className="py-2 px-3 align-middle">Chambres</th>
                  <th className="py-2 px-3 align-middle">Description</th>
                  <th className="py-2 px-3 align-middle">Date création</th>
                  <th className="py-2 px-3 rounded-r-lg text-center align-middle">Actions</th>
                </tr>
              </thead>
              <tbody>
                {annonces.map((a) => (
                  <tr key={a.id} className="bg-gray-50 hover:bg-blue-50 transition">
                    {selectable && (
                      <td className="py-2 px-3 align-middle">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(a.id)}
                          onChange={() => onToggleSelect && onToggleSelect(a.id)}
                        />
                      </td>
                    )}
                    {editAnnonceId === a.id ? (
                      <>
                        <td className="py-2 px-3 align-middle">
                          <input
                            name="titre"
                            value={editAnnonceData.titre}
                            onChange={handleEditAnnonceChange}
                            className="border rounded px-2 py-1 w-full"
                          />
                        </td>
                        <td className="py-2 px-3 align-middle">
                          <input
                            name="ville"
                            value={editAnnonceData.ville}
                            onChange={handleEditAnnonceChange}
                            className="border rounded px-2 py-1 w-full"
                          />
                        </td>
                        <td className="py-2 px-3 align-middle">
                          <input
                            name="prix"
                            value={editAnnonceData.prix}
                            onChange={handleEditAnnonceChange}
                            className="border rounded px-2 py-1 w-full"
                            type="number"
                          />
                        </td>
                        <td className="py-2 px-3 align-middle">
                          <input
                            name="surface"
                            value={editAnnonceData.surface ?? ""}
                            onChange={handleEditAnnonceChange}
                            className="border rounded px-2 py-1 w-full"
                            type="number"
                          />
                        </td>
                        <td className="py-2 px-3 align-middle">
                          <input
                            name="chambres"
                            value={editAnnonceData.chambres ?? ""}
                            onChange={handleEditAnnonceChange}
                            className="border rounded px-2 py-1 w-full"
                            type="number"
                          />
                        </td>
                        <td className="py-2 px-3 align-middle">
                          <input
                            name="description"
                            value={editAnnonceData.description ?? ""}
                            onChange={handleEditAnnonceChange}
                            className="border rounded px-2 py-1 w-full"
                          />
                        </td>
                        <td className="py-2 px-3 align-middle">
                          {a.createdAt
                            ? new Date(
                                a.createdAt.seconds
                                  ? a.createdAt.seconds * 1000
                                  : a.createdAt
                              ).toLocaleString()
                            : "-"}
                        </td>
                        <td className="py-2 px-3 align-middle flex items-center justify-center gap-2">
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
                        <td className="py-2 px-3 align-middle">{a.titre}</td>
                        <td className="py-2 px-3 align-middle">{a.ville}</td>
                        <td className="py-2 px-3 align-middle">{a.prix}</td>
                        <td className="py-2 px-3 align-middle">{a.surface ?? "-"}</td>
                        <td className="py-2 px-3 align-middle">{a.chambres ?? "-"}</td>
                        <td className="py-2 px-3 align-middle">{a.description ?? "-"}</td>
                        <td className="py-2 px-3 align-middle">
                          {a.createdAt
                            ? new Date(
                                a.createdAt.seconds
                                  ? a.createdAt.seconds * 1000
                                  : a.createdAt
                              ).toLocaleString()
                            : "-"}
                        </td>
                        <td className="py-2 px-3 align-middle flex items-center justify-center gap-2">
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
      {/* Modal de confirmation suppression */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow p-6 w-full max-w-xs flex flex-col items-center">
            <p className="mb-4 text-center">
              Êtes-vous sûr de vouloir supprimer cette annonce&nbsp;
              <br />
              <span className="font-semibold text-red-700">
                « {annonces.find(a => a.id === confirmModal)?.titre ?? ""} »
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
    </>
  );
}
