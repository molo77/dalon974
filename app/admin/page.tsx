"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import AdminUsers from "@/components/admin/AdminUsers";
// import AdminAnnonces from "@/components/admin/AdminAnnonces"; // affichage remplacé par une liste intégrée
import useAdminGate from "@/hooks/useAdminGate";
import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  writeBatch,
  doc,
  query,
  orderBy,
  onSnapshot,
  limit as fsLimit,
  where,            // + import
  getDoc,           // + import
  getDocs,          // + import
} from "firebase/firestore";
import AnnonceModal from "@/components/AnnonceModal";
import { updateAnnonce } from "@/lib/services/annonceService";
import Link from "next/link"; // + import

// Helper: slug
const slugify = (s: string) =>
  (s || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Communes (une annonce d’exemple par commune)
const SEED_COMMUNES = [
  "Saint-Denis","Sainte-Marie","Sainte-Suzanne",
  "Saint-André","Bras-Panon","Salazie",
  "Saint-Benoît","La Plaine-des-Palmistes","Sainte-Rose","Saint-Philippe",
  "Le Port","La Possession","Saint-Paul","Trois-Bassins","Saint-Leu","Les Avirons","L'Étang-Salé",
  "Saint-Louis","Cilaos","Le Tampon","Entre-Deux","Saint-Pierre","Petite-Île","Saint-Joseph"
];

export default function AdminPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"annonces" | "users">("annonces");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string; id?: string } | null>(null);
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [adminAnnonces, setAdminAnnonces] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminSelected, setAdminSelected] = useState<string[]>([]);
  const [ownersById, setOwnersById] = useState<Record<string, { email?: string; displayName?: string }>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editAnnonce, setEditAnnonce] = useState<any | null>(null);

  // NOUVEAU: modal “Changer propriétaire”
  const [bulkOwnerOpen, setBulkOwnerOpen] = useState(false);
  const [bulkOwnerInput, setBulkOwnerInput] = useState("");

  const { isAdmin, checkingAdmin } = useAdminGate({ user, loading, router });

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message, id: Date.now().toString() });
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(null), 3500);
  };

  const seedExamples = async () => {
    if (seeding) return;
    setSeeding(true);
    try {
      const placeholder = "/images/annonce-placeholder.jpg";
      const col = collection(db, "annonces");
      await Promise.all(
        SEED_COMMUNES.map(async (name, idx) => {
          const prix = 350 + (idx % 12) * 25; // variation simple
          const surface = 12 + (idx % 8) * 2;
          await addDoc(col, {
            titre: `Chambre en colocation à ${name}`,
            ville: name,
            communeSlug: slugify(name),
            prix,
            surface,
            description: `Exemple d’annonce pour ${name}. Proche commodités, colocation conviviale.`,
            imageUrl: placeholder,
            createdAt: serverTimestamp(),
          });
        })
      );
      showToast("success", `${SEED_COMMUNES.length} annonces d'exemple créées.`);
    } catch (e: any) {
      console.error("[Admin][SeedExamples]", e);
      showToast("error", "Erreur lors de la création des annonces d’exemple.");
    } finally {
      setSeeding(false);
    }
  };

  // Abonnement temps réel aux annonces (200 dernières, triées par date desc)
  useEffect(() => {
    if (activeTab !== "annonces") return;
    const q = query(collection(db, "annonces"), orderBy("createdAt", "desc"), fsLimit(200));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAdminAnnonces(items);
        // Nettoyer la sélection si des annonces ont disparu
        setAdminSelected((prev) => prev.filter((id) => items.some((a) => a.id === id)));
      },
      (err) => {
        console.error("[Admin][annonces][onSnapshot]", err);
      }
    );
    return () => unsub();
  }, [activeTab]);

  // NOUVEAU: Abonnement temps réel aux utilisateurs pour résoudre les propriétaires
  useEffect(() => {
    if (activeTab !== "annonces") return;
    const q = query(collection(db, "users"), orderBy("email", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const map: Record<string, { email?: string; displayName?: string }> = {};
        snap.docs.forEach((d) => {
          const data: any = d.data();
          map[d.id] = { email: data?.email, displayName: data?.displayName };
        });
        setOwnersById(map);
      },
      (err) => {
        console.error("[Admin][users][onSnapshot]", err);
      }
    );
    return () => unsub();
  }, [activeTab]);

  const toggleAdminSelect = (id: string) => {
    setAdminSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };
  const adminSelectAll = () => setAdminSelected(adminAnnonces.map(a => a.id));
  const adminDeselectAll = () => setAdminSelected([]);

  // Helper: résoudre un userId depuis un email ou un id donné
  const resolveUserIdByEmailOrId = async (raw: string): Promise<string | null> => {
    const v = (raw || "").trim();
    if (!v) return null;
    try {
      if (v.includes("@")) {
        // recherche par email exact
        const qUsers = query(collection(db, "users"), where("email", "==", v.toLowerCase()));
        const snap = await getDocs(qUsers);
        if (!snap.empty) return snap.docs[0].id;
        return null;
      } else {
        // tentative par id direct
        const ref = doc(db, "users", v);
        const snap = await getDoc(ref);
        return snap.exists() ? v : null;
      }
    } catch {
      return null;
    }
  };

  const adminBulkDelete = async (ids?: string[]) => {
    const toDelete = Array.isArray(ids) && ids.length ? ids : adminSelected;
    if (toDelete.length === 0) return;
    try {
      setAdminLoading(true);
      // Batch en paquets de 400 (limite Firestore 500 ops)
      const chunks = (arr: string[], size = 400) => {
        const out: string[][] = [];
        for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
      };
      for (const chunk of chunks(toDelete)) {
        const batch = writeBatch(db);
        chunk.forEach(id => batch.delete(doc(db, "annonces", id)));
        await batch.commit();
      }
      setAdminSelected([]);
      showToast("success", "Annonces supprimées ✅");
      // La liste se rafraîchit automatiquement via onSnapshot
    } catch (e) {
      console.error("[Admin][BulkDelete]", e);
      showToast("error", "Erreur suppression multiple.");
    } finally {
      setAdminLoading(false);
    }
  };

  // NOUVEAU: appliquer le changement de propriétaire en lot
  const performBulkOwnerChange = async () => {
    if (adminSelected.length === 0) return;
    setAdminLoading(true);
    try {
      const targetUserId = await resolveUserIdByEmailOrId(bulkOwnerInput);
      if (!targetUserId) {
        setAdminLoading(false);
        return showToast("error", "Utilisateur introuvable (email ou ID).");
      }
      const chunks = (arr: string[], size = 400) => {
        const out: string[][] = [];
        for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
      };
      let updatedCount = 0;
      for (const chunk of chunks(adminSelected)) {
        const batch = writeBatch(db);
        chunk.forEach((id) => {
          batch.update(doc(db, "annonces", id), {
            ownerId: targetUserId,
            uid: targetUserId, // garder compatibilité avec les écrans “Mes annonces”
            updatedAt: serverTimestamp(),
          } as any);
        });
        await batch.commit();
        updatedCount += chunk.length;
      }
      setBulkOwnerOpen(false);
      setBulkOwnerInput("");
      setAdminSelected([]);
      showToast("success", `Propriétaire mis à jour pour ${updatedCount} annonce(s) ✅`);
      // La liste se met à jour via onSnapshot.
    } catch (e) {
      console.error("[Admin][BulkOwnerChange]", e);
      showToast("error", "Erreur lors du changement de propriétaire.");
    } finally {
      setAdminLoading(false);
    }
  };

  if (loading || checkingAdmin) {
    return (
      <main className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <p className="text-xl">Chargement...</p>
      </main>
    );
  }

  if (!isAdmin) {
    return null;
  }

  // Master checkbox (tout sélectionner/désélectionner)
  const allSelected = adminAnnonces.length > 0 && adminSelected.length === adminAnnonces.length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-0 flex">
      <aside className="w-64 min-h-screen bg-white shadow-lg flex flex-col gap-2 py-8 px-4 border-r border-slate-200">
        <h2 className="text-xl font-bold text-blue-700 mb-8 text-center tracking-wide">Admin Panel</h2>
        <button
          className={`text-left px-4 py-3 rounded-lg transition ${
            activeTab === "annonces" ? "bg-blue-600 text-white shadow" : "hover:bg-blue-50 text-slate-700"
          }`}
          onClick={() => setActiveTab("annonces")}
        >
          📢 Gestion des annonces
        </button>
        <button
          className={`text-left px-4 py-3 rounded-lg transition ${
            activeTab === "users" ? "bg-blue-600 text-white shadow" : "hover:bg-blue-50 text-slate-700"
          }`}
          onClick={() => setActiveTab("users")}
        >
          👤 Gestion des utilisateurs
        </button>
      </aside>
      <section className="flex-1 px-4 md:px-12 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-extrabold text-blue-800 tracking-tight">
            Administration
          </h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={seedExamples}
              disabled={seeding}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-60"
              title="Créer une annonce d’exemple pour chaque commune"
            >
              {seeding ? "Création..." : "Créer annonces d’exemple"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {activeTab === "annonces" ? (
            <>
              {/* Barre d’actions */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {/* ...existing master checkbox + select/deselect all... */}
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => (allSelected ? adminDeselectAll() : adminSelectAll())}
                  />
                  <span className="text-sm text-slate-700">Tout ({adminAnnonces.length})</span>
                </label>
                <button type="button" onClick={adminSelectAll} disabled={adminAnnonces.length === 0} className="border px-3 py-1.5 rounded hover:bg-slate-50 disabled:opacity-60">Tout sélectionner</button>
                <button type="button" onClick={adminDeselectAll} disabled={adminSelected.length === 0} className="border px-3 py-1.5 rounded hover:bg-slate-50 disabled:opacity-60">Tout désélectionner</button>
                <button type="button" onClick={() => adminBulkDelete()} disabled={adminSelected.length === 0 || adminLoading} className="bg-rose-600 text-white px-3 py-1.5 rounded hover:bg-rose-700 disabled:opacity-60">
                  {adminLoading ? "Suppression..." : `Supprimer la sélection (${adminSelected.length})`}
                </button>
                {/* NOUVEAU: bouton changer propriétaire */}
                <button
                  type="button"
                  onClick={() => setBulkOwnerOpen(true)}
                  disabled={adminSelected.length === 0 || adminLoading}
                  className="bg-amber-600 text-white px-3 py-1.5 rounded hover:bg-amber-700 disabled:opacity-60"
                >
                  Changer propriétaire ({adminSelected.length})
                </button>
              </div>

              {/* Liste en temps réel avec colonne Propriétaire */}
              {adminAnnonces.length === 0 ? (
                <p className="text-slate-500">Aucune annonce à afficher.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[15px]">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="py-2 px-3 w-10"></th>
                        <th className="py-2 px-3 text-left">Titre</th>
                        <th className="py-2 px-3 text-left">Ville</th>
                        <th className="py-2 px-3 text-left">Prix</th>
                        <th className="py-2 px-3 text-left">Description (court)</th>
                        <th className="py-2 px-3 text-left">Propriétaire</th>
                        <th className="py-2 px-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="[&>tr:nth-child(even)]:bg-slate-50/50">
                      {adminAnnonces.map((a) => {
                        const uid = a.ownerId || a.uid;
                        const owner = ownersById[uid || ""] || {};
                        const ownerLabel = owner.displayName || owner.email || uid || "-";
                        const shortDesc =
                          (a.description || "").toString().slice(0, 160) +
                          ((a.description || "").length > 160 ? "…" : "");
                        return (
                          <tr key={a.id} className="hover:bg-blue-50/50 transition">
                            <td className="py-2 px-3">
                              <input
                                type="checkbox"
                                checked={adminSelected.includes(a.id)}
                                onChange={() => toggleAdminSelect(a.id)}
                              />
                            </td>
                            <td className="py-2 px-3">
                              <Link
                                href={`/annonce/${a.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                                title="Ouvrir la fiche annonce dans un nouvel onglet"
                              >
                                {a.titre || "(sans titre)"}
                              </Link>
                            </td>
                            <td className="py-2 px-3">{a.ville || "-"}</td>
                            <td className="py-2 px-3">{typeof a.prix === "number" ? `${a.prix} €` : "-"}</td>
                            {/* Colonne description élargie et non tronquée en une seule ligne */}
                            <td className="py-2 px-3 max-w-[560px] whitespace-normal">
                              {shortDesc}
                            </td>
                            <td className="py-2 px-3">{ownerLabel}</td>
                            <td className="py-2 px-3 flex gap-3">
                              {/* NOUVEAU: bouton Modifier */}
                              <button
                                type="button"
                                className="text-blue-600 hover:underline"
                                onClick={() => { setEditAnnonce(a); setModalOpen(true); }}
                              >
                                Modifier
                              </button>
                              <button
                                type="button"
                                className="text-rose-600 hover:underline"
                                onClick={() => adminBulkDelete([a.id])}
                                disabled={adminLoading}
                              >
                                Supprimer
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* NOUVEAU: Modal d’édition */}
              <AnnonceModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setEditAnnonce(null); }}
                annonce={editAnnonce}
                onSubmit={async ({ titre, ville, prix, imageUrl, surface, nbChambres, equipements, description }) => {
                  if (!editAnnonce) return;
                  try {
                    const payload: any = {
                      titre,
                      ville,
                      prix: prix ? Number(prix) : null,
                      imageUrl,
                      surface: surface ? Number(surface) : null,
                      nbChambres: nbChambres ? Number(nbChambres) : null,
                      equipements,
                      description,
                    };
                    Object.keys(payload).forEach((k) => (payload[k] === "" || payload[k] === null) && delete payload[k]);
                    await updateAnnonce(editAnnonce.id, payload);
                    showToast("success", "Annonce mise à jour ✅");
                  } catch (e: any) {
                    console.error("[Admin][UpdateAnnonce]", e);
                    showToast("error", "Erreur lors de la mise à jour.");
                  } finally {
                    setModalOpen(false);
                    setEditAnnonce(null);
                  }
                }}
              />

              {/* NOUVEAU: Modal “Changer propriétaire” */}
              {bulkOwnerOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
                    <h3 className="text-lg font-semibold mb-3">Changer le propriétaire</h3>
                    <p className="text-sm text-slate-600 mb-3">
                      Saisissez l’email OU l’identifiant (userId) du nouveau propriétaire
                      et utilisez la liste de suggestions.
                    </p>
                    <input
                      type="text"
                      placeholder="ex: user@example.com ou UID"
                      value={bulkOwnerInput}
                      onChange={(e) => setBulkOwnerInput(e.target.value)}
                      className="border rounded px-3 py-2 w-full mb-2"
                      list="owners-suggestions"
                      autoFocus
                    />
                    {/* Suggestions d’utilisateurs existants (email/displayName) */}
                    <datalist id="owners-suggestions">
                      {Object.entries(ownersById).map(([id, o]) => {
                        const label = o?.displayName
                          ? `${o.displayName} <${o.email || id}>`
                          : (o?.email || id);
                        // La valeur utilisable reste l’email s’il existe, sinon l’UID
                        const value = (o?.email || id) as string;
                        return <option key={id} value={value}>{label}</option>;
                      })}
                    </datalist>

                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        type="button"
                        className="px-4 py-2 rounded bg-gray-200 text-gray-700"
                        onClick={() => { setBulkOwnerOpen(false); setBulkOwnerInput(""); }}
                        disabled={adminLoading}
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                        onClick={performBulkOwnerChange}
                        disabled={!bulkOwnerInput.trim() || adminLoading}
                      >
                        Confirmer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <AdminUsers showToast={showToast} />
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

