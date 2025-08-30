"use client";

import { useState, useEffect, useMemo, useCallback, useRef, type MouseEvent } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { db, collection, query, where, orderBy, onSnapshot, doc, serverTimestamp, setDoc, deleteDoc, getDocs } from "@/lib/firebaseShim";
import Image from "next/image";
import dynamic from "next/dynamic";
// import ExpandableImage from "@/components/ui/ExpandableImage";
import PhotoUploader from "@/components/forms/PhotoUploader";
const ImageLightbox = dynamic(() => import("@/components/modals/ImageLightbox"), { ssr: false });
import AnnonceCard from "@/components/cards/AnnonceCard";
import AnnonceModal from "@/components/modals/AnnonceModal";
import ConfirmModal from "@/components/modals/ConfirmModal";
import { toast as appToast } from "@/components/ui/feedback/Toast";
// import { v4 as uuidv4 } from "uuid";
import MessageModal from "@/components/modals/MessageModal";
import { listUserAnnoncesPage, addAnnonce, updateAnnonce, deleteAnnonce as deleteAnnonceSvc } from "@/lib/services/annonceService";
// import { listMessagesForOwner } from "@/lib/services/messageService";
import { getUserRole } from "@/lib/services/userService";
import Link from "next/link";
import useCommuneSelection from "@/hooks/useCommuneSelection";
import useMessagesData from "@/hooks/useMessagesData";
import CommuneZoneSelector from "@/components/map/CommuneZoneSelector";
// import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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

// Options de langues (liste déroulante)
const LANG_OPTIONS = [
  "Français",
  "Anglais",
  "Créole réunionnais",
  "Malgache",
  "Comorien",
  "Tamoul",
  "Arabe",
  "Chinois",
  // En dernier comme demandé
  "Espagnol",
  "Allemand",
  "Italien",
  "Portugais",
];

// [DÉPLACÉ ICI] utils + helpers qui utilisent les constantes ci‑dessus
const slugify = (s: string) =>
  (s || "")
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Index des sous-communes par commune parente (clé: parentSlug -> liste de noms de sous-communes)
const SUBS_BY_PARENT: Record<string, string[]> = (() => {
  const map: Record<string, string[]> = {};
  SUB_COMMUNES.forEach(({ name, parent }) => {
    const ps = slugify(parent);
    if (!map[ps]) map[ps] = [];
    map[ps].push(name);
  });
  return map;
})();

// Extrait un label de sous-communes détectées dans les textes fournis, limité à quelques occurrences
function extractSubCommunesLabel(texts: Array<string | null | undefined>, parentSlug?: string) {
  if (!parentSlug) return undefined;
  const names = SUBS_BY_PARENT[parentSlug];
  if (!names || names.length === 0) return undefined;
  const found = new Set<string>();
  for (const t of texts) {
    const s = (t || '').toString();
    if (!s) continue;
    for (const n of names) {
      if (s.includes(n)) found.add(n);
    }
  }
  if (found.size === 0) return undefined;
  const arr = Array.from(found);
  arr.sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
  return arr.slice(0, 3).join(', ');
}

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
const defaultAnnonceImg = "/images/annonce-holder.svg";

// Fallback image pour profils colocataires (utilisé uniquement pour l'UI coloc)
const defaultColocImg = "/images/coloc-holder.svg";

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

// uploadToStorage helper removed (unused)

// Helper to translate Firebase error codes to user-friendly messages
function translateFirebaseError(code: string): string {
  switch (code) {
    case "permission-denied":
      return "Accès refusé. Vous n'avez pas la permission d'effectuer cette action.";
    case "unavailable":
      return "Le service est temporairement indisponible. Veuillez réessayer plus tard.";
    case "not-found":
      return "Ressource introuvable.";
    case "already-exists":
      return "Cette ressource existe déjà.";
    case "failed-precondition":
      return "Condition préalable non remplie (index Firestore en cours de création ?)";
    default:
      return `Erreur : ${code}`;
  }
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const user = session?.user as any;
  const loading = status === "loading";
  const router = useRouter();
  const [mesAnnonces, setMesAnnonces] = useState<any[]>([]);
  const [loadingAnnonces, setLoadingAnnonces] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editAnnonce, setEditAnnonce] = useState<any | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedAnnonceToDelete, setSelectedAnnonceToDelete] = useState<any | null>(null);
  // local toasts state not used anymore; rely on global appToast
  const showToast = (type: "success" | "error" | "info", message: string) => {
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
  const [colocBudget, setColocBudget] = useState<number | "">("");
  const [colocImageUrl, setColocImageUrl] = useState("");
  const [colocPhotos, setColocPhotos] = useState<{url:string;isMain:boolean}[]>([]);
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
  // photos are handled via uploader; remove CSV input support
  const [colocPhotosCsv, setColocPhotosCsv] = useState(""); // legacy - kept for compatibility but not used in UI
  // Lightbox for coloc profile images
  const [colocGalleryIndex, setColocGalleryIndex] = useState<number>(0);
  const [colocLightboxOpen, setColocLightboxOpen] = useState<boolean>(false);
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
  const [colocEditing, setColocEditing] = useState(false);
  // Profil considéré "significatif" si au moins un champ utile est renseigné
  const hasMeaningfulColocData = useMemo(() => {
    const hasBudget = typeof colocBudget === "number" && colocBudget > 0;
    return !!(
      (colocNom && colocNom.trim()) ||
      hasBudget ||
      (colocDescription && colocDescription.trim()) ||
      (Array.isArray(colocZones) && colocZones.length) ||
      (Array.isArray(colocCommunesSlugs) && colocCommunesSlugs.length) ||
      (colocImageUrl && colocImageUrl.trim())
    );
  }, [colocNom, colocBudget, colocDescription, colocZones, colocCommunesSlugs, colocImageUrl]);

  // Dérivé: langues sélectionnées (depuis CSV)
  const languesSelected = useMemo(() => (
    colocLanguesCsv
      ? colocLanguesCsv.split(",").map((s) => s.trim()).filter(Boolean)
      : []
  ), [colocLanguesCsv]);
  // Référence pour faire défiler vers le formulaire coloc
  const colocFormRef = useRef<HTMLFormElement | null>(null);
  const scrollToColocForm = useCallback(() => {
    try {
      const el = colocFormRef.current;
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {}
  }, []);

  // Formulaire caché par défaut. Ouverture uniquement via actions (Créer/Modifier).
  // On ne force plus la fermeture automatique pendant la saisie.

  const handleFirestoreError = useCallback((err: any, context: string) => {
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
  }
  }, [userRole]);

  const { overrideVille, setOverrideVille, MAIN_COMMUNES_SORTED, SUB_COMMUNES_SORTED } =
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

  const loadUserDoc = useCallback(async (u: any) => {
    try {
      if (!u) return;
      const role = await getUserRole(u.uid);
      setUserRole(role);
    } catch (e) {
      console.warn("[Dashboard][UserDoc] échec :", e);
    } finally {
      setUserDocLoaded(true);
    }
  }, []);

  // Helper pour comparer createdAt de manière robuste (Timestamp Firestore/Date/number/string)
  const createdAtMs = useCallback((x: any) => {
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
  }, []);

  // Liste triée par date desc pour l’affichage
  const sortedAnnonces = useMemo(
  () => [...mesAnnonces].sort((a, b) => createdAtMs(b) - createdAtMs(a)),
  [mesAnnonces, createdAtMs]
  );

  // IDs visibles (pour tout sélectionner/désélectionner)
  const visibleIds = useMemo(() => sortedAnnonces.map(a => a.id), [sortedAnnonces]);

  // Nettoie la sélection si la liste visible change (évite les IDs orphelins)
  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => visibleIds.includes(id)));
  }, [visibleIds]);

  const loadAnnonces = useCallback(async () => {
    if (!user || loadingMore || !hasMore || firestoreError) return;

    // Premier chargement: activer le spinner principal
    const isInitial = !lastDoc && mesAnnonces.length === 0;
    if (isInitial) setLoadingAnnonces(true);

    setLoadingMore(true);
    try {
  const { items, lastId: newLast } = await listUserAnnoncesPage(user.uid, { lastId: lastDoc ?? undefined, pageSize: 10 });

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
  }, [user, loadingMore, hasMore, firestoreError, lastDoc, mesAnnonces, handleFirestoreError, createdAtMs]);

  // Chargement du profil coloc depuis Firestore

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
          // ville supprimée du profil coloc
          setColocBudget(typeof d.budget === "number" ? d.budget : "");
          setColocImageUrl(d.imageUrl || "");
          // load photos array (if present) into uploader state
          if (Array.isArray(d.photos) && d.photos.length) {
            setColocPhotos((d.photos as string[]).map((u: string) => ({ url: u, isMain: (d.imageUrl ? u === d.imageUrl : false) })));
          } else {
            setColocPhotos([]);
          }
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
  // ville supprimée du profil coloc
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  // NOUVEAU: autosave silencieux (création si besoin) avec debounce
  // track last saved payload to avoid redundant writes
  const lastSavedRef = useRef<string | null>(null);

  // NOUVEAU: sauvegarde silencieuse (pas de toast/UI), merge + createdAt au premier enregistrement
  const autoSaveColoc = useCallback(async () => {
    if (!user) return;
    try {
  // reference kept internal to API route
      const payload: any = {
        uid: user.uid,
        email: user.email || null,
        nom: colocNom,
  // ville supprimée du profil coloc
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
  // photos: use uploader / stored array instead of CSV
  photos: undefined,
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
        if (
          v === undefined ||
          v === "" ||
          v === null ||
          (Array.isArray(v) && v.length === 0)
        ) {
          delete (payload as any)[k];
        }
      });
      // avoid unnecessary writes: only enqueue autosave when payload changed
      try {
        const key = JSON.stringify(payload);
        if (lastSavedRef.current === key) return;
        // retrieve current user's ID token to authenticate the request
        try {
          await fetch('/api/coloc-autosave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payload }),
          });
          lastSavedRef.current = key;
        } catch {
          console.warn('[autoSaveColoc] enqueue failed');
        }
      } catch {
        console.warn('[autoSaveColoc] payload serialisation failed');
      }
    } catch {
      // silencieux
    }
  }, [user, colocNom, colocBudget, colocImageUrl, colocDescription, colocAge, colocProfession, colocFumeur, colocAnimaux, colocDateDispo, colocQuartiers, colocTelephone, colocZones, colocCommunesSlugs, colocGenre, colocOrientation, colocBioCourte, colocLanguesCsv, colocInstagram, prefGenre, prefAgeMin, prefAgeMax, accepteFumeurs, accepteAnimaux, rythme, proprete, sportif, vegetarien, soirees, musique, hasColocDoc]);

  // Déclenchement auto-save avec debounce (après déclaration pour éviter TDZ)
  useEffect(() => {
    if (!colocReady || activeTab !== "coloc" || !user) return;
    const t = setTimeout(() => {
      autoSaveColoc();
    }, 2000); // increased debounce to reduce write frequency
    return () => clearTimeout(t);
  }, [
    colocNom,
  // ville supprimée du profil coloc
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
    user,
    autoSaveColoc
  ]);

  const saveColocProfile = async () => {
    if (!user) return;
    setSavingColoc(true);
    try {
      const ref = doc(db, "colocProfiles", user.uid);
      const payload: any = {
        uid: user.uid,
        email: user.email || null,
        nom: colocNom,
  // ville supprimée du profil coloc
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
  photos: colocPhotos && colocPhotos.length ? colocPhotos.map(p => p.url) : undefined,
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
      // Nettoyage des champs vides/null/undefined (sauf booléens) et tableaux vides
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
      await setDoc(ref, payload, { merge: true });
      showToast("success", "Profil colocataire enregistré ✅");
  // Masquer le formulaire après l'enregistrement
  setColocEditing(false);
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
      // remove stored photos (meta + storage) when deleting profile
      try {
        const { deleteColocPhotoWithMeta } = await import("@/lib/photoService");
        if (Array.isArray(colocPhotos) && colocPhotos.length) {
          await Promise.all(colocPhotos.map(p => p.url ? deleteColocPhotoWithMeta(user.uid, p.url).catch(()=>{}) : Promise.resolve()));
        }
      } catch (e) {
        console.warn('Erreur lors de la suppression des photos associées au profil', e);
      }
      await deleteDoc(doc(db, "colocProfiles", user.uid));
      // Reset des états
      setColocNom("");
  // ville supprimée du profil coloc
      setColocBudget("");
      setColocImageUrl("");
  setColocPhotos([]);
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
  setColocPhotos([]);
      setPrefGenre(""); setPrefAgeMin(""); setPrefAgeMax(""); setAccepteFumeurs(false); setAccepteAnimaux(false);
      setRythme(""); setProprete(""); setSportif(false); setVegetarien(false); setSoirees(false); setMusique("");
  setColocEditing(false);
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
  }, [user, loadUserDoc]);

  useEffect(() => {
    if (loading || firestoreError) return;

    if (!user) {
      router.push("/login");
      return;
    }
    // Attendre d’avoir tenté de charger le doc user pour éviter permission-denied précoce
    if (!userDocLoaded) return;
    loadAnnonces();
  }, [user, loading, lastDoc, firestoreError, userDocLoaded, router, loadAnnonces]);

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
  }, [hasMore, loadingMore, loadAnnonces]);

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
        const snap: any = await getDocs(q as any);
        const titles: Record<string, string> = {};
        (snap.docs || []).forEach((d: any) => {
          const data = d?.data ? d.data() : {};
          if (data && data.titre) {
            titles[d.id] = data.titre;
          }
        });
        setAnnonceTitles(titles);
      } catch (err: any) {
        handleFirestoreError(err, "fetchAnnonceTitles");
      }
    };

    fetchAnnonces();
  }, [messages, sentMessages, user, firestoreError, userDocLoaded, handleFirestoreError]);

  useEffect(() => {
    if (!user || firestoreError || !userDocLoaded) return;
    const unsubs: Array<() => void> = [];
    setLoadingAnnonces(true);

  const attach = (qAny: any, label: string, fallbackField: "uid" | "ownerId" | "userId" = "uid") => {
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
                query(collection(db, "annonces"), where(fallbackField, "==", user.uid)),
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
      "uid",
      "uid"
    );
    // Essayer aussi avec ownerId (selon service)
    attach(
      query(collection(db, "annonces"), where("ownerId", "==", user.uid), orderBy("createdAt", "desc")),
      "ownerId",
      "ownerId"
    );
    // Et avec userId (champ utilisé à la création d'annonce)
    attach(
      query(collection(db, "annonces"), where("userId", "==", user.uid), orderBy("createdAt", "desc")),
      "userId",
      "userId"
    );

    return () => {
      unsubs.forEach((u) => {
        try { u(); } catch {}
      });
    };
  }, [user, firestoreError, userDocLoaded, handleFirestoreError, createdAtMs]);

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
    } catch {
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
    // La suppression peut lever; inutile de l'envelopper dans un try/catch qui relance
    await deleteDoc(doc(db, "messages", id));
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
                    {(() => {
                      const parentSlug = annonce?.communeSlug || (annonce?.ville ? slugify(String(annonce.ville)) : undefined);
                      const subLabel = extractSubCommunesLabel([annonce?.titre, annonce?.description, annonce?.ville], parentSlug);
                      return (
                        <AnnonceCard
                          {...annonce}
                          imageUrl={annonce.imageUrl || defaultAnnonceImg}
                          subCommunesLabel={subLabel || undefined}
                          onDelete={() => {
                            setSelectedAnnonceToDelete(annonce);
                            setConfirmModalOpen(true);
                          }}
                          onEdit={() => {
                            setEditAnnonce(annonce);
                            setModalOpen(true);
                          }}
                        />
                      );
                    })()}
                  </div>
                ))}
                {loadingMore && <p className="text-center text-gray-500 mt-4">Chargement…</p>}
                {/* Message de fin de liste retiré */}
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
                            className="mt-1 w-4 h-4 appearance-none rounded-full border border-slate-400 bg-white bg-center bg-no-repeat checked:bg-blue-600 checked:border-blue-600 checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22white%22 stroke-width=%222.25%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M3 8.2 L6.2 11.4 L13 4.6%22/></svg>')] checked:bg-[length:0.85rem_0.85rem]"
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
                            className="mt-1 w-4 h-4 appearance-none rounded-full border border-slate-400 bg-white bg-center bg-no-repeat checked:bg-blue-600 checked:border-blue-600 checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22white%22 stroke-width=%222.25%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M3 8.2 L6.2 11.4 L13 4.6%22/></svg>')] checked:bg-[length:0.85rem_0.85rem]"
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
                              <span className="font-semibold">À :</span> Propriétaire de l&apos;annonce
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
            {/* Mon profil colocataire - Affichage complet (caché pendant l'édition/création) */}
            {!colocEditing && hasColocDoc && hasMeaningfulColocData && (
              <section className="mt-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">🧑‍🤝‍🧑 Mon profil colocataire</h2>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-4 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                      onClick={() => {
                        setColocEditing(true);
                        setTimeout(scrollToColocForm, 50);
                      }}
                    >
                      Modifier
                    </button>
                    <button
                      className="px-4 py-2 rounded-md bg-rose-600 text-white font-semibold hover:bg-rose-700 transition"
                      onClick={deleteColocProfile}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
                <div className="mt-4 rounded-lg border border-slate-200 p-4 flex flex-col sm:flex-row gap-4">
                  <Image
                    src={colocImageUrl || defaultColocImg}
                    alt="Photo de profil"
                    width={128}
                    height={128}
                    className="w-32 h-32 object-cover rounded-lg border"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      // compute gallery image list and open lightbox at the main image position
                      const galleryImages = (colocPhotos && colocPhotos.length) ? colocPhotos.map(p => p.url) : (colocImageUrl ? [colocImageUrl] : [defaultColocImg]);
                      // try exact match to the stored main URL
                      let idx = galleryImages.findIndex((u) => u === colocImageUrl);
                      // fallback: find the item flagged as isMain in colocPhotos
                      if (idx === -1 && Array.isArray(colocPhotos) && colocPhotos.length) {
                        const mainIdx = colocPhotos.findIndex((p) => !!p.isMain);
                        if (mainIdx >= 0) idx = mainIdx;
                      }
                      if (idx === -1) idx = 0;
                      setColocGalleryIndex(idx);
                      setColocLightboxOpen(true);
                    }}
                  />
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="text-sm text-slate-500">🧑 Nom</div>
                      <div className="font-medium">{colocNom || "-"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">💶 Budget</div>
                      <div className="font-medium">{typeof colocBudget === 'number' ? `${colocBudget} €` : '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">🎂 Âge</div>
                      <div className="font-medium">{typeof colocAge === 'number' ? colocAge : '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">💼 Profession</div>
                      <div className="font-medium">{colocProfession || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">⚧️ Genre</div>
                      <div className="font-medium">{colocGenre || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">🧭 Orientation</div>
                      <div className="font-medium">{colocOrientation || '-'}</div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-sm text-slate-500">📝 Bio courte</div>
                      <div className="text-slate-700">{colocBioCourte || '-'}</div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-sm text-slate-500">📍 Zone recherchée(s)</div>
                      {(Array.isArray(colocZones) && colocZones.length > 0) ? (
                        <div className="mt-1 flex flex-wrap gap-2">
                          {colocZones.map((z: string) => (
                            <span key={z} className="px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">{z}</span>
                          ))}
                        </div>
                      ) : (
                        <div className="font-medium">-</div>
                      )}
                    </div>
                    {/* Secteur recherché (communes) */}
                    <div className="sm:col-span-2">
                      <div className="text-sm text-slate-500">🗺️ Secteur recherché</div>
                      {(Array.isArray(colocCommunesSlugs) && colocCommunesSlugs.length > 0) ? (
                        <div className="mt-1 flex flex-wrap gap-2">
                          {colocCommunesSlugs.map((s: string) => (
                            <span key={s} className="px-2 py-1 rounded-full text-xs bg-slate-50 text-slate-700 border border-slate-200">{SLUG_TO_NAME[s] || s}</span>
                          ))}
                        </div>
                      ) : (
                        <div className="font-medium">-</div>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-sm text-slate-500">🧾 Description</div>
                      <div className="text-slate-700 whitespace-pre-line">{colocDescription || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">📸 Instagram</div>
                      <div className="font-medium">{colocInstagram || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">📞 Téléphone</div>
                      <div className="font-medium">{colocTelephone || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">📅 Date de disponibilité</div>
                      <div className="font-medium">{colocDateDispo || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">🏘️ Quartiers</div>
                      <div className="font-medium">{colocQuartiers || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">🚬 Je fume</div>
                      <div className="font-medium">{colocFumeur ? 'Oui' : 'Non'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">🐾 J&apos;ai des animaux</div>
                      <div className="font-medium">{colocAnimaux ? 'Oui' : 'Non'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">🚭 Accepte fumeurs</div>
                      <div className="font-medium">{accepteFumeurs ? 'Oui' : 'Non'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">🐶 Accepte animaux</div>
                      <div className="font-medium">{accepteAnimaux ? 'Oui' : 'Non'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">⏰ Rythme</div>
                      <div className="font-medium">{rythme || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">🧽 Propreté</div>
                      <div className="font-medium">{proprete || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">🏃 Sportif</div>
                      <div className="font-medium">{sportif ? 'Oui' : 'Non'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">🥗 Végétarien</div>
                      <div className="font-medium">{vegetarien ? 'Oui' : 'Non'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">🎉 Aime les soirées</div>
                      <div className="font-medium">{soirees ? 'Oui' : 'Non'}</div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-sm text-slate-500">🎵 Musique</div>
                      <div className="font-medium">{musique || '-'}</div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-sm text-slate-500">🗣️ Langues</div>
                      {languesSelected.length ? (
                        <div className="mt-1 flex flex-wrap gap-2">
                          {languesSelected.map((l) => (
                            <span key={l} className="px-2 py-1 rounded-full text-xs bg-slate-50 text-slate-700 border border-slate-200">{l}</span>
                          ))}
                        </div>
                      ) : (
                        <div className="font-medium">-</div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">👥 Préférence colloc (genre)</div>
                      <div className="font-medium">{prefGenre || '-'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">🔢 Tranche d&apos;âge souhaitée</div>
                      <div className="font-medium">{(prefAgeMin !== '' || prefAgeMax !== '') ? `${prefAgeMin !== '' ? prefAgeMin : '—'} - ${prefAgeMax !== '' ? prefAgeMax : '—'}` : '-'}</div>
                    </div>
                  </div>
                </div>
                {/* Galerie de photos */}
                <div className="mt-4">
                  <div className="text-sm text-slate-500 mb-2">📷 Photos</div>
                  {colocPhotos && colocPhotos.length ? (
                    <div className="flex gap-2 flex-wrap">
                      {colocPhotos.map((p, idx) => (
                        <div key={p.url || idx} className="w-20 h-20 rounded overflow-hidden border cursor-pointer" onClick={() => { setColocGalleryIndex(idx); setColocLightboxOpen(true); }}>
                          <Image src={p.url} alt={`photo-${idx}`} width={80} height={80} className="w-full h-full object-cover" sizes="80px" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-600">-</div>
                  )}
                </div>
                {colocLightboxOpen && (
                  <ImageLightbox
                    images={colocPhotos && colocPhotos.length ? colocPhotos.map(p => p.url) : (colocImageUrl ? [colocImageUrl] : [defaultColocImg])}
                    initialIndex={colocGalleryIndex}
                    onClose={() => setColocLightboxOpen(false)}
                  />
                )}
              </section>
            )}

            {/* Invite à créer le profil quand vide ou inexistant (cachée si le formulaire est ouvert) */}
            {(!colocEditing && (!hasColocDoc || (hasColocDoc && !hasMeaningfulColocData))) && (
              <section className="mt-8">
                <div className="rounded-md border border-dashed p-4 text-center">
                  <p className="mb-3">Vous n’avez pas encore renseigné votre profil colocataire.</p>
                  <button
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg hover:from-blue-700 hover:to-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 transition-transform duration-200 will-change-transform hover:scale-[1.02] active:scale-[0.99]"
                    onClick={() => {
                      setColocEditing(true);
                      setTimeout(scrollToColocForm, 50);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M12 4.5a.75.75 0 01.75.75v6h6a.75.75 0 010 1.5h-6v6a.75.75 0 01-1.5 0v-6h-6a.75.75 0 010-1.5h6v-6A.75.75 0 0112 4.5z" clipRule="evenodd" />
                    </svg>
                    Créer mon profil
                  </button>
                </div>
              </section>
            )}

            {loadingColoc ? (
              <p className="text-gray-500">Chargement du profil…</p>
            ) : (colocEditing ? (
              <form ref={colocFormRef} onSubmit={(e)=>{e.preventDefault(); saveColocProfile();}} className="flex flex-col gap-4">
                {/* Actions en haut du formulaire */}
                <div className="sticky top-16 z-20 -mx-6 px-6 py-3 bg-white flex justify-center gap-3 border-b border-slate-200 shadow-sm">
                  {hasColocDoc && hasMeaningfulColocData && (
                    <button
                      type="button"
                      onClick={deleteColocProfile}
                      className="px-4 py-2 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                    >
                      Supprimer le profil
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                  >
                    {savingColoc ? "Enregistrement..." : "Enregistrer le profil"}
                  </button>
                </div>
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
                {/* Champ Ville supprimé: on utilise désormais les Zones/Communes via la carte */}
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
                  <label className="block text-sm font-medium mb-1">Photos</label>
                  <PhotoUploader
                    initial={colocPhotos.map(p => p.url)}
                    initialMain={colocPhotos.find(p=>p.isMain)?.url}
                    resourceType="coloc"
                    resourceId={user?.uid}
                    openOnClick={true}
                    onChange={(photos) => {
                      // photos: {url,isMain}[]
                      setColocPhotos(photos.map(p=>({ url: p.url, isMain: !!p.isMain })));
                      const main = photos.find(p => p.isMain)?.url || photos[0]?.url || "";
                      if (main) setColocImageUrl(main);
                    }}
                  />
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
                    <label className="block text-sm font-medium mb-1">Langues</label>
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                      {LANG_OPTIONS.map((l) => {
                        const id = `lang-${l}`;
                        const checked = languesSelected.includes(l);
                        return (
                          <label key={l} htmlFor={id} className="inline-flex items-center gap-2 text-sm">
                            <input
                              id={id}
                              type="checkbox"
                              className="w-4 h-4 appearance-none rounded border border-slate-400 bg-white bg-center bg-no-repeat checked:bg-blue-600 checked:border-blue-600 checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22white%22 stroke-width=%222.25%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M3.5 8.5 L6.5 11.5 L12.5 4.5%22/></svg>')] checked:bg-[length:0.85rem_0.85rem]"
                              checked={checked}
                              onChange={(e) => {
                                const set = new Set(languesSelected);
                                if (e.target.checked) set.add(l); else set.delete(l);
                                const arr = Array.from(set);
                                setColocLanguesCsv(arr.join(", "));
                              }}
                            />
                            {l}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Instagram</label>
                    <input type="text" value={colocInstagram} onChange={e=>setColocInstagram(e.target.value)} className="border rounded px-3 py-2 w-full" placeholder="@handle" />
                  </div>
                </div>
                {/* legacy CSV input removed - photos managed by PhotoUploader above */}
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
                  <label className="block text-sm font-medium mb-2">Zone recherchée(s)</label>
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
                      hideSelectionSummary
                    />
                  </div>
                  {/* Tuto d'utilisation de la carte */}
                  <div className="mt-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md p-3">
                    <p className="font-medium text-slate-700 mb-1">Comment utiliser la carte</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Cliquez sur une commune pour la sélectionner ou la retirer.</li>
                      <li>Choisissez-en plusieurs si besoin; les zones sont calculées automatiquement.</li>
                      <li>Utilisez la molette ou les boutons +/− pour zoomer/dézoomer; maintenez le clic pour déplacer la carte.</li>
                      <li>Deux boutons en haut à droite: « Réinitialiser » (revient à la vue initiale) et « Zoom sélection » (cadre les communes choisies).</li>
                      <li>La liste des communes sélectionnées s’affiche ci-dessous.</li>
                    </ul>
                  </div>
                  {colocCommunesSlugs.length > 0 && (
                    <div className="mt-3">
                      <div className="bg-white rounded-xl border border-slate-200 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-medium text-slate-600">Secteur recherché</div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200">{colocCommunesSlugs.length}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {colocCommunesSlugs.map((s: string) => (
                            <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-50 text-slate-700 border border-slate-200">{SLUG_TO_NAME[s] || s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {Array.isArray(colocZones) && colocZones.length > 0 && (
                    <div className="mt-3">
                      <div className="bg-white rounded-xl border border-slate-200 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-medium text-slate-600">Zones sélectionnées</div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200">{colocZones.length}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {colocZones.map((z: string) => (
                            <span key={z} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">{z}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Boutons déplacés en haut du formulaire */}
              </form>
            ) : null)}
          </>
        )}
      </div>
    </div>
  );
}

