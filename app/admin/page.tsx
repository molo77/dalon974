"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminUsers from "@/components/admin/AdminUsers";
import ExpandableImage from "@/components/ExpandableImage"; // New import
// import AdminAnnonces from "@/components/admin/AdminAnnonces"; // affichage remplacé par une liste intégrée
import useAdminGate from "@/hooks/useAdminGate";
// Firebase supprimé: à migrer vers API Prisma.
const serverTimestamp = () => new Date();
import AnnonceModal from "@/components/AnnonceModal";
const ColocPhotoSection = dynamic(() => import("@/components/ColocPhotoSection"), { ssr: false });
import { updateAnnonce, deleteAnnonce } from "@/lib/services/annonceService";
import { updateColoc, deleteColoc, getColoc, listColoc } from "@/lib/services/colocService";
import Link from "next/link"; // + import
import Image from "next/image";
import { toast as appToast } from "@/components/Toast";

// données seed retirées (non utilisées pendant la migration)

export default function AdminPage() {
  const { data: session, status } = useSession();
  const user = session?.user as any;
  const loading = status === "loading";
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"annonces" | "users" | "colocs">("annonces");
  // toast state removed (unused)
  // toastTimeout removed
  const [seeding, setSeeding] = useState(false);
  const [adminAnnonces, setAdminAnnonces] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminSelected, setAdminSelected] = useState<string[]>([]);
  const [ownersById, setOwnersById] = useState<Record<string, { email?: string; displayName?: string }>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editAnnonce, setEditAnnonce] = useState<any | null>(null);
  // NOUVEAU: états pour profils colocataires
  const [adminColocs, setAdminColocs] = useState<any[]>([]);
  const [adminColocsSelected, setAdminColocsSelected] = useState<string[]>([]);
  const [colocModalOpen, setColocModalOpen] = useState(false);
  const [editColoc, setEditColoc] = useState<any | null>(null);
  // Tri tableaux (annonces, colocs)
  const [annoncesSort, setAnnoncesSort] = useState<{ key: "titre"|"ville"|"prix"|"owner"|"createdAt"; dir: "asc"|"desc" }>({ key: "createdAt", dir: "desc" });
  const [colocsSort, setColocsSort] = useState<{ key: "nom"|"ville"|"zones"|"budget"|"email"|"createdAt"; dir: "asc"|"desc" }>({ key: "createdAt", dir: "desc" });
  // Formulaire d’édition coloc (modale)
  const [colocNomEdit, setColocNomEdit] = useState("");
  const [colocVilleEdit, setColocVilleEdit] = useState("");
  const [colocBudgetEdit, setColocBudgetEdit] = useState<string>("");
  const [colocMainUrlEdit, setColocMainUrlEdit] = useState("");
  const [colocDescriptionEdit, setColocDescriptionEdit] = useState("");
  const [colocAgeEdit, setColocAgeEdit] = useState<string>("");
  const [colocProfessionEdit, setColocProfessionEdit] = useState("");
  const [colocTelephoneEdit, setColocTelephoneEdit] = useState("");
  const [colocDateDispoEdit, setColocDateDispoEdit] = useState("");
  // Nouveaux champs type "Tinder"
  const [colocGenreEdit, setColocGenreEdit] = useState("");
  const [colocOrientationEdit, setColocOrientationEdit] = useState("");
  const [colocBioCourteEdit, setColocBioCourteEdit] = useState("");
  const [colocLanguesEdit, setColocLanguesEdit] = useState(""); // CSV
  const [colocInstagramEdit, setColocInstagramEdit] = useState("");
  const [colocPhotosCsvEdit, setColocPhotosCsvEdit] = useState(""); // legacy CSV (not shown)
  // Préférences & style de vie
  const [prefGenreEdit, setPrefGenreEdit] = useState("");
  const [prefAgeMinEdit, setPrefAgeMinEdit] = useState<string>("");
  const [prefAgeMaxEdit, setPrefAgeMaxEdit] = useState<string>("");
  const [accepteFumeursEdit, setAccepteFumeursEdit] = useState(false);
  const [accepteAnimauxEdit, setAccepteAnimauxEdit] = useState(false);
  const [rythmeEdit, setRythmeEdit] = useState(""); // matinal/noctambule/flexible
  const [propreteEdit, setPropreteEdit] = useState(""); // relaxe/normal/maniaque
  const [sportifEdit, setSportifEdit] = useState(false);
  const [vegetarienEdit, setVegetarienEdit] = useState(false);
  const [soireesEdit, setSoireesEdit] = useState(false);
  const [musiqueEdit, setMusiqueEdit] = useState("");

  // NOUVEAU: modal “Changer propriétaire”
  const [bulkOwnerOpen, setBulkOwnerOpen] = useState(false);
  const [bulkOwnerInput, setBulkOwnerInput] = useState("");

  // NOUVEAU: état pour la création de profils d’exemple
  const [seedingColocs, setSeedingColocs] = useState(false);

  // NOUVEAU: état pour modal de détails profil coloc
  const [colocDetailOpen, setColocDetailOpen] = useState(false);
  const [colocDetailLoading, setColocDetailLoading] = useState(false);
  const [colocDetail, setColocDetail] = useState<any | null>(null);

  const { isAdmin, checkingAdmin } = useAdminGate({ user, loading, router });

  const showToast = (type: "success" | "error", message: string) => {
    // Toaster global
    appToast[type](message);
  };

  // Utilitaire: formatage robuste d’un champ createdAt (Timestamp/Date/number/string)
  const formatCreatedAt = (v: any) => {
    if (!v) return "-";
    try {
      // Timestamp Firestore avec toDate()
      if (v && typeof v.toDate === "function") return v.toDate().toLocaleString();
      // Timestamp Firestore brut { seconds, nanoseconds }
      if (v?.seconds) return new Date(v.seconds * 1000).toLocaleString();
      // Nombre (ms)
      if (typeof v === "number") return new Date(v).toLocaleString();
      // String/Date
      const d = new Date(v);
      return isNaN(d.getTime()) ? "-" : d.toLocaleString();
    } catch {
      return "-";
    }
  };

  const seedExamples = async () => {
    if (seeding) return;
    setSeeding(true);
    try {
  // TODO: Implémenter via API Prisma si nécessaire
  showToast("success", "Action temporairement désactivée.");
    } finally {
      setSeeding(false);
    }
  };

  // NOUVEAU: créer des profils colocataires d’exemple
  const seedColocExamples = async () => {
    if (seedingColocs) return;
    setSeedingColocs(true);
    try {
  // TODO: Implémenter via API Prisma si nécessaire
  showToast("success", "Action temporairement désactivée.");
    } finally {
      setSeedingColocs(false);
    }
  };

  // Chargement des annonces
  useEffect(() => {
    if (activeTab !== "annonces") return;
    let stop = false;
    const load = async () => {
      try {
        const res = await fetch("/api/annonces?limit=200", { cache: "no-store" });
        if (!res.ok) throw new Error("annonces fetch failed");
        const items = await res.json();
        // assurer la compat UI
        const mapped = (Array.isArray(items) ? items : []).map((a: any) => ({ ...a, titre: a.titre ?? a.title ?? "" }));
        if (!stop) setAdminAnnonces(mapped);
      } catch (e) {
        if (!stop) setAdminAnnonces([]);
      }
    };
    load();
    return () => { stop = true; };
  }, [activeTab]);

  // NOUVEAU: Abonnement temps réel aux utilisateurs pour résoudre les propriétaires
  useEffect(() => {
    if (activeTab !== "annonces") return;
  setOwnersById({});
  }, [activeTab]);

  // Chargement des profils colocataires
  useEffect(() => {
    if (activeTab !== "colocs") return;
    let stop = false;
    const load = async () => {
      try {
        const items = await listColoc({ limit: 200 });
        if (!stop) setAdminColocs(items);
      } catch (e) {
        if (!stop) setAdminColocs([]);
      }
    };
    load();
    return () => { stop = true; };
  }, [activeTab]);

  const toggleAdminSelect = (id: string) => {
    setAdminSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };
  const adminSelectAll = () => setAdminSelected(adminAnnonces.map(a => a.id));
  const adminDeselectAll = () => setAdminSelected([]);

  // NOUVEAU: sélection pour profils colocataires
  const toggleColocSelect = (id: string) => {
    setAdminColocsSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };
  const colocsSelectAll = () => setAdminColocsSelected(adminColocs.map(p => p.id));
  const colocsDeselectAll = () => setAdminColocsSelected([]);

  // Helper: résoudre un userId depuis un email ou un id donné
  // const _resolveUserIdByEmailOrId = async (_raw: string): Promise<string | null> => null; // à implémenter plus tard

  const adminBulkDelete = async (ids?: string[]) => {
    const toDelete = Array.isArray(ids) && ids.length ? ids : adminSelected;
    if (toDelete.length === 0) return;
    try {
      setAdminLoading(true);
      // Appeler /api/annonces/{id} DELETE en boucle
      for (const id of toDelete) {
        try { await deleteAnnonce(id); } catch {}
      }
      setAdminSelected([]);
      showToast("success", "Annonces supprimées ✅");
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
  const targetUserId = null; // TODO: lookup via API
      if (!targetUserId) {
        setAdminLoading(false);
        return showToast("error", "Utilisateur introuvable (email ou ID).");
      }
  const updatedCount = adminSelected.length; // TODO: PATCH via API (non implémenté côté backend)
      setBulkOwnerOpen(false);
      setBulkOwnerInput("");
      setAdminSelected([]);
      showToast("success", `Propriétaire mis à jour pour ${updatedCount} annonce(s) ✅`);
  // TODO: refresh via fetch
    } catch (e) {
      console.error("[Admin][BulkOwnerChange]", e);
      showToast("error", "Erreur lors du changement de propriétaire.");
    } finally {
      setAdminLoading(false);
    }
  };

  // NOUVEAU: suppression multiple profils
  const colocsBulkDelete = async (ids?: string[]) => {
    const toDelete = Array.isArray(ids) && ids.length ? ids : adminColocsSelected;
    if (toDelete.length === 0) return;
    try {
      setAdminLoading(true);
      // Supprimer via API en boucle
      for (const id of toDelete) {
        try { await deleteColoc(id); } catch {}
      }
      setAdminColocsSelected([]);
      showToast("success", "Profils supprimés ✅");
    } catch (e) {
      console.error("[Admin][ColocsBulkDelete]", e);
      showToast("error", "Erreur suppression des profils.");
    } finally {
      setAdminLoading(false);
    }
  };

  // NOUVEAU: ouvrir la modale d’édition profil
  const openColocModal = (p: any) => {
    setEditColoc(p);
    setColocNomEdit(p?.nom || "");
    setColocVilleEdit(p?.ville || "");
    setColocBudgetEdit(typeof p?.budget === "number" ? String(p.budget) : "");
  setColocMainUrlEdit(p?.imageUrl || "");
    setColocDescriptionEdit(p?.description || "");
    setColocAgeEdit(typeof p?.age === "number" ? String(p.age) : "");
    setColocProfessionEdit(p?.profession || "");
    setColocTelephoneEdit(p?.telephone || "");
    setColocDateDispoEdit(p?.dateDispo || "");
    // Nouveaux champs
    setColocGenreEdit(p?.genre || "");
    setColocOrientationEdit(p?.orientation || "");
    setColocBioCourteEdit(p?.bioCourte || "");
    setColocLanguesEdit(Array.isArray(p?.langues) ? p.langues.join(", ") : (p?.langues || ""));
    setColocInstagramEdit(p?.instagram || "");
    setColocPhotosCsvEdit(Array.isArray(p?.photos) ? p.photos.join(", ") : (p?.photos || ""));
    setPrefGenreEdit(p?.prefGenre || "");
    setPrefAgeMinEdit(typeof p?.prefAgeMin === "number" ? String(p.prefAgeMin) : "");
    setPrefAgeMaxEdit(typeof p?.prefAgeMax === "number" ? String(p.prefAgeMax) : "");
    setAccepteFumeursEdit(!!p?.accepteFumeurs);
    setAccepteAnimauxEdit(!!p?.accepteAnimaux);
    setRythmeEdit(p?.rythme || "");
    setPropreteEdit(p?.proprete || "");
    setSportifEdit(!!p?.sportif);
    setVegetarienEdit(!!p?.vegetarien);
    setSoireesEdit(!!p?.soirees);
    setMusiqueEdit(p?.musique || "");
    setColocModalOpen(true);
  };

  // NOUVEAU: ouvrir/fermer le détail d’un profil coloc
  const openColocDetail = async (_id: string) => {
    try {
      setColocDetailOpen(true);
      setColocDetailLoading(true);
      setColocDetail(null);
  const detail = await getColoc(_id);
  setColocDetail(detail);
    } catch (e) {
      console.error("[Admin][ColocDetail] load error", e);
      setColocDetail(null);
    } finally {
      setColocDetailLoading(false);
    }
  };
  const closeColocDetail = () => {
    setColocDetailOpen(false);
    setColocDetail(null);
    setColocDetailLoading(false);
  };

  // NOUVEAU: enregistrer un profil (modale)
  const saveColocEdit = async () => {
    if (!editColoc) return;
    try {
      const payload: any = {
        nom: colocNomEdit,
        ville: colocVilleEdit,
        budget: colocBudgetEdit ? Number(colocBudgetEdit) : null,
  imageUrl: colocMainUrlEdit,
        description: colocDescriptionEdit,
        age: colocAgeEdit ? Number(colocAgeEdit) : null,
        profession: colocProfessionEdit,
        telephone: colocTelephoneEdit,
        dateDispo: colocDateDispoEdit,
        // Nouveaux champs
        genre: colocGenreEdit || undefined,
        orientation: colocOrientationEdit || undefined,
        bioCourte: colocBioCourteEdit || undefined,
        langues: colocLanguesEdit
          ? colocLanguesEdit.split(",").map(s => s.trim()).filter(Boolean)
          : undefined,
  instagram: colocInstagramEdit || undefined,
  // photos stored via uploader/metadata instead of CSV
  photos: undefined,
  prefGenre: prefGenreEdit || undefined,
        prefAgeMin: prefAgeMinEdit ? Number(prefAgeMinEdit) : undefined,
        prefAgeMax: prefAgeMaxEdit ? Number(prefAgeMaxEdit) : undefined,
        accepteFumeurs: !!accepteFumeursEdit,
        accepteAnimaux: !!accepteAnimauxEdit,
        rythme: rythmeEdit || undefined,
        proprete: propreteEdit || undefined,
        sportif: !!sportifEdit,
        vegetarien: !!vegetarienEdit,
        soirees: !!soireesEdit,
        musique: musiqueEdit || undefined,
        updatedAt: serverTimestamp(),
      };
      Object.keys(payload).forEach((k) => {
        const v = payload[k];
        if (
          v === undefined ||
          v === "" ||
          v === null ||
          (Array.isArray(v) && v.length === 0)
        ) {
          delete payload[k];
        }
      });
  await updateColoc(editColoc.id, payload);
  showToast("success", "Profil modifié ✅");
      setColocModalOpen(false);
      setEditColoc(null);
    } catch (e) {
      console.error("[Admin][SaveColoc]", e);
      showToast("error", "Erreur lors de la mise à jour du profil.");
    }
  };

  // Migration "colocataires" -> "colocProfiles"
  const _adminMigrateColocatairesToProfiles = async () => {
    try {
      setAdminLoading(true);
      // Tente d'abord une lecture en liste (peut être interdite par les règles)
  const legacyDocs: { id: string; data: any }[] = [];
  // Firebase supprimé: skip

      if (legacyDocs.length === 0) {
        showToast("success", "Aucun document à migrer depuis 'colocataires'.");
        return;
      }

      // Enrichissement: map des users pour récupérer email/displayName si manquants
      const usersMap: Record<string, { email?: string; displayName?: string }> = {};
  // TODO: charger via /api/users

  // const _chunks2 = <T,>(arr: T[], size = 400) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

  const _mapLegacyToNew = (d: any, id: string) => {
        const userHint = usersMap[id] || {};
        const email = d?.email || userHint.email || null;
        const displayName = userHint.displayName || "";
        const interets = Array.isArray(d?.interets) ? d.interets : [];
       // Normalisations CSV -> tableaux
       const toArray = (v: any) =>
         Array.isArray(v) ? v
         : typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean)
         : [];
        return {
          uid: d?.uid || id,
          email,
          nom: d?.nom || d?.name || displayName || "",
          ville: d?.ville || "",
          budget: typeof d?.budget === "number" ? d.budget : null,
          imageUrl: d?.imageUrl || d?.photoUrl || d?.photo || "",
          description: d?.description || d?.bio || "",
          age: typeof d?.age === "number" ? d.age : null,
          profession: d?.profession || d?.job || "",
          telephone: d?.telephone || d?.phone || "",
          dateDispo: d?.dateDispo || d?.disponibilite || "",
          codePostal: d?.codePostal || d?.cp || undefined,
          // Champs existants
          fumeur: typeof d?.fumeur === "boolean" ? d.fumeur : (d?.fumeur ? true : false),
          animaux: typeof d?.animaux === "boolean" ? d.animaux : (d?.animaux ? true : false),
          quartiers: d?.quartiers || "",
          interets,
          zones: Array.isArray(d?.zones) ? d.zones : [],
          communesSlugs: Array.isArray(d?.communesSlugs) ? d.communesSlugs : [],
         // Nouveaux champs "type Tinder" (si présents dans legacy)
         genre: d?.genre || undefined,
         orientation: d?.orientation || undefined,
         bioCourte: d?.bioCourte || undefined,
         langues: toArray(d?.langues),
         instagram: d?.instagram || undefined,
         photos: toArray(d?.photos),
         prefGenre: d?.prefGenre || undefined,
         prefAgeMin: typeof d?.prefAgeMin === "number" ? d.prefAgeMin : undefined,
         prefAgeMax: typeof d?.prefAgeMax === "number" ? d.prefAgeMax : undefined,
         accepteFumeurs: typeof d?.accepteFumeurs === "boolean" ? d.accepteFumeurs : undefined,
         accepteAnimaux: typeof d?.accepteAnimaux === "boolean" ? d.accepteAnimaux : undefined,
         rythme: d?.rythme || undefined,
         proprete: d?.proprete || undefined,
         sportif: typeof d?.sportif === "boolean" ? d.sportif : undefined,
         vegetarien: typeof d?.vegetarien === "boolean" ? d.vegetarien : undefined,
         soirees: typeof d?.soirees === "boolean" ? d.soirees : undefined,
         musique: d?.musique || undefined,
          ...(d?.createdAt ? { createdAt: d.createdAt } : { createdAt: serverTimestamp() }),
          updatedAt: serverTimestamp(),
        };
      };

  const migrated = 0;
  // TODO: POST vers /api/coloc

      showToast("success", `Migration terminée: ${migrated} profil(s) migré(s) ✅`);
    } catch (e) {
      console.error("[Admin][MigrateColocataires]", e);
      showToast("error", "Erreur lors de la migration des profils.");
    } finally {
      setAdminLoading(false);
    }
  };

  // Hoisted: tri mémorisé (doit être appelé à chaque rendu, même lors des écrans de chargement)
  const sortedAdminAnnonces = useMemo(() => {
    const arr = [...adminAnnonces];
    const getTime = (v: any) => {
      try {
        if (v && typeof v.toDate === "function") return v.toDate().getTime();
        if (v?.seconds) return v.seconds * 1000;
        if (typeof v === "number") return v;
        const d = new Date(v);
        return isNaN(d.getTime()) ? 0 : d.getTime();
      } catch { return 0; }
    };
    const getOwner = (a: any) => {
      const uid = a.ownerId || a.uid;
      const owner = ownersById[uid || ""] || {};
      return (owner.displayName || owner.email || uid || "").toString().toLowerCase();
    };
    arr.sort((a: any, b: any) => {
      const dirMul = annoncesSort.dir === "asc" ? 1 : -1;
      let va: any, vb: any;
      switch (annoncesSort.key) {
        case "titre": va = (a.titre || "").toString().toLowerCase(); vb = (b.titre || "").toString().toLowerCase(); break;
        case "ville": va = (a.ville || "").toString().toLowerCase(); vb = (b.ville || "").toString().toLowerCase(); break;
        case "prix": va = Number.isFinite(a.prix) ? a.prix : -Infinity; vb = Number.isFinite(b.prix) ? b.prix : -Infinity; break;
        case "owner": va = getOwner(a); vb = getOwner(b); break;
        default: va = getTime(a.createdAt); vb = getTime(b.createdAt);
      }
      if (va < vb) return -1 * dirMul;
      if (va > vb) return 1 * dirMul;
      return 0;
    });
    return arr;
  }, [adminAnnonces, annoncesSort, ownersById]);

  const sortedAdminColocs = useMemo(() => {
    const arr = [...adminColocs];
    const getTime = (v: any) => {
      try {
        if (v && typeof v.toDate === "function") return v.toDate().getTime();
        if (v?.seconds) return v.seconds * 1000;
        if (typeof v === "number") return v;
        const d = new Date(v);
        return isNaN(d.getTime()) ? 0 : d.getTime();
      } catch { return 0; }
    };
    arr.sort((a: any, b: any) => {
      const dirMul = colocsSort.dir === "asc" ? 1 : -1;
      let va: any, vb: any;
      switch (colocsSort.key) {
        case "nom": va = (a.nom || "").toString().toLowerCase(); vb = (b.nom || "").toString().toLowerCase(); break;
        case "ville": va = (a.ville || "").toString().toLowerCase(); vb = (b.ville || "").toString().toLowerCase(); break;
        case "zones": va = Array.isArray(a.zones) ? a.zones.length : 0; vb = Array.isArray(b.zones) ? b.zones.length : 0; break;
        case "budget": va = Number.isFinite(a.budget) ? a.budget : -Infinity; vb = Number.isFinite(b.budget) ? b.budget : -Infinity; break;
        case "email": va = (a.email || "").toString().toLowerCase(); vb = (b.email || "").toString().toLowerCase(); break;
        default: va = getTime(a.createdAt); vb = getTime(b.createdAt);
      }
      if (va < vb) return -1 * dirMul;
      if (va > vb) return 1 * dirMul;
      return 0;
    });
    return arr;
  }, [adminColocs, colocsSort]);

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
  const allColocsSelected = adminColocs.length > 0 && adminColocsSelected.length === adminColocs.length;


  const renderTab = () => {
    if (activeTab === "annonces") {

      const toggleSortAnnonces = (key: typeof annoncesSort.key) => {
        setAnnoncesSort(prev => prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });
      };
      const sortIcon = (key: typeof annoncesSort.key) => annoncesSort.key !== key ? "↕" : annoncesSort.dir === "asc" ? "▲" : "▼";
      return (
        <>
          {/* Barre d’actions + table annonces */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-extrabold text-blue-800 tracking-tight">
              Administration
            </h1>
            {activeTab === "annonces" && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={seedExamples}
                  disabled={seeding}
                  className="bg-emerald-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-60"
                  title="Créer une annonce d’exemple pour chaque commune"
                >
                  {seeding ? "Création..." : "Créer annonces d’exemple"}
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Barre d’actions */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {/* ...existing master checkbox + select/deselect all... */}
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => (allSelected ? adminDeselectAll() : adminSelectAll())}
                  className="w-4 h-4 appearance-none rounded-full border border-slate-400 bg-white bg-center bg-no-repeat checked:bg-blue-600 checked:border-blue-600 checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22white%22 stroke-width=%222.25%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M3.5 8.5 L6.5 11.5 L12.5 4.5%22/></svg>')] checked:bg-[length:0.85rem_0.85rem] transition-colors"
                />
                <span className="text-sm text-slate-700">Tout ({adminAnnonces.length})</span>
              </label>
              <button type="button" onClick={adminSelectAll} disabled={adminAnnonces.length === 0} className="border px-3 py-1.5 text-sm rounded hover:bg-slate-50 disabled:opacity-60">Tout sélectionner</button>
              <button type="button" onClick={adminDeselectAll} disabled={adminSelected.length === 0} className="border px-3 py-1.5 text-sm rounded hover:bg-slate-50 disabled:opacity-60">Tout désélectionner</button>
              <button type="button" onClick={() => adminBulkDelete()} disabled={adminSelected.length === 0 || adminLoading} className="bg-rose-600 text-white px-3 py-1.5 text-sm rounded hover:bg-rose-700 disabled:opacity-60">
                {adminLoading ? "Suppression..." : `Supprimer la sélection (${adminSelected.length})`}
              </button>
              {/* NOUVEAU: bouton changer propriétaire */}
              <button
                type="button"
                onClick={() => setBulkOwnerOpen(true)}
                disabled={adminSelected.length === 0 || adminLoading}
                className="bg-amber-600 text-white px-3 py-1.5 text-sm rounded hover:bg-amber-700 disabled:opacity-60"
              >
                Changer propriétaire ({adminSelected.length})
              </button>
            </div>

            {/* Liste en temps réel avec colonne Propriétaire */}
            {adminAnnonces.length === 0 ? (
              <p className="text-slate-500">Aucune annonce à afficher.</p>
            ) : (
              <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm mt-4">
                <table className="w-full text-[15px]">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="py-2 px-3 w-12 text-center select-none cursor-default" aria-label="Sélection"></th>
                      <th className="py-2 px-3 text-left cursor-pointer select-none" onClick={() => toggleSortAnnonces("titre")}>Titre <span className="text-xs opacity-60">{sortIcon("titre")}</span></th>
                      <th className="py-2 px-3 text-left cursor-pointer select-none" onClick={() => toggleSortAnnonces("ville")}>Ville <span className="text-xs opacity-60">{sortIcon("ville")}</span></th>
                      <th className="py-2 px-3 text-left cursor-pointer select-none" onClick={() => toggleSortAnnonces("prix")}>Prix <span className="text-xs opacity-60">{sortIcon("prix")}</span></th>
                      <th className="py-2 px-3 text-left">Description (court)</th>
                      <th className="py-2 px-3 text-left cursor-pointer select-none" onClick={() => toggleSortAnnonces("owner")}>Propriétaire <span className="text-xs opacity-60">{sortIcon("owner")}</span></th>
                      <th className="py-2 px-3 text-left cursor-pointer select-none" onClick={() => toggleSortAnnonces("createdAt")}>Créé le <span className="text-xs opacity-60">{sortIcon("createdAt")}</span></th>
                      <th className="py-2 px-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="[&>tr:nth-child(even)]:bg-slate-50/50">
                    {sortedAdminAnnonces.map((a) => {
                      const uid = a.ownerId || a.uid;
                      const owner = ownersById[uid || ""] || {};
                      const ownerLabel = owner.displayName || owner.email || uid || "-";
                      const shortDesc =
                        (a.description || "").toString().slice(0, 160) +
                        ((a.description || "").length > 160 ? "…" : "");
                      return (
                        <tr
                          key={a.id}
                          className="hover:bg-blue-50/50 transition cursor-pointer"
                          onClick={() => { setEditAnnonce(a); setModalOpen(true); }}
                        >
                          <td
                            className="py-2 px-3 w-12 text-center select-none cursor-default"
                            onClick={(e) => { e.stopPropagation(); }}
                            onMouseDown={(e) => { e.stopPropagation(); }}
                            onDoubleClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                            onKeyDown={(e) => { e.stopPropagation(); }}
                          >
                            <div className="inline-flex items-center justify-center p-2">
                              <input
                                type="checkbox"
                                checked={adminSelected.includes(a.id)}
                                onChange={() => toggleAdminSelect(a.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 appearance-none rounded-full border border-slate-400 bg-white bg-center bg-no-repeat checked:bg-blue-600 checked:border-blue-600 checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22white%22 stroke-width=%222.25%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M3.5 8.5 L6.5 11.5 L12.5 4.5%22/></svg>')] checked:bg-[length:0.85rem_0.85rem] transition-colors"
                              />
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <Link
                              href={`/annonce/${a.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                              title="Ouvrir la fiche annonce dans un nouvel onglet"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {a.titre || "(sans titre)"}
                            </Link>
                          </td>
                          <td className="py-2 px-3">{a.ville || "-"}</td>
                          <td className="py-2 px-3">{typeof a.prix === "number" ? `${a.prix} €` : "-"}</td>
                          <td className="py-2 px-3 max-w-[560px] whitespace-normal">
                            {shortDesc}
                          </td>
                          <td className="py-2 px-3">{ownerLabel}</td>
                          <td className="py-2 px-3">{formatCreatedAt(a.createdAt)}</td>
                          <td className="py-2 px-3 flex items-center gap-2">
                            <button
                              type="button"
                              title="Modifier"
                              aria-label="Modifier"
                              onClick={(e) => { e.stopPropagation(); setEditAnnonce(a); setModalOpen(true); }}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-600 text-white hover:bg-slate-700"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              title="Supprimer"
                              aria-label="Supprimer"
                              onClick={(e) => { e.stopPropagation(); adminBulkDelete([a.id]); }}
                              disabled={adminLoading}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                            >
                              🗑️
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
              onSubmit={async ({ titre, ville, prix, imageUrl, surface, nbChambres, equipements, description, photos }) => {
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
                    ...(Array.isArray(photos) && photos.length ? { photos } : {}),
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
              <div
                className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
                onMouseDown={(e) => { if (e.target === e.currentTarget) { setBulkOwnerOpen(false); setBulkOwnerInput(""); } }}
              >
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
                      className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-700"
                      onClick={() => { setBulkOwnerOpen(false); setBulkOwnerInput(""); }}
                      disabled={adminLoading}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                      onClick={performBulkOwnerChange}
                      disabled={!bulkOwnerInput.trim() || adminLoading}
                    >
                      Confirmer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      );
    }
  if (activeTab === "colocs") {

      const toggleSortColocs = (key: typeof colocsSort.key) => {
        setColocsSort(prev => prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });
      };
      const sortIcon2 = (key: typeof colocsSort.key) => colocsSort.key !== key ? "↕" : colocsSort.dir === "asc" ? "▲" : "▼";
      return (
        <>
          {/* Barre d’actions profils + table */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={allColocsSelected}
                onChange={() => (allColocsSelected ? colocsDeselectAll() : colocsSelectAll())}
                className="w-4 h-4 appearance-none rounded-full border border-slate-400 bg-white bg-center bg-no-repeat checked:bg-blue-600 checked:border-blue-600 checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22white%22 stroke-width=%222.25%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M3.5 8.5 L6.5 11.5 L12.5 4.5%22/></svg>')] checked:bg-[length:0.85rem_0.85rem] transition-colors"
              />
              <span className="text-sm text-slate-700">Tout ({adminColocs.length})</span>
            </label>
            <button type="button" onClick={colocsSelectAll} disabled={adminColocs.length === 0} className="border px-3 py-1.5 text-sm rounded hover:bg-slate-50 disabled:opacity-60">Tout sélectionner</button>
            <button type="button" onClick={colocsDeselectAll} disabled={adminColocsSelected.length === 0} className="border px-3 py-1.5 text-sm rounded hover:bg-slate-50 disabled:opacity-60">Tout désélectionner</button>
            <button
              type="button"
              onClick={() => colocsBulkDelete()}
              disabled={adminColocsSelected.length === 0 || adminLoading}
              className="bg-rose-600 text-white px-3 py-1.5 text-sm rounded hover:bg-rose-700 disabled:opacity-60"
            >
              {adminLoading ? "Suppression..." : `Supprimer la sélection (${adminColocsSelected.length})`}
            </button>
            <button
              type="button"
              onClick={seedColocExamples}
              disabled={seedingColocs}
              className="bg-emerald-600 text-white px-3 py-1.5 text-sm rounded hover:bg-emerald-700 disabled:opacity-60"
            >
              {seedingColocs ? "Création..." : "Créer profils d’exemple"}
            </button>
          </div>

          {/* Liste profils */}
          <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm mt-4">
            <table className="w-full text-[15px]">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="py-2 px-3 w-12 text-center select-none cursor-default" aria-label="Sélection"></th>
                  <th className="py-2 px-3 text-left cursor-pointer select-none" onClick={() => toggleSortColocs("nom")}>Nom <span className="text-xs opacity-60">{sortIcon2("nom")}</span></th>
                  <th className="py-2 px-3 text-left cursor-pointer select-none" onClick={() => toggleSortColocs("ville")}>Ville <span className="text-xs opacity-60">{sortIcon2("ville")}</span></th>
                  <th className="py-2 px-3 text-left cursor-pointer select-none" onClick={() => toggleSortColocs("zones")}>Zone recherchée(s) <span className="text-xs opacity-60">{sortIcon2("zones")}</span></th>
                  <th className="py-2 px-3 text-left cursor-pointer select-none" onClick={() => toggleSortColocs("budget")}>Budget <span className="text-xs opacity-60">{sortIcon2("budget")}</span></th>
                  <th className="py-2 px-3 text-left">Description (court)</th>
                  <th className="py-2 px-3 text-left cursor-pointer select-none" onClick={() => toggleSortColocs("email")}>Email <span className="text-xs opacity-60">{sortIcon2("email")}</span></th>
                  <th className="py-2 px-3 text-left cursor-pointer select-none" onClick={() => toggleSortColocs("createdAt")}>Créé le <span className="text-xs opacity-60">{sortIcon2("createdAt")}</span></th>
                  <th className="py-2 px-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="[&>tr:nth-child(even)]:bg-slate-50/50">
                {sortedAdminColocs.map((p) => {
                  const shortDesc = (p.description || "").toString().slice(0, 160) + ((p.description || "").length > 160 ? "…" : "");
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-blue-50/50 transition cursor-pointer"
                      onClick={() => openColocDetail(p.id)}
                    >
                      <td
                        className="py-2 px-3 w-12 text-center select-none cursor-default"
                        onClick={(e) => { e.stopPropagation(); }}
                        onMouseDown={(e) => { e.stopPropagation(); }}
                        onDoubleClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                        onKeyDown={(e) => { e.stopPropagation(); }}
                      >
                        <div className="inline-flex items-center justify-center p-2">
                          <input
                            type="checkbox"
                            checked={adminColocsSelected.includes(p.id)}
                            onChange={() => toggleColocSelect(p.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 appearance-none rounded-full border border-slate-400 bg-white bg-center bg-no-repeat checked:bg-blue-600 checked:border-blue-600 checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22white%22 stroke-width=%222.25%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M3.5 8.5 L6.5 11.5 L12.5 4.5%22/></svg>')] checked:bg-[length:0.85rem_0.85rem] transition-colors"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3">{p.nom || "(sans nom)"}</td>
                      <td className="py-2 px-3">{p.ville || "-"}</td>
                      <td className="py-2 px-3">
                        {Array.isArray(p.zones) && p.zones.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[320px]">
                            {p.zones.slice(0, 2).map((z: string) => (
                              <span key={z} className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">{z}</span>
                            ))}
                            {p.zones.length > 2 && (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-slate-50 text-slate-700 border border-slate-200">+{p.zones.length - 2}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-2 px-3">{typeof p.budget === "number" ? `${p.budget} €` : "-"}</td>
                      <td className="py-2 px-3 max-w-[560px] whitespace-normal">{shortDesc}</td>
                      <td className="py-2 px-3">{p.email || "-"}</td>
                      <td className="py-2 px-3">{formatCreatedAt(p.createdAt)}</td>
                      <td className="py-2 px-3 flex items-center gap-2">
                        <button
                          type="button"
                          title="Modifier"
                          aria-label="Modifier"
                          onClick={(e) => { e.stopPropagation(); openColocModal(p); }}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-600 text-white hover:bg-slate-700"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          title="Supprimer"
                          aria-label="Supprimer"
                          onClick={(e) => { e.stopPropagation(); colocsBulkDelete([p.id]); }}
                          disabled={adminLoading}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Modale édition profil colocataire */}
          {colocModalOpen && (
            <div
              className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto"
              onMouseDown={(e) => { if (e.target === e.currentTarget) { setColocModalOpen(false); setEditColoc(null); } }}
            >
              <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
                <h3 className="text-lg font-semibold mb-3">Modifier le profil</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input className="border rounded px-3 py-2" placeholder="Nom" value={colocNomEdit} onChange={(e) => setColocNomEdit(e.target.value)} />
                  <input className="border rounded px-3 py-2" placeholder="Ville" value={colocVilleEdit} onChange={(e) => setColocVilleEdit(e.target.value)} />
                  <input className="border rounded px-3 py-2" placeholder="Budget (€)" type="number" value={colocBudgetEdit} onChange={(e) => setColocBudgetEdit(e.target.value)} />
                  <input className="border rounded px-3 py-2" placeholder="Âge" type="number" value={colocAgeEdit} onChange={(e) => setColocAgeEdit(e.target.value)} />
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1">Photos</label>
                    <ColocPhotoSection
                      initialCsv={colocPhotosCsvEdit}
                      initialMain={colocMainUrlEdit}
                      onUpdate={(csv: string, main: string | undefined) => {
                        setColocPhotosCsvEdit(csv);
                        if (main) setColocMainUrlEdit(main);
                      }}
                    />
                  </div>
                  <input className="border rounded px-3 py-2" placeholder="Profession" value={colocProfessionEdit} onChange={(e) => setColocProfessionEdit(e.target.value)} />
                  <input className="border rounded px-3 py-2" placeholder="Téléphone" value={colocTelephoneEdit} onChange={(e) => setColocTelephoneEdit(e.target.value)} />
                  <input className="border rounded px-3 py-2" placeholder="Disponibilité (YYYY-MM-DD)" value={colocDateDispoEdit} onChange={(e) => setColocDateDispoEdit(e.target.value)} />
                  <select className="border rounded px-3 py-2" value={colocGenreEdit} onChange={e=>setColocGenreEdit(e.target.value)}>
                    <option value="">Genre</option>
                    <option value="femme">Femme</option>
                    <option value="homme">Homme</option>
                    <option value="non-binaire">Non-binaire</option>
                    <option value="autre">Autre</option>
                  </select>
                  <select className="border rounded px-3 py-2" value={colocOrientationEdit} onChange={e=>setColocOrientationEdit(e.target.value)}>
                    <option value="">Orientation</option>
                    <option value="hetero">Hétéro</option>
                    <option value="homo">Homo</option>
                    <option value="bi">Bi</option>
                    <option value="asexuel">Asexuel</option>
                    <option value="autre">Autre</option>
                  </select>
                  <input className="border rounded px-3 py-2 sm:col-span-2" placeholder="Bio courte" value={colocBioCourteEdit} onChange={e=>setColocBioCourteEdit(e.target.value)} />
                  <input className="border rounded px-3 py-2 sm:col-span-2" placeholder="Langues (CSV, ex: fr,en,es)" value={colocLanguesEdit} onChange={e=>setColocLanguesEdit(e.target.value)} />
                  <input className="border rounded px-3 py-2" placeholder="Instagram (@handle)" value={colocInstagramEdit} onChange={e=>setColocInstagramEdit(e.target.value)} />
                  {/* Photos preview/CSV UI removed; managed by ColocPhotoSection above */}
                  <select className="border rounded px-3 py-2" value={prefGenreEdit} onChange={e=>setPrefGenreEdit(e.target.value)}>
                    <option value="">Préférence colloc (genre)</option>
                    <option value="femme">Femme</option>
                    <option value="homme">Homme</option>
                    <option value="mixte">Mixte</option>
                    <option value="peu-importe">Peu importe</option>
                  </select>
                  <input className="border rounded px-3 py-2" placeholder="Âge min" type="number" value={prefAgeMinEdit} onChange={e=>setPrefAgeMinEdit(e.target.value)} />
                  <input className="border rounded px-3 py-2" placeholder="Âge max" type="number" value={prefAgeMaxEdit} onChange={e=>setPrefAgeMaxEdit(e.target.value)} />
                  <label className="inline-flex items-center gap-2"><input type="checkbox" className="w-4 h-4 appearance-none rounded-full border border-slate-400 bg-white bg-center bg-no-repeat checked:bg-blue-600 checked:border-blue-600 checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22white%22 stroke-width=%222.25%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M3.5 8.5 L6.5 11.5 L12.5 4.5%22/></svg>')] checked:bg-[length:0.85rem_0.85rem] transition-colors" checked={accepteFumeursEdit} onChange={e=>setAccepteFumeursEdit(e.target.checked)} />Accepte fumeurs</label>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" className="w-4 h-4 appearance-none rounded-full border border-slate-400 bg-white bg-center bg-no-repeat checked:bg-blue-600 checked:border-blue-600 checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22white%22 stroke-width=%222.25%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M3.5 8.5 L6.5 11.5 L12.5 4.5%22/></svg>')] checked:bg-[length:0.85rem_0.85rem] transition-colors" checked={accepteAnimauxEdit} onChange={e=>setAccepteAnimauxEdit(e.target.checked)} />Accepte animaux</label>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" className="w-4 h-4 appearance-none rounded-full border border-slate-400 bg-white bg-center bg-no-repeat checked:bg-blue-600 checked:border-blue-600 checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22white%22 stroke-width=%222.25%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M3.5 8.5 L6.5 11.5 L12.5 4.5%22/></svg>')] checked:bg-[length:0.85rem_0.85rem] transition-colors" checked={sportifEdit} onChange={e=>setSportifEdit(e.target.checked)} />Sportif</label>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" className="w-4 h-4 appearance-none rounded-full border border-slate-400 bg-white bg-center bg-no-repeat checked:bg-blue-600 checked:border-blue-600 checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22white%22 stroke-width=%222.25%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M3.5 8.5 L6.5 11.5 L12.5 4.5%22/></svg>')] checked:bg-[length:0.85rem_0.85rem] transition-colors" checked={vegetarienEdit} onChange={e=>setVegetarienEdit(e.target.checked)} />Végétarien</label>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" className="w-4 h-4 appearance-none rounded-full border border-slate-400 bg-white bg-center bg-no-repeat checked:bg-blue-600 checked:border-blue-600 checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22white%22 stroke-width=%222.25%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M3.5 8.5 L6.5 11.5 L12.5 4.5%22/></svg>')] checked:bg-[length:0.85rem_0.85rem] transition-colors" checked={soireesEdit} onChange={e=>setSoireesEdit(e.target.checked)} />Aime les soirées</label>
                  <input className="border rounded px-3 py-2 sm:col-span-2" placeholder="Musique (artistes, genres…)" value={musiqueEdit} onChange={e=>setMusiqueEdit(e.target.value)} />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-700" onClick={() => { setColocModalOpen(false); setEditColoc(null); }} disabled={adminLoading}>Annuler</button>
                  <button className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60" onClick={saveColocEdit} disabled={adminLoading}>Enregistrer</button>
                </div>
              </div>
            </div>
          )}

          {/* NOUVEAU: Modal détail profil colocataire (même rendu que la Home) */}
          {colocDetailOpen && (
            <div
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
              onMouseDown={(e) => { if (e.target === e.currentTarget) closeColocDetail(); }}
            >
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
                <button
                  onClick={closeColocDetail}
                  className="absolute top-3 right-3 text-slate-600 hover:text-slate-900"
                  aria-label="Fermer"
                >
                  ✖
                </button>
                <h3 className="text-xl font-semibold mb-4">Profil colocataire</h3>
                {colocDetailLoading ? (
                  <p className="text-slate-600">Chargement…</p>
                ) : !colocDetail ? (
                  <p className="text-slate-600">Profil introuvable.</p>
                ) : (
                  <div className="flex flex-col gap-5">
                    {/* En-tête avec image et infos principales */}
                    <div className="flex gap-4 items-start">
                      <div className="flex-shrink-0 w-28 h-28 rounded-lg overflow-hidden bg-gray-100">
                        <ExpandableImage src={colocDetail.imageUrl || "/images/coloc-holder.svg"} images={Array.isArray(colocDetail.photos) && colocDetail.photos.length ? colocDetail.photos : (colocDetail.imageUrl ? [colocDetail.imageUrl] : ["/images/coloc-holder.svg"])} className="w-full h-full object-cover" alt={colocDetail.nom || "Profil"} />
                      </div>
                      <div className="flex-1">
                        <div className="text-2xl font-bold">{colocDetail.nom || "Recherche colocation"}</div>
                        <div className="text-slate-700">
                          {colocDetail.ville || "-"}
                          {typeof colocDetail.budget === "number" && (
                            <span className="ml-2 text-blue-700 font-semibold">• Budget {colocDetail.budget} €</span>
                          )}
                        </div>
                        <div className="text-slate-600 text-sm mt-1">
                          {colocDetail.profession ? colocDetail.profession : ""}
                          {typeof colocDetail.age === "number" ? ` • ${colocDetail.age} ans` : ""}
                          {colocDetail.dateDispo ? ` • Dispo: ${colocDetail.dateDispo}` : ""}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {colocDetail.createdAt ? `Créé le ${formatCreatedAt(colocDetail.createdAt)}` : ""}
                          {colocDetail.updatedAt ? ` • Maj: ${formatCreatedAt(colocDetail.updatedAt)}` : ""}
                        </div>
                      </div>
                    </div>

                    {/* Bio courte */}
                    {colocDetail.bioCourte && (
                      <div className="text-slate-700">{colocDetail.bioCourte}</div>
                    )}

                    {/* Genre / Orientation */}
                    {(colocDetail.genre || colocDetail.orientation) && (
                      <div className="text-sm text-slate-600">
                        {colocDetail.genre ? `Genre: ${colocDetail.genre}` : ""}{" "}
                        {colocDetail.orientation ? `• Orientation: ${colocDetail.orientation}` : ""}
                      </div>
                    )}

                    {/* Langues */}
                    {Array.isArray(colocDetail.langues) && colocDetail.langues.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-slate-700 mb-1">Langues</div>
                        <div className="flex flex-wrap gap-2">
                          {colocDetail.langues.map((l: string) => (
                            <span key={l} className="px-2 py-1 rounded-full text-xs bg-slate-50 text-slate-700 border border-slate-200">
                              {l}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Préférences */}
                    {(colocDetail.prefGenre || colocDetail.prefAgeMin || colocDetail.prefAgeMax) && (
                      <div>
                        <div className="text-sm font-medium text-slate-700 mb-1">Préférences</div>
                        <div className="text-sm text-slate-600">
                          {colocDetail.prefGenre ? `Colocs: ${colocDetail.prefGenre}` : ""}
                          {(colocDetail.prefAgeMin || colocDetail.prefAgeMax) ? ` • Âge: ${colocDetail.prefAgeMin || "?"} - ${colocDetail.prefAgeMax || "?"}` : ""}
                        </div>
                      </div>
                    )}

                    {/* Style de vie */}
                    {(typeof colocDetail.accepteFumeurs === "boolean" || typeof colocDetail.accepteAnimaux === "boolean" || colocDetail.rythme || colocDetail.proprete || colocDetail.sportif || colocDetail.vegetarien || colocDetail.soirees || colocDetail.musique) && (
                      <div>
                        <div className="text-sm font-medium text-slate-700 mb-1">Style de vie</div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {typeof colocDetail.accepteFumeurs === "boolean" && (
                            <span className="px-2 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
                              {colocDetail.accepteFumeurs ? "Accepte fumeurs" : "Non fumeur de préférence"}
                            </span>
                                                           )}
                          {typeof colocDetail.accepteAnimaux === "boolean" && (
                            <span className="px-2 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
                              {colocDetail.accepteAnimaux ? "Accepte animaux" : "Sans animaux"}
                            </span>
                          )}
                          {colocDetail.rythme && <span className="px-2 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200">Rythme: {colocDetail.rythme}</span>}
                          {colocDetail.proprete && <span className="px-2 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200">Propreté: {colocDetail.proprete}</span>}
                          {colocDetail.sportif && <span className="px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">Sportif</span>}
                          {colocDetail.vegetarien && <span className="px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">Végétarien</span>}
                          {colocDetail.soirees && <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Aime les soirées</span>}
                          {colocDetail.musique && <span className="px-2 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">Musique: {colocDetail.musique}</span>}
                        </div>
                      </div>
                    )}

                    {/* Réseaux */}
                    {colocDetail.instagram && (
                      <div className="text-sm">
                        <span className="font-medium text-slate-700">Instagram:</span>{" "}
                        <a
                          href={`https://instagram.com/${String(colocDetail.instagram).replace(/^@/,"")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          {colocDetail.instagram}
                        </a>
                      </div>
                    )}

                    {/* Zones recherchées */}
                    {Array.isArray(colocDetail.zones) && colocDetail.zones.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-slate-700 mb-1">Zones recherchées</div>
                        <div className="flex flex-wrap gap-2">
                          {colocDetail.zones.map((z: string) => (
                            <span key={z} className="px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
                              {z}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Communes ciblées */}
                    {Array.isArray(colocDetail.communesSlugs) && colocDetail.communesSlugs.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-slate-700 mb-1">Communes ciblées</div>
                        <div className="flex flex-wrap gap-2">
                          {colocDetail.communesSlugs.map((s: string) => (
                            <span key={s} className="px-2 py-1 rounded-full text-xs bg-slate-50 text-slate-700 border border-slate-200">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Centres d'intérêt */}
                    {Array.isArray(colocDetail.interets) && colocDetail.interets.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-slate-700 mb-1">Centres d&apos;intérêt</div>
                        <div className="flex flex-wrap gap-2">
                          {colocDetail.interets.map((i: string) => (
                            <span key={i} className="px-2 py-1 rounded-full text-xs bg-green-50 text-green-700 border border-green-200">
                              {i}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Contact */}
                    {(colocDetail.telephone || colocDetail.email) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        {colocDetail.telephone && (
                          <div><span className="font-medium text-slate-700">Téléphone:</span> <span className="text-slate-800">{colocDetail.telephone}</span></div>
                        )}
                        {colocDetail.email && (
                          <div><span className="font-medium text-slate-700">Email:</span> <span className="text-slate-800">{colocDetail.email}</span></div>
                        )}
                      </div>
                    )}

                    {/* Description longue */}
                    {colocDetail.description && (
                      <div>
                        <div className="text-sm font-medium text-slate-700 mb-1">À propos</div>
                        <p className="text-slate-800 whitespace-pre-line">{colocDetail.description}</p>
                      </div>
                    )}

                    {/* Photos supplémentaires */}
                    {Array.isArray(colocDetail.photos) && colocDetail.photos.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-slate-700 mb-1">Photos</div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {colocDetail.photos.map((u: string, idx: number) => (
                            <Image key={`${u}-${idx}`} src={u} alt={`photo-${idx}`} width={112} height={112} className="w-28 h-28 object-cover rounded-md border" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                </div>
              </div>
            )}
        
        </>
      );
    }
    return <AdminUsers showToast={showToast} />;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-0 flex flex-col md:flex-row w-full overflow-x-hidden">
      <aside className="w-full md:w-64 md:min-h-screen bg-white shadow-lg flex flex-col gap-2 py-8 px-4 border-b md:border-b-0 md:border-r border-slate-200">
        <h2 className="text-xl font-bold text-blue-700 mb-8 text-center tracking-wide">Admin Panel</h2>
        <button
          className={`text-left px-4 py-3 rounded-lg transition ${activeTab === "annonces" ? "bg-blue-600 text-white shadow" : "hover:bg-blue-50 text-slate-700"}`}
          onClick={() => setActiveTab("annonces")}
        >
          📢 Gestion des annonces
        </button>
        <button
          className={`text-left px-4 py-3 rounded-lg transition ${activeTab === "colocs" ? "bg-blue-600 text-white shadow" : "hover:bg-blue-50 text-slate-700"}`}
          onClick={() => setActiveTab("colocs")}
        >
          👥 Profils colocataires
        </button>
        <button
          className={`text-left px-4 py-3 rounded-lg transition ${activeTab === "users" ? "bg-blue-600 text-white shadow" : "hover:bg-blue-50 text-slate-700"}`}
          onClick={() => setActiveTab("users")}
        >
          👤 Gestion des utilisateurs
        </button>
      </aside>
      <section className="flex-1 w-full px-4 md:px-12 py-10 overflow-x-hidden">
        {/* ...existing code header... */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {renderTab()}
        </div>
      </section>
    </main>
  );
}