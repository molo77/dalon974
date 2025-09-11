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
  
  // États pour la modération
  const [moderationFilter, setModerationFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [moderationStats, setModerationStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0
  });
  const [moderationModal, setModerationModal] = useState<{
    isOpen: boolean;
    annonceId: string | null;
    action: 'approve' | 'reject' | null;
    reason: string;
  }>({
    isOpen: false,
    annonceId: null,
    action: null,
    reason: ''
  });

  useEffect(() => {
    fetchAnnonces();
  }, [moderationFilter]);

  const fetchAnnonces = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (moderationFilter !== 'all') {
        params.append('status', moderationFilter);
      }
      
      const res = await fetch(`/api/admin/moderate-annonce?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      
      if (data.annonces) {
        setAnnonces(data.annonces);
        setModerationStats(data.stats || { pending: 0, approved: 0, rejected: 0 });
      } else {
        setAnnonces([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des annonces:', error);
      setAnnonces([]);
    }
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
      const payload: any = {
        titre: editAnnonceData.titre,
        ville: editAnnonceData.ville,
        prix: editAnnonceData.prix ? Number(editAnnonceData.prix) : null,
        surface: editAnnonceData.surface ? Number(editAnnonceData.surface) : null,
        nbChambres: editAnnonceData.chambres ? Number(editAnnonceData.chambres) : null,
        description: editAnnonceData.description,
      };
      Object.keys(payload).forEach((k) => (payload[k] === null || payload[k] === "") && delete payload[k]);
      const res = await fetch(`/api/annonces/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("bad");
      const updated = await res.json();
      setAnnonces((prev) => prev.map((a) => (a.id === id ? updated : a)));
      showToast("success", "Annonce modifiée avec succès !");
  } catch {
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
      const res = await fetch(`/api/annonces/${confirmModal}`, { method: "DELETE" });
      if (!res.ok) throw new Error("bad");
      setAnnonces((prev) => prev.filter((a) => a.id !== confirmModal));
      showToast("success", "Annonce supprimée avec succès !");
  } catch {
      showToast("error", "Erreur lors de la suppression.");
    }
    setConfirmModal(null);
  };

  const handleCreateAnnonce = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        titre: newAnnonce.titre,
        ville: newAnnonce.ville,
        prix: newAnnonce.prix ? Number(newAnnonce.prix) : null,
        surface: newAnnonce.surface ? Number(newAnnonce.surface) : null,
        nbChambres: newAnnonce.chambres ? Number(newAnnonce.chambres) : null,
        description: newAnnonce.description,
      };
      Object.keys(payload).forEach((k) => (payload[k] === null || payload[k] === "") && delete payload[k]);
      const res = await fetch(`/api/annonces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("bad");
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
  } catch {
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

  // Fonctions de modération
  const handleModerationAction = (annonceId: string, action: 'approve' | 'reject') => {
    setModerationModal({
      isOpen: true,
      annonceId,
      action,
      reason: ''
    });
  };

  const confirmModeration = async () => {
    if (!moderationModal.annonceId || !moderationModal.action) return;
    
    try {
      const res = await fetch('/api/admin/moderate-annonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annonceId: moderationModal.annonceId,
          action: moderationModal.action,
          reason: moderationModal.reason
        })
      });
      
      if (!res.ok) throw new Error('Erreur lors de la modération');
      
      const result = await res.json();
      showToast("success", result.message);
      
      // Recharger les annonces
      fetchAnnonces();
      
      // Fermer le modal
      setModerationModal({
        isOpen: false,
        annonceId: null,
        action: null,
        reason: ''
      });
    } catch (error) {
      showToast("error", "Erreur lors de la modération");
    }
  };

  const getModerationStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getModerationStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvée';
      case 'rejected': return 'Rejetée';
      default: return status;
    }
  };

  return (
    <>
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-blue-700 flex items-center gap-2">
          📢 Annonces
        </h2>
        
        {/* Statistiques de modération */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{annonces.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-white rounded-xl border border-yellow-200 p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{moderationStats.pending}</div>
            <div className="text-sm text-gray-600">En attente</div>
          </div>
          <div className="bg-white rounded-xl border border-green-200 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{moderationStats.approved}</div>
            <div className="text-sm text-gray-600">Approuvées</div>
          </div>
          <div className="bg-white rounded-xl border border-red-200 p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{moderationStats.rejected}</div>
            <div className="text-sm text-gray-600">Rejetées</div>
          </div>
        </div>

        {/* Filtres de modération */}
        <div className="flex gap-2 bg-white rounded-xl border border-gray-200 p-2 mb-4">
          <button
            onClick={() => setModerationFilter('all')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              moderationFilter === 'all'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Toutes ({annonces.length})
          </button>
          <button
            onClick={() => setModerationFilter('pending')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              moderationFilter === 'pending'
                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            En attente ({moderationStats.pending})
          </button>
          <button
            onClick={() => setModerationFilter('approved')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              moderationFilter === 'approved'
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Approuvées ({moderationStats.approved})
          </button>
          <button
            onClick={() => setModerationFilter('rejected')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              moderationFilter === 'rejected'
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Rejetées ({moderationStats.rejected})
          </button>
        </div>
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
          <div className="fixed inset-0 bg-blue-600/20 backdrop-blur-sm flex items-center justify-center z-[9999] rounded-2xl">
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
                  <th className="py-2 px-3 align-middle">Statut</th>
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
                        <td className="py-2 px-3 align-middle">{a.nbChambres ?? a.chambres ?? "-"}</td>
                        <td className="py-2 px-3 align-middle">{a.description ?? "-"}</td>
                        <td className="py-2 px-3 align-middle">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getModerationStatusColor(a.moderationStatus || 'pending')}`}>
                            {getModerationStatusText(a.moderationStatus || 'pending')}
                          </span>
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
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                            onClick={() => handleEditAnnonce(a)}
                          >
                            Modifier
                          </button>
                          {(a.moderationStatus === 'pending' || !a.moderationStatus) && (
                            <>
                              <button
                                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                onClick={() => handleModerationAction(a.id, 'approve')}
                              >
                                Approuver
                              </button>
                              <button
                                className="bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700"
                                onClick={() => handleModerationAction(a.id, 'reject')}
                              >
                                Rejeter
                              </button>
                            </>
                          )}
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
        <div className="fixed inset-0 bg-blue-600/20 backdrop-blur-sm flex items-center justify-center z-[9999] rounded-2xl">
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

      {/* Modal de modération */}
      {moderationModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-semibold mb-4">
              {moderationModal.action === 'approve' ? 'Approuver l\'annonce' : 'Rejeter l\'annonce'}
            </h3>
            
            {moderationModal.action === 'reject' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison du rejet (optionnel)
                </label>
                <textarea
                  value={moderationModal.reason}
                  onChange={(e) => setModerationModal(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Expliquez pourquoi cette annonce est rejetée..."
                  rows={3}
                />
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={confirmModeration}
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-white ${
                  moderationModal.action === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {moderationModal.action === 'approve' ? 'Approuver' : 'Rejeter'}
              </button>
              <button
                onClick={() => setModerationModal({
                  isOpen: false,
                  annonceId: null,
                  action: null,
                  reason: ''
                })}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
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
