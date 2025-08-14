"use client";

import { useState, useEffect, useMemo, useCallback, type MouseEvent } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, serverTimestamp, setDoc, deleteDoc, getDocs } from "firebase/firestore";
import Image from "next/image";
import AnnonceCard from "@/components/AnnonceCard";
import AnnonceModal from "@/components/AnnonceModal";
import ConfirmModal from "@/components/ConfirmModal";
import Toast, { ToastMessage, toast as appToast } from "@/components/Toast";
import { v4 as uuidv4 } from "uuid";
import MessageModal from "@/components/MessageModal";
import { translateFirebaseError } from "@/lib/firebaseErrors";
import { listUserAnnoncesPage, addAnnonce, updateAnnonce, deleteAnnonce as deleteAnnonceSvc } from "@/lib/services/annonceService";
import { listMessagesForOwner } from "@/lib/services/messageService";
import { getUserRole } from "@/lib/services/userService";
import Link from "next/link";
import useCommuneSelection from "@/hooks/useCommuneSelection";
import useMessagesData from "@/hooks/useMessagesData";
import CommuneZoneSelector from "@/components/CommuneZoneSelector";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Liste complète des communes de La Réunion
const COMMUNES = [
  "Saint-Denis","Sainte-Marie","Sainte-Suzanne",
  "Saint-André","Bras-Panon","Salazie",
  "Saint-Benoît","La Plaine-des-Palmistes","Sainte-Rose","Saint-Philippe",
  "Le Port","La Possession","Saint-Paul","Trois-Bassins","Saint-Leu","Les Avirons","L'Étang-Salé",
  "Saint-Louis","Cilaos","Le Tampon","Entre-Deux","Saint-Pierre","Petite-Île","Saint-Joseph"
];

// Map codes postaux -> commune (utilisé pour la résolution depuis un CP)
const CP_TO_COMMUNE: Record<string, string> = {
  "97400": "Saint-Denis",
  "97417": "Saint-Denis",
  "97490": "Saint-Denis",

  "97438": "Sainte-Marie",
  "97441": "Sainte-Suzanne",
  "97440": "Saint-André",
  "97412": "Bras-Panon",
  "97433": "Salazie",
  "97470": "Saint-Benoît",
  "97431": "La Plaine-des-Palmistes",
  "97439": "Sainte-Rose",
  "97442": "Saint-Philippe",

  "97420": "Le Port",
  "97419": "La Possession",

  "97460": "Saint-Paul",
  "97411": "Saint-Paul",
  "97422": "Saint-Paul",
  "97423": "Saint-Paul",
  "97434": "Saint-Paul",
  "97435": "Saint-Paul",

  "97426": "Trois-Bassins",

  "97436": "Saint-Leu",
  "97416": "Saint-Leu",
  "97424": "Saint-Leu",

  "97425": "Les Avirons",
  "97427": "L'Étang-Salé",

  "97450": "Saint-Louis",
  "97421": "Saint-Louis",

  "97413": "Cilaos",

  "97430": "Le Tampon",
  "97418": "Le Tampon",

  "97414": "Entre-Deux",

  "97410": "Saint-Pierre",
  "97432": "Saint-Pierre",

  "97429": "Petite-Île",
  "97480": "Saint-Joseph",
};

// Ensembles de communes (groupes)
const GROUPES: Record<string, string[]> = {
  "Nord": ["Saint-Denis","Sainte-Marie","Sainte-Suzanne"],
  "Est": ["Saint-André","Bras-Panon","Salazie","Saint-Benoît","La Plaine-des-Palmistes","Sainte-Rose","Saint-Philippe"],
  "Ouest": ["Le Port","La Possession","Saint-Paul","Trois-Bassins","Saint-Leu","Les Avirons","L'Étang-Salé"],
  "Sud": ["Saint-Louis","Saint-Pierre","Le Tampon","Entre-Deux","Petite-Île","Saint-Joseph","Cilaos"],
  "Intérieur": ["Cilaos","Salazie","La Plaine-des-Palmistes"]
};

// NOUVEAU: sous-communes (nom affiché, CP associé, commune parente)
const SUB_COMMUNES: { name: string; cp: string; parent: string }[] = [
  { name: "Sainte-Clotilde", cp: "97490", parent: "Saint-Denis" },
  { name: "La Montagne", cp: "97417", parent: "Saint-Denis" },

  { name: "Saint-Gilles-les-Bains", cp: "97434", parent: "Saint-Paul" },
  { name: "L'Hermitage-les-Bains", cp: "97434", parent: "Saint-Paul" },
  { name: "Saint-Gilles-les-Hauts", cp: "97435", parent: "Saint-Paul" },
  { name: "La Saline", cp: "97422", parent: "Saint-Paul" },
  { name: "La Saline-les-Hauts", cp: "97423", parent: "Saint-Paul" },
  { name: "Bois-de-Nèfles Saint-Paul", cp: "97411", parent: "Saint-Paul" },
  { name: "Plateau-Caillou", cp: "97460", parent: "Saint-Paul" },

  { name: "La Chaloupe", cp: "97416", parent: "Saint-Leu" },
  { name: "Piton Saint-Leu", cp: "97424", parent: "Saint-Leu" },

  { name: "L'Étang-Salé-les-Bains", cp: "97427", parent: "L'Étang-Salé" },

  { name: "La Rivière", cp: "97421", parent: "Saint-Louis" },

  { name: "La Plaine des Cafres", cp: "97418", parent: "Le Tampon" },

  { name: "Terre-Sainte", cp: "97432", parent: "Saint-Pierre" },

  { name: "Dos d'Âne", cp: "97419", parent: "La Possession" },
];

// [DÉPLACÉ ICI] utils + helpers qui utilisent les constantes ci‑dessus
const slugify = (s: string) =>
  (s || "")
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Résolution commune depuis saisie "ville" ou code postal

// Imposer que la ville provienne de la liste officielle
const pickOfficialVilleFromInput = (raw: string) => {
  const input = (raw || "").trim();
  if (!input) return null;

  // CP exact -> commune
  if (/^\d{5}$/.test(input)) {
    const name = CP_TO_COMMUNE[input];
    return name ? { name, slug: slugify(name), cp: input } : null;
  }

  const norm = slugify(input);

  // Sous-commune (exacte/partielle) -> commune parente
  let sub = SUB_COMMUNES.find(s => slugify(s.name) === norm);
  if (!sub) sub = SUB_COMMUNES.find(s => slugify(s.name).includes(norm) || norm.includes(slugify(s.name)));
  if (sub) return { name: sub.parent, slug: slugify(sub.parent), cp: sub.cp };

  // Commune principale (exacte/partielle)
  let found = COMMUNES.find(c => slugify(c) === norm);
  if (!found) found = COMMUNES.find(c => slugify(c).includes(norm) || norm.includes(slugify(c)));
  if (found) return { name: found, slug: slugify(found), cp: undefined };

  // Sinon: non valide
  return null;
};

// Fallback image annonce pour éviter une référence manquante
const defaultAnnonceImg = "/images/annonce-placeholder.jpg";

// Aide: mapping slug -> nom de commune (pour déduire les zones)
const SLUG_TO_NAME = (COMMUNES as string[]).reduce<Record<string, string>>((acc, name) => {
  const slugify = (s: string) =>
    (s || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  acc[slugify(name)] = name;
  return acc;
}, {});

// NOUVEAU: déduire les zones depuis les slugs sélectionnés
function computeZonesFromSlugs(slugs: string[]): string[] {
  const names = slugs.map((s) => SLUG_TO_NAME[s]).filter(Boolean);
  const zones: string[] = [];
  Object.entries(GROUPES).forEach(([zone, list]) => {
    if (names.some((n) => list.includes(n))) zones.push(zone);
  });
  return zones;
}

// NOUVEAU: comparer deux listes (ordre ignoré)
function sameIds(a: string[], b: string[]) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  for (let i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) return false;
  return true;
}

// Helper upload vers Firebase Storage
async function uploadToStorage(file: File, pathPrefix: string) {
  const storage = getStorage();
  const r = ref(storage, `${pathPrefix}/${Date.now()}-${file.name}`);
  await uploadBytes(r, file);
  return await getDownloadURL(r);
}

export default function DashboardPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mesAnnonces, setMesAnnonces] = useState<any[]>([]);
  const [loadingAnnonces, setLoadingAnnonces] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editAnnonce, setEditAnnonce] = useState<any | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedAnnonceToDelete, setSelectedAnnonceToDelete] = useState<any | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const showToast = (type: "success" | "error" | "info", message: string) => {
    const id = uuidv4();
    setToasts((prev) => [...prev, { id, type, message }]);
    // Toaster global pour visibilité sur toute page
    appToast[type](message);
  };

  const [lastDoc, setLastDoc] = useState<any | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userDocLoaded, setUserDocLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<"annonces" | "messages" | "coloc">("annonces");
  const [activeMsgTab, setActiveMsgTab] = useState<"received" | "sent">("received");
  const [annonceTitles, setAnnonceTitles] = useState<Record<string, string>>({});
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);

  // --- Profil colocataire: états (déplacé plus haut pour éviter l'usage avant déclaration) ---
  const [loadingColoc, setLoadingColoc] = useState(true);
  const [savingColoc, setSavingColoc] = useState(false);
  const [colocNom, setColocNom] = useState("");
  const [colocVille, setColocVille] = useState("");
  const [colocBudget, setColocBudget] = useState<number | "">("");
  const [colocImageUrl, setColocImageUrl] = useState("");
  const [colocDescription, setColocDescription] = useState("");
  const [colocAge, setColocAge] = useState<number | "">("");
  const [colocProfession, setColocProfession] = useState("");
  const [colocFumeur, setColocFumeur] = useState(false);
  const [colocAnimaux, setColocAnimaux] = useState(false);
  const [colocDateDispo, setColocDateDispo] = useState("");
  const [colocQuartiers, setColocQuartiers] = useState("");
  const [colocTelephone, setColocTelephone] = useState("");
  const [colocZones, setColocZones] = useState<string[]>([]);
  const [colocCommunesSlugs, setColocCommunesSlugs] = useState<string[]>([]);
  // Nouveaux champs type Tinder
  const [colocGenre, setColocGenre] = useState("");
  const [colocOrientation, setColocOrientation] = useState("");
  const [colocBioCourte, setColocBioCourte] = useState("");
  const [colocLanguesCsv, setColocLanguesCsv] = useState(""); // CSV vers tableau
  const [colocInstagram, setColocInstagram] = useState("");
  const [colocPhotosCsv, setColocPhotosCsv] = useState(""); // CSV vers tableau
  // Préférences & style de vie
  const [prefGenre, setPrefGenre] = useState("");
  const [prefAgeMin, setPrefAgeMin] = useState<number | "">("");
  const [prefAgeMax, setPrefAgeMax] = useState<number | "">("");
  const [accepteFumeurs, setAccepteFumeurs] = useState(false);
  const [accepteAnimaux, setAccepteAnimaux] = useState(false);
  const [rythme, setRythme] = useState("");
  const [proprete, setProprete] = useState("");
  const [sportif, setSportif] = useState(false);
  const [vegetarien, setVegetarien] = useState(false);
  const [soirees, setSoirees] = useState(false);
  const [musique, setMusique] = useState("");
  // Suivi existence doc & prêt pour autosave
  const [hasColocDoc, setHasColocDoc] = useState<boolean | null>(null);
  const [colocReady, setColocReady] = useState(false);

  const handleFirestoreError = (err: any, context: string) => {
    console.error(`[Dashboard][${context}]`, err);
    const code = err?.code;
    // Cas spécifique: index requis (en cours de build)
    if (code === "failed-precondition" && String(err?.message || "").toLowerCase().includes("index")) {
      showToast("info", "Index Firestore en cours de création. Le tri peut être temporairement indisponible. Réessayez dans quelques minutes.");
      return;
    }
    if (code === "permission-denied") {
      let msg = "Accès refusé (permission-denied).";
      msg += userRole
        ? ` Rôle Firestore détecté: "${userRole}".`
        : " Aucun rôle Firestore détecté (doc manquant / champ 'role').";
      msg += " Vérifie les règles Firestore: utilisent-elles la lecture du doc users ou un custom claim que tu n'emploies plus ?";
      setFirestoreError(msg);
      showToast("error", msg);
      setHasMore(false);
    } else {
      showToast("error", code ? translateFirebaseError(code) : "Erreur Firestore.");
    }
  };

  const { overrideVille, setOverrideVille, officialVillePreview, MAIN_COMMUNES_SORTED, SUB_COMMUNES_SORTED } =
    useCommuneSelection({
      modalOpen,
      editAnnonce,
      CP_TO_COMMUNE,
      SUB_COMMUNES,
      pickOfficialVilleFromInput,
    });

  const { messages, sentMessages } = useMessagesData({
    user,
    firestoreError,
    userDocLoaded,
    showToast,
    handleFirestoreError,
  });

  const loadUserDoc = async (u: any) => {
    try {
      if (!u) return;
      const role = await getUserRole(u.uid);
      setUserRole(role);
    } catch (e) {
      console.warn("[Dashboard][UserDoc] échec :", e);
    } finally {
      setUserDocLoaded(true);
    }
  };

  // Helper pour comparer createdAt de manière robuste (Timestamp Firestore/Date/number/string)
  const createdAtMs = (x: any) => {
    const v = x?.createdAt;
    if (!v) return 0;
    if (typeof v === "number") return v;
    if (v instanceof Date) return v.getTime();
    if (typeof v === "string") {
      const d = Date.parse(v);
      return isNaN(d) ? 0 : d;
    }
    if (typeof v === "object" && typeof v.seconds === "number") {
      return v.seconds * 1000 + (v.nanoseconds ? Math.floor(v.nanoseconds / 1e6) : 0);
    }
    return 0;
  };

  // Liste triée par date desc pour l’affichage
  const sortedAnnonces = useMemo(
    () => [...mesAnnonces].sort((a, b) => createdAtMs(b) - createdAtMs(a)),
    [mesAnnonces]
  );

  // IDs visibles (pour tout sélectionner/désélectionner)
  const visibleIds = useMemo(() => sortedAnnonces.map(a => a.id), [sortedAnnonces]);

  // Nettoie la sélection si la liste visible change (évite les IDs orphelins)
  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => visibleIds.includes(id)));
  }, [visibleIds]);

  const loadAnnonces = async () => {
    if (!user || loadingMore || !hasMore || firestoreError) return;

    // Premier chargement: activer le spinner principal
    const isInitial = !lastDoc && mesAnnonces.length === 0;
    if (isInitial) setLoadingAnnonces(true);

    setLoadingMore(true);
    try {
      const { items, lastDoc: newLast } = await listUserAnnoncesPage(user.uid, { lastDoc, pageSize: 10 });

      if (items.length) {
        setLastDoc(newLast);
        setMesAnnonces(prev => {
          const ids = new Set(prev.map(a => a.id));
          const merged = [...prev, ...items.filter(i => !ids.has(i.id))];
          // Tri par date desc après fusion
          merged.sort((a, b) => createdAtMs(b) - createdAtMs(a));
          return merged;
        });
      } else {
        setHasMore(false);
      }
    } catch (err:any) {
      handleFirestoreError(err, "loadAnnonces");
    } finally {
      setLoadingMore(false);
      if (isInitial) setLoadingAnnonces(false);
    }
  };

  // Chargement du profil coloc depuis Firestore
  const loadColocProfile = async () => {
    if (!user) return;
    setLoadingColoc(true);
    try {
      const ref = doc(db, "colocProfiles", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const d: any = snap.data();
        setHasColocDoc(true);
        setColocNom(d.nom || "");
        setColocVille(d.ville || "");
        setColocBudget(typeof d.budget === "number" ? d.budget : "");
        setColocImageUrl(d.imageUrl || "");
        setColocDescription(d.description || "");
        setColocAge(typeof d.age === "number" ? d.age : "");
        setColocProfession(d.profession || "");
        setColocFumeur(!!d.fumeur);
        setColocAnimaux(!!d.animaux);
        setColocDateDispo(d.dateDispo || "");
        setColocQuartiers(d.quartiers || "");
        setColocTelephone(d.telephone || "");
        setColocZones(Array.isArray(d.zones) ? d.zones : []);
        setColocCommunesSlugs(Array.isArray(d.communesSlugs) ? d.communesSlugs : []);
        // Nouveaux champs
        setColocGenre(d.genre || "");
        setColocOrientation(d.orientation || "");
        setColocBioCourte(d.bioCourte || "");
        setColocLanguesCsv(Array.isArray(d.langues) ? d.langues.join(", ") : (d.langues || ""));
        setColocInstagram(d.instagram || "");
        setColocPhotosCsv(Array.isArray(d.photos) ? d.photos.join(", ") : (d.photos || ""));
        setPrefGenre(d.prefGenre || "");
        setPrefAgeMin(typeof d.prefAgeMin === "number" ? d.prefAgeMin : "");
        setPrefAgeMax(typeof d.prefAgeMax === "number" ? d.prefAgeMax : "");
        setAccepteFumeurs(!!d.accepteFumeurs);
        setAccepteAnimaux(!!d.accepteAnimaux);
        setRythme(d.rythme || "");
        setProprete(d.proprete || "");
        setSportif(!!d.sportif);
        setVegetarien(!!d.vegetarien);
        setSoirees(!!d.soirees);
        setMusique(d.musique || "");
      } else {
        setHasColocDoc(false);
        // valeurs par défaut (profil non créé)
        setColocNom("");
        setColocVille("");
        setColocBudget("");
        setColocImageUrl("");
        setColocDescription("");
        setColocAge("");
        setColocProfession("");
        setColocFumeur(false);
        setColocAnimaux(false);
        setColocDateDispo("");
        setColocQuartiers("");
        setColocTelephone("");
        setColocZones([]);
        setColocCommunesSlugs([]);
        setColocGenre(""); setColocOrientation(""); setColocBioCourte(""); setColocLanguesCsv(""); setColocInstagram(""); setColocPhotosCsv("");
        setPrefGenre(""); setPrefAgeMin(""); setPrefAgeMax(""); setAccepteFumeurs(false); setAccepteAnimaux(false);
        setRythme(""); setProprete(""); setSportif(false); setVegetarien(false); setSoirees(false); setMusique("");
      }
    } catch (err: any) {
      handleFirestoreError(err, "loadColocProfile");
    } finally {
      setLoadingColoc(false);
    }
  };

  // NOUVEAU: abonnement live au profil colocataire (création/maj en temps réel)
  useEffect(() => {
    if (activeTab !== "coloc" || !user) return;
    setLoadingColoc(true);
    const ref = doc(db, "colocProfiles", user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const d: any = snap.data();
          setHasColocDoc(true);
          setColocNom(d.nom || "");
          setColocVille(d.ville || "");
          setColocBudget(typeof d.budget === "number" ? d.budget : "");
          setColocImageUrl(d.imageUrl || "");
          setColocDescription(d.description || "");
          setColocAge(typeof d.age === "number" ? d.age : "");
          setColocProfession(d.profession || "");
          setColocFumeur(!!d.fumeur);
          setColocAnimaux(!!d.animaux);
          setColocDateDispo(d.dateDispo || "");
          setColocQuartiers(d.quartiers || "");
          setColocTelephone(d.telephone || "");
          setColocZones(Array.isArray(d.zones) ? d.zones : []);
          setColocCommunesSlugs(Array.isArray(d.communesSlugs) ? d.communesSlugs : []);
          setColocGenre(d.genre || "");
          setColocOrientation(d.orientation || "");
          setColocBioCourte(d.bioCourte || "");
          setColocLanguesCsv(Array.isArray(d.langues) ? d.langues.join(", ") : (d.langues || ""));
          setColocInstagram(d.instagram || "");
          setColocPhotosCsv(Array.isArray(d.photos) ? d.photos.join(", ") : (d.photos || ""));
          setPrefGenre(d.prefGenre || "");
          setPrefAgeMin(typeof d.prefAgeMin === "number" ? d.prefAgeMin : "");
          setPrefAgeMax(typeof d.prefAgeMax === "number" ? d.prefAgeMax : "");
          setAccepteFumeurs(!!d.accepteFumeurs);
          setAccepteAnimaux(!!d.accepteAnimaux);
          setRythme(d.rythme || "");
          setProprete(d.proprete || "");
          setSportif(!!d.sportif);
          setVegetarien(!!d.vegetarien);
          setSoirees(!!d.soirees);
          setMusique(d.musique || "");
        } else {
          setHasColocDoc(false);
          // valeurs par défaut (profil non créé)
          setColocNom("");
          setColocVille("");
          setColocBudget("");
          setColocImageUrl("");
          setColocDescription("");
          setColocAge("");
          setColocProfession("");
          setColocFumeur(false);
          setColocAnimaux(false);
          setColocDateDispo("");
          setColocQuartiers("");
          setColocTelephone("");
          setColocZones([]);
          setColocCommunesSlugs([]);
          setColocGenre(""); setColocOrientation(""); setColocBioCourte(""); setColocLanguesCsv(""); setColocInstagram(""); setColocPhotosCsv("");
          setPrefGenre(""); setPrefAgeMin(""); setPrefAgeMax(""); setAccepteFumeurs(false); setAccepteAnimaux(false);
          setRythme(""); setProprete(""); setSportif(false); setVegetarien(false); setSoirees(false); setMusique("");
        }
        setLoadingColoc(false);
        setColocReady(true);
      },
      (err) => {
        handleFirestoreError(err, "colocProfile-live");
        setLoadingColoc(false);
      }
    );
    return () => {
      try { unsub(); } catch {}
      setColocReady(false);
    };
  }, [activeTab, user]);

  // NOUVEAU: autosave silencieux (création si besoin) avec debounce
  useEffect(() => {
    if (!colocReady || activeTab !== "coloc" || !user) return;
    const t = setTimeout(() => {
      autoSaveColoc();
    }, 800);
    return () => clearTimeout(t);
  }, [
    colocNom,
    colocVille,
    colocBudget,
    colocImageUrl,
    colocDescription,
    colocAge,
    colocProfession,
    colocFumeur,
    colocAnimaux,
    colocDateDispo,
    colocQuartiers,
    colocTelephone,
    colocZones,
    colocCommunesSlugs,
    colocGenre,
    colocOrientation,
    colocBioCourte,
    colocLanguesCsv,
    colocInstagram,
    colocPhotosCsv,
    prefGenre,
    prefAgeMin,
    prefAgeMax,
    accepteFumeurs,
    accepteAnimaux,
    rythme,
    proprete,
    sportif,
    vegetarien,
    soirees,
    musique,
    colocReady,
    activeTab,
    user
  ]);

  // NOUVEAU: sauvegarde silencieuse (pas de toast/UI), merge + createdAt au premier enregistrement
  const autoSaveColoc = async () => {
    if (!user) return;
    try {
      const ref = doc(db, "colocProfiles", user.uid);
      const payload: any = {
        uid: user.uid,
        email: user.email || null,
        nom: colocNom,
        ville: colocVille,
        budget: typeof colocBudget === "number" ? colocBudget : null,
        imageUrl: colocImageUrl,
        description: colocDescription,
        age: typeof colocAge === "number" ? colocAge : null,
        profession: colocProfession,
        fumeur: !!colocFumeur,
        animaux: !!colocAnimaux,
        dateDispo: colocDateDispo,
        quartiers: colocQuartiers,
        telephone: colocTelephone,
        zones: colocZones,
        communesSlugs: colocCommunesSlugs,
        updatedAt: serverTimestamp(),
        // Nouveaux champs
        genre: colocGenre || undefined,
        orientation: colocOrientation || undefined,
        bioCourte: colocBioCourte || undefined,
        langues: colocLanguesCsv ? colocLanguesCsv.split(",").map(s=>s.trim()).filter(Boolean) : undefined,
        instagram: colocInstagram || undefined,
        photos: colocPhotosCsv ? colocPhotosCsv.split(",").map(s=>s.trim()).filter(Boolean) : undefined,
        prefGenre: prefGenre || undefined,
        prefAgeMin: prefAgeMin !== "" ? Number(prefAgeMin) : undefined,
        prefAgeMax: prefAgeMax !== "" ? Number(prefAgeMax) : undefined,
        accepteFumeurs: !!accepteFumeurs,
        accepteAnimaux: !!accepteAnimaux,
        rythme: rythme || undefined,
        proprete: proprete || undefined,
        sportif: !!sportif,
        vegetarien: !!vegetarien,
        soirees: !!soirees,
        musique: musique || undefined,
        ...(hasColocDoc ? {} : { createdAt: serverTimestamp() }),
      };
      Object.keys(payload).forEach((k) => {
        const v = (payload as any)[k];
        if (v === "" || v === null || (Array.isArray(v) && v.length === 0)) delete (payload as any)[k];
      });
      await setDoc(ref, payload, { merge: true });
    } catch {
      // silencieux
    }
  };

  const saveColocProfile = async () => {
    if (!user) return;
    setSavingColoc(true);
    try {
      const ref = doc(db, "colocProfiles", user.uid);
      const payload: any = {
        uid: user.uid,
        email: user.email || null,
        nom: colocNom,
        ville: colocVille,
        budget: typeof colocBudget === "number" ? colocBudget : null,
        imageUrl: colocImageUrl,
        description: colocDescription,
        age: typeof colocAge === "number" ? colocAge : null,
        profession: colocProfession,
        fumeur: !!colocFumeur,
        animaux: !!colocAnimaux,
        dateDispo: colocDateDispo,
        quartiers: colocQuartiers,
        telephone: colocTelephone,
        zones: colocZones,
        communesSlugs: colocCommunesSlugs,
        updatedAt: serverTimestamp(),
        // Nouveaux champs (mêmes conversions qu'autosave)
        genre: colocGenre || undefined,
        orientation: colocOrientation || undefined,
        bioCourte: colocBioCourte || undefined,
        langues: colocLanguesCsv ? colocLanguesCsv.split(",").map(s=>s.trim()).filter(Boolean) : undefined,
        instagram: colocInstagram || undefined,
        photos: colocPhotosCsv ? colocPhotosCsv.split(",").map(s=>s.trim()).filter(Boolean) : undefined,
        prefGenre: prefGenre || undefined,
        prefAgeMin: prefAgeMin !== "" ? Number(prefAgeMin) : undefined,
        prefAgeMax: prefAgeMax !== "" ? Number(prefAgeMax) : undefined,
        accepteFumeurs: !!accepteFumeurs,
        accepteAnimaux: !!accepteAnimaux,
        rythme: rythme || undefined,
        proprete: proprete || undefined,
        sportif: !!sportif,
        vegetarien: !!vegetarien,
        soirees: !!soirees,
        musique: musique || undefined,
        // ...existing cleanup & setDoc
      };
      // Nettoyage des champs vides/null (sauf booléens et tableaux)
      Object.keys(payload).forEach((k) => {
        const v = payload[k];
        if (v === "" || v === null || (Array.isArray(v) && v.length === 0)) delete payload[k];
      });
      await setDoc(ref, payload, { merge: true });
      showToast("success", "Profil colocataire enregistré ✅");
    } catch (err: any) {
      console.error("[Dashboard][saveColocProfile]", err);
      showToast("error", err?.code ? translateFirebaseError(err.code) : "Erreur lors de l'enregistrement ❌");
    } finally {
      setSavingColoc(false);
    }
  };

  const deleteColocProfile = async () => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "colocProfiles", user.uid));
      // Reset des états
      setColocNom("");
      setColocVille("");
      setColocBudget("");
      setColocImageUrl("");
      setColocDescription("");
      setColocAge("");
      setColocProfession("");
      setColocFumeur(false);
      setColocAnimaux(false);
      setColocDateDispo("");
      setColocQuartiers("");
      setColocTelephone("");
      setColocZones([]);
      setColocCommunesSlugs([]);
      setColocGenre(""); setColocOrientation(""); setColocBioCourte(""); setColocLanguesCsv(""); setColocInstagram(""); setColocPhotosCsv("");
      setPrefGenre(""); setPrefAgeMin(""); setPrefAgeMax(""); setAccepteFumeurs(false); setAccepteAnimaux(false);
      setRythme(""); setProprete(""); setSportif(false); setVegetarien(false); setSoirees(false); setMusique("");
      showToast("success", "Profil supprimé ✅");
    } catch (err: any) {
      console.error("[Dashboard][deleteColocProfile]", err);
      showToast("error", err?.code ? translateFirebaseError(err.code) : "Erreur lors de la suppression ❌");
    }
  };

  // --- Profil colocataire: états ---
  // (supprimé) Ancien bloc déplacé plus haut pour éviter l’utilisation avant déclaration

  useEffect(() => {
    if (user) loadUserDoc(user);
  }, [user]);

  useEffect(() => {
    if (loading || firestoreError) return;

    if (!user) {
      router.push("/login");
      return;
    }
    // Attendre d’avoir tenté de charger le doc user pour éviter permission-denied précoce
    if (!userDocLoaded) return;
    loadAnnonces();
  }, [user, loading, lastDoc, firestoreError, userDocLoaded]);

  useEffect(() => {
    const handleScroll = () => {
      const bottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;

      if (bottom && hasMore && !loadingMore) {
        loadAnnonces();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  });

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  // Récupération des titres d’annonces liés aux messages (cache)
  useEffect(() => {
    if (!user || firestoreError || !userDocLoaded) return;
    const allMessages = [...messages, ...sentMessages];
    const annonceIds = Array.from(new Set(allMessages.map(m => m.annonceId).filter(Boolean)));
    if (annonceIds.length === 0) return;

    const fetchAnnonces = async () => {
      try {
        const q = query(
          collection(db, "annonces"),
          where("id", "in", annonceIds),
        );
        const snap = await getDocs(q);
        const titles: Record<string, string> = {};
        snap.docs.forEach((d) => {
          const data = d.data();
          if (data.titre) {
            titles[d.id] = data.titre;
          }
        });
        setAnnonceTitles(titles);
      } catch (err: any) {
        handleFirestoreError(err, "fetchAnnonceTitles");
      }
    };

    fetchAnnonces();
  }, [messages, sentMessages, annonceTitles, db]);

  useEffect(() => {
    if (!user || firestoreError || !userDocLoaded) return;
    let unsubs: Array<() => void> = [];
    setLoadingAnnonces(true);

    const attach = (qAny: any, label: string) => {
      try {
        const u = onSnapshot(
          qAny,
          (snap: { docs: any[]; }) => {
            const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setMesAnnonces((prev) => {
              const byId = new Map(prev.map((x) => [x.id, x]));
              docs.forEach((m) => byId.set(m.id, { ...(byId.get(m.id) || {}), ...m }));
              const arr = Array.from(byId.values());
              arr.sort((a, b) => createdAtMs(b) - createdAtMs(a));
              return arr;
            });
            setLoadingAnnonces(false);
          },
          (err) => {
            if (err?.code === "failed-precondition" && String(err?.message || "").toLowerCase().includes("index")) {
              // Fallback sans orderBy: tri côté client
              const u2 = onSnapshot(
                query(collection(db, "annonces"), where("uid", "==", user.uid)),
                (snap2) => {
                  const docs2 = snap2.docs.map((d) => ({ id: d.id, ...d.data() }));
                  setMesAnnonces((prev) => {
                    const byId = new Map(prev.map((x) => [x.id, x]));
                    docs2.forEach((m) => byId.set(m.id, { ...(byId.get(m.id) || {}), ...m }));
                    const arr = Array.from(byId.values());
                    arr.sort((a, b) => createdAtMs(b) - createdAtMs(a));
                    return arr;
                  });
                  setLoadingAnnonces(false);
                }
              );
              unsubs.push(u2);
            } else {
              handleFirestoreError(err, "annonces-snapshot-" + label);
              setLoadingAnnonces(false);
            }
          }
        );
        unsubs.push(u);
      } catch (e) {
        console.warn("[Dashboard][annonces] subscribe error", e);
      }
    };

    // Essayer avec uid
    attach(
      query(collection(db, "annonces"), where("uid", "==", user.uid), orderBy("createdAt", "desc")),
      "uid"
    );
    // Essayer aussi avec ownerId (selon service)
    attach(
      query(collection(db, "annonces"), where("ownerId", "==", user.uid), orderBy("createdAt", "desc")),
      "ownerId"
    );

    return () => {
      unsubs.forEach((u) => {
        try { u(); } catch {}
      });
    };
  }, [user, firestoreError, userDocLoaded]);

  // Option: désactiver la pagination classique (le temps réel s’en charge)
  useEffect(() => { setHasMore(false); }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };
  const selectAllVisible = () => {
    setSelectedIds(visibleIds);
  };
  const clearSelection = () => setSelectedIds([]);
  const deselectAll = () => setSelectedIds([]);

  const performBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    showToast("info", `Suppression de ${selectedIds.length} annonce(s)...`);
    try {
      await Promise.all(selectedIds.map(id => deleteAnnonceSvc(id).catch(e => e)));
      setMesAnnonces(prev => prev.filter(a => !selectedIds.includes(a.id)));
      clearSelection();
      showToast("success", "Sélection supprimée ✅");
    } catch (e) {
      showToast("error", "Erreur lors de la suppression multiple ❌");
    }
  };

  // Master checkbox (tout/cocher ou tout/décocher)
  const allSelected = visibleIds.length > 0 && selectedIds.length === visibleIds.length;

  // NOUVEAU: états pour la gestion des messages
  const [selectedReceivedIds, setSelectedReceivedIds] = useState<string[]>([]);
  const [selectedSentIds, setSelectedSentIds] = useState<string[]>([]);
  const [deletingMsgs, setDeletingMsgs] = useState(false);
  const [confirmMsgBulkOpen, setConfirmMsgBulkOpen] = useState(false);

  // Nettoyer la sélection quand les listes changent
  useEffect(() => {
    setSelectedReceivedIds(prev => prev.filter(id => messages.some(m => m.id === id)));
  }, [messages]);
  useEffect(() => {
    setSelectedSentIds(prev => prev.filter(id => sentMessages.some(m => m.id === id)));
  }, [sentMessages]);

  // Sélection messages selon sous-onglet
  const visibleMsgs = useMemo(() => (activeMsgTab === "received" ? messages : sentMessages), [activeMsgTab, messages, sentMessages]);
  const selectedMsgIds = activeMsgTab === "received" ? selectedReceivedIds : selectedSentIds;
  const allMsgsSelected = visibleMsgs.length > 0 && selectedMsgIds.length === visibleMsgs.length;
  const setSelectedMsgIds = (updater: (prev: string[]) => string[]) => {
    if (activeMsgTab === "received") setSelectedReceivedIds(updater);
    else setSelectedSentIds(updater);
  };
  const toggleSelectMsg = (id: string) => {
    setSelectedMsgIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };
  const selectAllVisibleMsgs = () => setSelectedMsgIds(() => visibleMsgs.map(m => m.id));
  const deselectAllMsgs = () => setSelectedMsgIds(() => []);

  const deleteMessageById = async (id: string) => {
    try {
      await deleteDoc(doc(db, "messages", id));
    } catch (e) {
      throw e;
    }
  };
  const performBulkDeleteMsgs = async () => {
    const toDelete = selectedMsgIds;
    if (toDelete.length === 0) return;
    setDeletingMsgs(true);
    try {
      await Promise.all(toDelete.map(id => deleteMessageById(id).catch(e => e)));
      if (activeMsgTab === "received") setSelectedReceivedIds([]);
      else setSelectedSentIds([]);
      showToast("success", "Message(s) supprimé(s) ✅");
    } catch {
      showToast("error", "Erreur suppression des messages ❌");
    } finally {
      setDeletingMsgs(false);
    }
  };
  const handleDeleteSingleMsg = async (id: string) => {
    if (!window.confirm("Supprimer ce message ?")) return;
    try {
      await deleteMessageById(id);
      showToast("success", "Message supprimé ✅");
    } catch {
      showToast("error", "Erreur lors de la suppression ❌");
    }
  };

  return (
    <div className="min-h-screen p-2 sm:p-6 flex flex-col items-center">
      {/* En-tête */}
      <div className="w-full max-w-3xl mb-6">
        <div className="rounded-lg bg-white shadow-md p-4 sm:p-6">
          <h1 className="text-3xl font-bold mb-2">
            Tableau de bord
          </h1>
          <p className="text-gray-700">
            Gère tes annonces, messages et ton profil colocataire.
          </p>
        </div>
      </div>

      {/* Onglets */}
      <div className="w-full max-w-3xl flex gap-2 mb-6">
        <button
          className={`flex-1 px-4 py-2 rounded-t-lg font-semibold transition ${
            activeTab === "annonces"
              ? "bg-blue-600 text-white shadow"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
          onClick={() => setActiveTab("annonces")}
        >
          Mes annonces
        </button>
        <button
          className={`flex-1 px-4 py-2 rounded-t-lg font-semibold transition ${
            activeTab === "messages"
              ? "bg-blue-600 text-white shadow"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
          onClick={() => setActiveTab("messages")}
        >
          Messages
        </button>
        <button
          className={`flex-1 px-4 py-2 rounded-t-lg font-semibold transition ${
            activeTab === "coloc"
              ? "bg-blue-600 text-white shadow"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
          onClick={() => setActiveTab("coloc")}
        >
          Profil colocataire
        </button>
      </div>

      {/* Contenu des onglets */}
      <div className="w-full max-w-3xl bg-white rounded-b-xl shadow p-6">
        {activeTab === "annonces" && (
          <>
            <button
              onClick={() => {
                setEditAnnonce(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mb-6 shadow-sm"
            >
              <span>➕</span> Nouvelle annonce
            </button>

            {/* Barre d’actions toujours visible */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => (allSelected ? deselectAll() : selectAllVisible())}
                  className="w-5 h-5 appearance-none rounded-full border border-slate-400 bg-white bg-center bg-no-repeat transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 checked:bg-blue-600 checked:border-blue-600 checked:ring-2 checked:ring-blue-300 checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22white%22 stroke-width=%223%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M3.5 8.5 L6.5 11.5 L12.5 4.5%22/></svg>')] checked:bg-[length:1rem_1rem]"
                />
                <span className="text-sm text-slate-700">
                  Tout ({visibleIds.length})
                </span>
              </label>
              <button
                type="button"
                onClick={selectAllVisible}
                className="border border-slate-300 px-3 py-1.5 rounded hover:bg-slate-50"
              >
                Tout sélectionner
              </button>
              <button
                type="button"
                onClick={deselectAll}
                className="border border-slate-300 px-3 py-1.5 rounded hover:bg-slate-50"
              >
                Tout désélectionner
              </button>
              <button
                type="button"
                onClick={() => setConfirmBulkOpen(true)}
                disabled={selectedIds.length === 0}
                className="bg-rose-600 text-white px-3 py-1.5 rounded hover:bg-rose-700 disabled:opacity-60"
              >
                Supprimer la sélection ({selectedIds.length})
              </button>
            </div>

            <h2 className="text-2xl font-semibold mb-4">Mes annonces</h2>
            {loadingAnnonces ? (
              <p className="text-gray-500">Chargement de vos annonces...</p>
            ) : sortedAnnonces.length === 0 ? (
              <p className="text-gray-500">Aucune annonce pour le moment.</p>
            ) : (
              <div className="flex flex-col gap-4 w-full">
                {sortedAnnonces.map((annonce) => (
                  <div key={annonce.id} className="w-full flex items-start gap-3">
                    <div
                      className="relative -m-2 p-2 inline-flex items-center"
                      onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
                      onMouseDown={(e: MouseEvent<HTMLDivElement>) => { e.stopPropagation(); }}
                      onDoubleClick={(e: MouseEvent<HTMLDivElement>) => { e.stopPropagation(); e.preventDefault(); }}
                      onKeyDown={(e: any) => { e.stopPropagation(); }}
                    >
                      <input
                        type="checkbox"
                        className="relative z-10 pointer-events-auto mt-2 w-5 h-5 appearance-none rounded-full border border-slate-400 bg-white bg-center bg-no-repeat transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 checked:bg-blue-600 checked:border-blue-600 checked:ring-2 checked:ring-blue-300 checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22white%22 stroke-width=%223%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M3 8.2 L6.2 11.4 L13 4.6%22/></svg>')] checked:bg-[length:1rem_1rem]"
                        checked={selectedIds.includes(annonce.id)}
                        onChange={() => toggleSelect(annonce.id)}
                        onClick={(e) => { e.stopPropagation(); }}
                        onMouseDown={(e) => { e.stopPropagation(); }}
                      />
                    </div>
                    <AnnonceCard
                      {...annonce}
                      imageUrl={annonce.imageUrl || defaultAnnonceImg}
                      onDelete={() => {
                        setSelectedAnnonceToDelete(annonce);
                        setConfirmModalOpen(true);
                      }}
                      onEdit={() => {
                        setEditAnnonce(annonce);
                        setModalOpen(true);
                      }}
                    />
                  </div>
                ))}
                {loadingMore && <p className="text-center text-gray-500 mt-4">Chargement…</p>}
                {!hasMore && <p className="text-center text-gray-400 mt-4">Toutes les annonces sont chargées.</p>}
              </div>
            )}

            {/* Confirmation suppression multiple */}
            <ConfirmModal
              isOpen={confirmBulkOpen}
              onClose={() => setConfirmBulkOpen(false)}
              onConfirm={async () => {
                await performBulkDelete();
                setConfirmBulkOpen(false);
              }}
            />

            <AnnonceModal
              isOpen={modalOpen}
              onClose={() => {
                setModalOpen(false);
                setEditAnnonce(null);
              }}
              onSubmit={async ({
                titre, ville, prix, imageUrl, surface, description, nbChambres, equipements, photos,
                quartier, meuble, dateDispo, chargesIncluses, caution
              }: {
                 titre: string;
                 ville: string;
                 prix: string;
                 imageUrl: string;
                 surface?: string;
                 nbChambres?: string;
                 equipements?: string;
                 description?: string;
                 quartier?: string;
                 meuble?: boolean;
                 dateDispo?: string;
                 chargesIncluses?: boolean;
                 caution?: string;
                 photos?: string[];
               }) => {
                 try {
                   const villeInput = overrideVille?.trim() ? overrideVille : ville;
                   const official = pickOfficialVilleFromInput(villeInput);
                   if (!official) {
                     showToast("error", "Commune invalide. Merci de choisir une commune de La Réunion (ex: Saint-Denis, Saint-Paul, Le Tampon…).");
                     return;
                   }

                  // NOUVEAU: si la saisie correspond à une sous‑commune, garder le nom de la sous‑commune comme 'ville'
                  const subMatch = SUB_COMMUNES.find(s => slugify(s.name) === slugify(villeInput));
                  const villeName = subMatch ? subMatch.name : official.name;

                  const communeSlug = official.slug;
                  const codePostal = official.cp;

                  const annonceData: any = {
                    titre,
                    ville: villeName, // gardée en sous‑commune si applicable
                    communeSlug,
                    ...(codePostal ? { codePostal } : {}),
                    prix: prix ? Number(prix) : null,
                    imageUrl,
                    surface: surface ? Number(surface) : null,
                    description: description || "",
                    nbChambres: nbChambres ? Number(nbChambres) : null,
                    equipements: equipements || "",
                    quartier: quartier || "",
                    meuble: typeof meuble === "boolean" ? meuble : !!meuble,
                    dateDispo: dateDispo || "",
                    chargesIncluses: typeof chargesIncluses === "boolean" ? chargesIncluses : !!chargesIncluses,
                    caution: caution ? Number(caution) : null,
                    ...(Array.isArray(photos) && photos.length ? { photos } : {}),
                  };

                  Object.keys(annonceData).forEach((k) => (annonceData[k] === null || annonceData[k] === "") && delete (annonceData as any)[k]);

                  if (editAnnonce) {
                    await updateAnnonce(editAnnonce.id, annonceData);
                    showToast("success", "Annonce modifiée avec succès ✅");
                  } else {
                    await addAnnonce({ uid: user!.uid, email: user!.email }, annonceData);
                    showToast("success", "Annonce créée avec succès ✅");
                  }
                } catch (err: any) {
                  console.error("[Dashboard][AnnonceSubmit] Erreur Firestore brute :", err);
                  showToast("error", err?.code ? translateFirebaseError(err.code) : "Erreur lors de l'enregistrement ❌");
                }
              }}
              annonce={editAnnonce}
              villeDatalist={{
                value: overrideVille,
                onChange: setOverrideVille,
                main: MAIN_COMMUNES_SORTED,
                sub: SUB_COMMUNES_SORTED,
                label: "Commune",
                datalistId: "communes-reu-dashboard-modal",
              }}
            />
            <ConfirmModal
              isOpen={confirmModalOpen}
              onClose={() => setConfirmModalOpen(false)}
              onConfirm={async () => {
                if (!selectedAnnonceToDelete) return;
                showToast("info", "Suppression en cours...");
                try {
                  await deleteAnnonceSvc(selectedAnnonceToDelete.id);
                  showToast("success", "Annonce supprimée avec succès ✅");
                } catch (err: any) {
                  console.error("[Dashboard][DeleteAnnonce] Erreur brute :", err);
                  showToast("error", err?.code ? translateFirebaseError(err.code) : "Erreur lors de la suppression ❌");
                } finally {
                  setSelectedAnnonceToDelete(null);
                }
              }}
            />
          </>
        )}

        {activeTab === "messages" && (
          <>
            <h2 className="text-2xl font-bold mb-4">Messages</h2>

            <div className="flex gap-2 mb-4">
              <button
                className={`px-4 py-2 rounded-md font-semibold transition ${activeMsgTab === "received" ? "bg-blue-600 text-white shadow" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                onClick={() => setActiveMsgTab("received")}
              >
                Reçus
              </button>
              <button
                className={`px-4 py-2 rounded-md font-semibold transition ${activeMsgTab === "sent" ? "bg-blue-600 text-white shadow" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                onClick={() => setActiveMsgTab("sent")}
              >
                Envoyés
              </button>
            </div>

            {/* Barre d’actions (Messages) */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allMsgsSelected}
                  onChange={() => (allMsgsSelected ? deselectAllMsgs() : selectAllVisibleMsgs())}
                  className="w-4 h-4 appearance-none rounded-full border border-slate-400 bg-white bg-center bg-no-repeat checked:bg-blue-600 checked:border-blue-600 checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22white%22 stroke-width=%222.25%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M3.5 8.5 L6.5 11.5 L12.5 4.5%22/></svg>')] checked:bg-[length:0.85rem_0.85rem] transition-colors"
                />
                <span className="text-sm text-slate-700">Tout ({visibleMsgs.length})</span>
              </label>
              <button type="button" onClick={selectAllVisibleMsgs} className="border px-3 py-1.5 text-sm rounded hover:bg-slate-50">Tout sélectionner</button>
              <button type="button" onClick={deselectAllMsgs} className="border px-3 py-1.5 text-sm rounded hover:bg-slate-50">Tout désélectionner</button>
              <button
                type="button"
                onClick={() => setConfirmMsgBulkOpen(true)}
                disabled={selectedMsgIds.length === 0 || deletingMsgs}
                className="bg-rose-600 text-white px-3 py-1.5 text-sm rounded hover:bg-rose-700 disabled:opacity-60"
              >
                {deletingMsgs ? "Suppression..." : `Supprimer la sélection (${selectedMsgIds.length})`}
              </button>
            </div>

            {activeMsgTab === "received" ? (
              <>
                {messages.length === 0 ? (
                  <p className="text-gray-500">Aucun message reçu.</p>
                ) : (
                  <ul className="space-y-4">
                    {messages.map((msg) => (
                      <li key={msg.id} className="bg-white rounded shadow p-4">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedReceivedIds.includes(msg.id)}
                            onChange={() => toggleSelectMsg(msg.id)}
                            className="mt-1 w-4 h-4 appearance-none rounded-full border border-slate-400 bg-white bg-center bg-no-repeat checked:bg-blue-600 checked:border-blue-600 checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22white%22 stroke-width=%222.25%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M3.5 8.5 L6.5 11.5 L12.5 4.5%22/></svg>')] checked:bg-[length:0.85rem_0.85rem]"
                          />
                          <div className="flex-1">
                            <div className="mb-1 text-gray-600 text-sm">
                              <span className="font-medium">Annonce :</span>{" "}
                              <Link
                                href={`/annonce/${msg.annonceId}`}
                                className="text-blue-600 underline hover:text-blue-700"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {annonceTitles[msg.annonceId] || "Voir l'annonce"}
                              </Link>
                            </div>
                            <div className="mb-2 text-gray-700">
                              <span className="font-semibold">De :</span> {msg.fromEmail}
                            </div>
                            <div className="mb-2 text-gray-700">
                              <span className="font-semibold">Message :</span>{" "}
                              <span className="whitespace-pre-line">{msg.content}</span>
                            </div>
                            <div className="mb-2 text-gray-500 text-xs">
                              {msg.createdAt?.seconds
                                ? new Date(msg.createdAt.seconds * 1000).toLocaleString()
                                : ""}
                            </div>
                            <div className="flex gap-2">
                              <button
                                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                onClick={() => setReplyTo(msg)}
                              >
                                Répondre
                              </button>
                              <button
                                className="bg-rose-600 text-white px-3 py-1 rounded hover:bg-rose-700"
                                onClick={() => handleDeleteSingleMsg(msg.id)}
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {replyTo && (
                  <MessageModal
                    annonceId={replyTo.annonceId}
                    annonceOwnerId={replyTo.fromUserId}
                    isOpen={!!replyTo}
                    onClose={() => setReplyTo(null)}
                    onSent={() => {
                      setReplyTo(null);
                      showToast("success", "Message envoyé ✅");
                    }}
                  />
                )}
              </>
            ) : (
              // Envoyés
              <>
                {sentMessages.length === 0 ? (
                  <p className="text-gray-500">Aucun message envoyé.</p>
                ) : (
                  <ul className="space-y-4">
                    {sentMessages.map((msg) => (
                      <li key={msg.id} className="bg-white rounded shadow p-4">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedSentIds.includes(msg.id)}
                            onChange={() => toggleSelectMsg(msg.id)}
                            className="mt-1 w-4 h-4 appearance-none rounded-full border border-slate-400 bg-white bg-center bg-no-repeat checked:bg-blue-600 checked:border-blue-600 checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22white%22 stroke-width=%222.25%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M3.5 8.5 L6.5 11.5 L12.5 4.5%22/></svg>')] checked:bg-[length:0.85rem_0.85rem]"
                          />
                          <div className="flex-1">
                            <div className="mb-1 text-gray-600 text-sm">
                              <span className="font-medium">Annonce :</span>{" "}
                              <Link
                                href={`/annonce/${msg.annonceId}`}
                                className="text-blue-600 underline hover:text-blue-700"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {annonceTitles[msg.annonceId] || "Annonce"}
                              </Link>
                            </div>
                            <div className="mb-2 text-gray-700">
                              <span className="font-semibold">À :</span> Propriétaire de l'annonce
                            </div>
                            <div className="mb-2 text-gray-700">
                              <span className="font-semibold">Message :</span>{" "}
                              <span className="whitespace-pre-line">{msg.content}</span>
                            </div>
                            <div className="mb-2 text-gray-500 text-xs">
                              {msg.createdAt?.seconds
                                ? new Date(msg.createdAt.seconds * 1000).toLocaleString()
                                : ""}
                            </div>
                            <div>
                              <button
                                className="bg-rose-600 text-white px-3 py-1 rounded hover:bg-rose-700"
                                onClick={() => handleDeleteSingleMsg(msg.id)}
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {/* Confirmation suppression multiple (messages) */}
            <ConfirmModal
              isOpen={confirmMsgBulkOpen}
              onClose={() => setConfirmMsgBulkOpen(false)}
              onConfirm={async () => {
                await performBulkDeleteMsgs();
                setConfirmMsgBulkOpen(false);
              }}
            />
          </>
        )}

        {activeTab === "coloc" && (
          <>
            <h2 className="text-2xl font-semibold mb-4">Mon profil colocataire</h2>
            {/* NOUVEAU: proposition de création si le doc n'existe pas */}
            {hasColocDoc === false && !loadingColoc && (
              <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 px-4 py-3 text-sm">
                Aucun profil trouvé. Cliquez sur “Créer maintenant” ou commencez à remplir le formulaire, l’enregistrement est automatique.
                <button
                  type="button"
                  className="ml-3 underline font-semibold"
                  onClick={saveColocProfile}
                >
                  Créer maintenant
                </button>
              </div>
            )}
            {loadingColoc ? (
              <p className="text-gray-500">Chargement du profil…</p>
            ) : (
              <form onSubmit={(e)=>{e.preventDefault(); saveColocProfile();}} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom</label>
                  <input
                    type="text"
                    value={colocNom}
                    onChange={(e) => setColocNom(e.target.value)}
                    className="border rounded px-3 py-2 w-full"
                    placeholder="Votre nom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ville</label>
                  <input
                    type="text"
                    value={colocVille}
                    onChange={(e) => setColocVille(e.target.value)}
                    className="border rounded px-3 py-2 w-full"
                    placeholder="Ex: Saint-Denis"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Budget (€)</label>
                  <input
                    type="number"
                    value={colocBudget}
                    onChange={(e) => setColocBudget(e.target.value ? Number(e.target.value) : "")}
                    className="border rounded px-3 py-2 w-full"
                    placeholder="Ex: 600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Image (URL)</label>
                  <input
                    type="url"
                    value={colocImageUrl}
                    onChange={(e) => setColocImageUrl(e.target.value)}
                    className="border rounded px-3 py-2 w-full"
                    placeholder="https://…"
                  />
                 <div className="mt-2">
                   <input
                     type="file"
                     accept="image/*"
                     onChange={async (e) => {
                       const f = e.target.files?.[0];
                       if (!f || !user) return;
                       try {
                         const url = await uploadToStorage(f, `colocProfiles/${user.uid}`);
                         setColocImageUrl(url);
                         appToast.success("Photo de profil mise à jour");
                       } catch {
                         appToast.error("Échec de l’upload de la photo de profil");
                       }
                     }}
                   />
                   {colocImageUrl && (
                     <img src={colocImageUrl} alt="profil" className="mt-2 w-28 h-20 object-cover rounded border" />
                   )}
                 </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={colocDescription}
                    onChange={(e) => setColocDescription(e.target.value)}
                    className="border rounded px-3 py-2 w-full"
                    rows={4}
                    placeholder="Parlez de vous, vos critères, etc."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Âge</label>
                    <input
                      type="number"
                      value={colocAge}
                      onChange={(e) => setColocAge(e.target.value ? Number(e.target.value) : "")}
                      className="border rounded px-3 py-2 w-full"
                      placeholder="Ex: 25"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Profession</label>
                    <input
                      type="text"
                      value={colocProfession}
                      onChange={(e) => setColocProfession(e.target.value)}
                      className="border rounded px-3 py-2 w-full"
                      placeholder="Votre profession"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <select className="border rounded px-3 py-2" value={colocGenre} onChange={e=>setColocGenre(e.target.value)}>
                    <option value="">Genre</option><option value="femme">Femme</option><option value="homme">Homme</option><option value="non-binaire">Non-binaire</option><option value="autre">Autre</option>
                  </select>
                  <select className="border rounded px-3 py-2" value={colocOrientation} onChange={e=>setColocOrientation(e.target.value)}>
                    <option value="">Orientation</option><option value="hetero">Hétéro</option><option value="homo">Homo</option><option value="bi">Bi</option><option value="asexuel">Asexuel</option><option value="autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bio courte</label>
                  <input type="text" value={colocBioCourte} onChange={e=>setColocBioCourte(e.target.value)} className="border rounded px-3 py-2 w-full" placeholder="Une phrase pour vous décrire" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Langues (CSV)</label>
                    <input type="text" value={colocLanguesCsv} onChange={e=>setColocLanguesCsv(e.target.value)} className="border rounded px-3 py-2 w-full" placeholder="fr, en, es" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Instagram</label>
                    <input type="text" value={colocInstagram} onChange={e=>setColocInstagram(e.target.value)} className="border rounded px-3 py-2 w-full" placeholder="@handle" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Photos (URLs, CSV)</label>
                  <input type="text" value={colocPhotosCsv} onChange={e=>setColocPhotosCsv(e.target.value)} className="border rounded px-3 py-2 w-full" placeholder="https://… , https://…" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <select className="border rounded px-3 py-2" value={prefGenre} onChange={e=>setPrefGenre(e.target.value)}>
                    <option value="">Préférence colloc (genre)</option><option value="femme">Femme</option><option value="homme">Homme</option><option value="mixte">Mixte</option><option value="peu-importe">Peu importe</option>
                  </select>
                  <div className="flex gap-2">
                    <input type="number" className="border rounded px-3 py-2 w-full" placeholder="Âge min" value={prefAgeMin} onChange={e=>setPrefAgeMin(e.target.value ? Number(e.target.value) : "")} />
                    <input type="number" className="border rounded px-3 py-2 w-full" placeholder="Âge max" value={prefAgeMax} onChange={e=>setPrefAgeMax(e.target.value ? Number(e.target.value) : "")} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={accepteFumeurs} onChange={e=>setAccepteFumeurs(e.target.checked)} className="w-5 h-5 appearance-none rounded-full border border-slate-400 bg-white bg-center bg-no-repeat transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 checked:bg-blue-600 checked:border-blue-600 checked:ring-2 checked:ring-blue-300 checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22white%22 stroke-width=%223%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M3 8.2 L6.2 11.4 L13 4.6%22/></svg>')] checked:bg-[length:1rem_1rem]"
                  />
                  Accepte fumeurs
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={accepteAnimaux} onChange={e=>setAccepteAnimaux(e.target.checked)} className="w-5 h-5 appearance-none rounded-full border border-slate-400 bg-white bg-center bg-no-repeat transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 checked:bg-blue-600 checked:border-blue-600 checked:ring-2 checked:ring-blue-300 checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22white%22 stroke-width=%223%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M3 8.2 L6.2 11.4 L13 4.6%22/></svg>')] checked:bg-[length:1rem_1rem]"
                  />
                  Accepte animaux
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <select className="border rounded px-3 py-2" value={rythme} onChange={e=>setRythme(e.target.value)}>
                    <option value="">Rythme</option><option value="matinal">Matinal</option><option value="noctambule">Noctambule</option><option value="flexible">Flexible</option>
                  </select>
                  <select className="border rounded px-3 py-2" value={proprete} onChange={e=>setProprete(e.target.value)}>
                    <option value="">Propreté</option><option value="relaxe">Relaxe</option><option value="normal">Normal</option><option value="maniaque">Maniaque</option>
                  </select>
                  <input type="text" className="border rounded px-3 py-2" placeholder="Musique (artistes…)" value={musique} onChange={e=>setMusique(e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={sportif} onChange={e=>setSportif(e.target.checked)} className="w-5 h-5 appearance-none rounded-full border border-slate-400 bg-white bg-center bg-no-repeat transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 checked:bg-blue-600 checked:border-blue-600 checked:ring-2 checked:ring-blue-300 checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22white%22 stroke-width=%223%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M3 8.2 L6.2 11.4 L13 4.6%22/></svg>')] checked:bg-[length:1rem_1rem]" />
                    Sportif
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={vegetarien} onChange={e=>setVegetarien(e.target.checked)} className="w-5 h-5 appearance-none rounded-full border border-slate-400 bg-white bg-center bg-no-repeat transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 checked:bg-blue-600 checked:border-blue-600 checked:ring-2 checked:ring-blue-300 checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22white%22 stroke-width=%223%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M3 8.2 L6.2 11.4 L13 4.6%22/></svg>')] checked:bg-[length:1rem_1rem]" />
                    Végétarien
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={soirees} onChange={e=>setSoirees(e.target.checked)} className="w-5 h-5 appearance-none rounded-full border border-slate-400 bg-white bg-center bg-no-repeat transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 checked:bg-blue-600 checked:border-blue-600 checked:ring-2 checked:ring-blue-300 checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22white%22 stroke-width=%223%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M3 8.2 L6.2 11.4 L13 4.6%22/></svg>')] checked:bg-[length:1rem_1rem]" />
                    Aime les soirées
                  </label>
                </div>
                {/* Ajout: fermeture du conteneur grid-cols-2 manquante */}
                </div>
                {/* Remplacement: zones/communes par la carte de sélection */}
                <div className="mt-2">
                  <label className="block text-sm font-medium mb-2">Zones recherchées (sélection par communes)</label>
                  <div className="rounded-2xl border border-slate-200 p-3">
                    <CommuneZoneSelector
                      value={colocCommunesSlugs}
                      computeZonesFromSlugs={computeZonesFromSlugs}
                      onChange={(slugs, zones = []) => {
                        setColocCommunesSlugs((prev) => (sameIds(prev, slugs) ? prev : slugs));
                        setColocZones((prev) => (sameIds(prev, zones) ? prev : zones));
                      }}
                      height={420}
                      className="w-full"
                      alwaysMultiSelect
                    />
                  </div>
                  {colocCommunesSlugs.length > 0 && (
                    <p className="mt-2 text-xs text-slate-600">
                      Communes sélectionnées: {colocCommunesSlugs.join(", ")}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={deleteColocProfile}
                    className="px-4 py-2 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                  >
                    Supprimer le profil
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                  >
                    {savingColoc ? "Enregistrement..." : "Enregistrer le profil"}
                  </button>
                </div>
                <p className="text-xs text-slate-500 -mt-2">Enregistrement automatique activé.</p>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

