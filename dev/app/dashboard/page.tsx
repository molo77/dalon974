"use client";

import { useState, useEffect, useMemo, useCallback, useRef, type MouseEvent, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
// import ExpandableImage from "@/shared/components/ExpandableImage";
import PhotoUploader from "@/shared/components/PhotoUploader";
const ImageLightbox = dynamic(() => import("@/shared/components/ImageLightbox"), { ssr: false });
import AnnonceCard from "@/shared/components/AnnonceCard";
import AnnonceModal from "@/shared/components/AnnonceModal";
import ConfirmModal from "@/shared/components/ConfirmModal";
import AnnonceDetailModal from "@/shared/components/AnnonceDetailModal";
import { toast as appToast } from "@/shared/components/feedback/Toast";
// import { v4 as uuidv4 } from "uuid";
import { listUserAnnoncesPage, addAnnonce, updateAnnonce, deleteAnnonce as deleteAnnonceSvc } from "@/core/business/annonceService";
import { getUserRole } from "@/core/business/userService";
import { getColocProfile, saveColocProfile, deleteColocProfile, type ColocProfileData } from "@/core/business/colocProfileClientService";
import Link from "next/link";
import AdBlock from "@/shared/components/AdBlock";
import useCommuneSelection from "@/shared/hooks/useCommuneSelection";
import CommuneZoneSelector from "@/shared/components/map/CommuneZoneSelector";
import MessagesSection from "@/features/dashboard/MessagesSection";

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
function computeZonesFromSlugs(slugs: string[] | undefined | null): string[] {
  if (!slugs || !Array.isArray(slugs)) return [];
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

// Composant pour gérer les paramètres de recherche avec Suspense
function DashboardContent() {
  const { data: session, status } = useSession();
  const user = session?.user as any;
  const loading = status === "loading";
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mesAnnonces, setMesAnnonces] = useState<any[]>([]);
  const [loadingAnnonces, setLoadingAnnonces] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editAnnonce, setEditAnnonce] = useState<any | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedAnnonceToDelete, setSelectedAnnonceToDelete] = useState<any | null>(null);
  const [selectedAnnonceForDetail, setSelectedAnnonceForDetail] = useState<any | null>(null);
  // local toasts state not used anymore; rely on global appToast
  const showToast = (type: "success" | "error" | "info", message: string) => {
    // Toaster global pour visibilité sur toute page
    appToast[type](message);
  };

  const [lastDoc, setLastDoc] = useState<any | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userDocLoaded, setUserDocLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<"annonces" | "messages" | "coloc" | "match">("annonces");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);

  // États pour l'onglet Match
  const [matchLoading, setMatchLoading] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [matchType, setMatchType] = useState<"annonces" | "profils">("annonces");
  const [colocDetailOpen, setColocDetailOpen] = useState(false);
  const [colocDetail, setColocDetail] = useState<any | null>(null);

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
  const [prefZones, setPrefZones] = useState<string[]>([]);
  const [prefCommunesSlugs, setPrefCommunesSlugs] = useState<string[]>([]);
  const [prefFumeur, setPrefFumeur] = useState(false);
  const [prefAnimaux, setPrefAnimaux] = useState(false);
  const [prefProfession, setPrefProfession] = useState("");
  const [prefLangues, setPrefLangues] = useState("");
  const [prefMusique, setPrefMusique] = useState("");
  const [prefSport, setPrefSport] = useState("");
  const [prefCuisine, setPrefCuisine] = useState("");
  const [prefVoyage, setPrefVoyage] = useState("");
  const [prefSorties, setPrefSorties] = useState("");
  const [prefSoirees, setPrefSoirees] = useState("");
  const [prefCalme, setPrefCalme] = useState("");
  const [prefProprete, setPrefProprete] = useState("");
  const [prefInvites, setPrefInvites] = useState("");
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


  const { overrideVille, setOverrideVille, MAIN_COMMUNES_SORTED, SUB_COMMUNES_SORTED } =
    useCommuneSelection({
      modalOpen,
      editAnnonce,
      CP_TO_COMMUNE,
      SUB_COMMUNES,
      pickOfficialVilleFromInput,
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

  // Liste triée par date desc pour l'affichage
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
    if (!user || loadingMore || !hasMore) return;

    // Premier chargement: activer le spinner principal
    const isInitial = !lastDoc && mesAnnonces.length === 0;
    if (isInitial) setLoadingAnnonces(true);

    setLoadingMore(true);
    try {
      const { items, lastId: newLast } = await listUserAnnoncesPage(user.id, { lastId: lastDoc ?? undefined, pageSize: 10 });
      

      if (items.length) {
        setLastDoc(newLast);
        setMesAnnonces(prev => {
          const ids = new Set(prev.map(a => a.id));
          const merged = [...prev, ...items.filter((i: any) => !ids.has(i.id))];
          // Tri par date desc après fusion
          merged.sort((a, b) => createdAtMs(b) - createdAtMs(a));
          return merged;
        });
      } else {
        setHasMore(false);
      }
    } catch (err:any) {
      console.error("[Dashboard] Erreur loadAnnonces:", err);
      showToast("error", "Erreur lors du chargement des annonces");
    } finally {
      setLoadingMore(false);
      if (isInitial) setLoadingAnnonces(false);
    }
  }, [user, loadingMore, hasMore, lastDoc, mesAnnonces, createdAtMs]);

  // Chargement du profil coloc depuis Prisma
  useEffect(() => {
    if (activeTab !== "coloc" || !user) return;
    
    const loadColocProfile = async () => {
      try {
        setLoadingColoc(true);
        const profile = await getColocProfile();
        
        if (profile) {
          setColocNom(profile.nom || "");
          setColocBudget(profile.budget || "");
          setColocImageUrl(profile.imageUrl || "");
          setColocPhotos(profile.photos ? JSON.parse(profile.photos as string) : []);
          setColocDescription(profile.description || "");
          setColocAge(profile.age || "");
          setColocProfession(profile.profession || "");
          setColocFumeur(profile.fumeur || false);
          setColocAnimaux(profile.animaux || false);
          setColocDateDispo(profile.dateDispo || "");
          setColocQuartiers(profile.quartiers || "");
          setColocTelephone(profile.telephone || "");
          setColocZones(profile.zones ? JSON.parse(profile.zones as string) : []);
          setColocCommunesSlugs(profile.communesSlugs ? JSON.parse(profile.communesSlugs as string) : []);
          setColocGenre(profile.genre || "");
          setColocBioCourte(profile.bioCourte || "");
          setColocLanguesCsv(profile.langues ? JSON.stringify(profile.langues) : "");
          setColocInstagram(profile.instagram || "");
          setPrefGenre(profile.prefGenre || "");
          setPrefAgeMin(profile.prefAgeMin || "");
          setPrefAgeMax(profile.prefAgeMax || "");
          setPrefZones([]);
          setPrefCommunesSlugs([]);
          setPrefFumeur(false);
          setPrefAnimaux(false);
          setPrefProfession("");
          setPrefLangues("");
          setPrefMusique("");
          setPrefSport("");
          setPrefCuisine("");
          setPrefVoyage("");
          setPrefSorties("");
          setPrefSoirees("");
          setPrefCalme("");
          setPrefProprete("");
          setPrefInvites("");
          setMusique(profile.musique || "");
          setHasColocDoc(true);
        } else {
          setHasColocDoc(false);
        }
        setColocReady(true);
      } catch (error) {
        console.error("Erreur lors du chargement du profil coloc:", error);
        showToast("error", "Erreur lors du chargement du profil");
    setHasColocDoc(false);
      } finally {
        setLoadingColoc(false);
      }
    };

    loadColocProfile();
  }, [activeTab, user]);

  // Autosave colocataire - temporairement désactivé (Firestore supprimé)

  // Autosave useEffect - temporairement désactivé (Firestore supprimé)

  const handleSaveColocProfile = async () => {
    if (!user) return;
    
    try {
      setSavingColoc(true);
      
      const profileData: ColocProfileData = {
        nom: colocNom,
        budget: typeof colocBudget === 'number' ? colocBudget : undefined,
        imageUrl: colocImageUrl,
        photos: colocPhotos,
        description: colocDescription,
        age: typeof colocAge === 'number' ? colocAge : undefined,
        profession: colocProfession,
        fumeur: colocFumeur,
        animaux: colocAnimaux,
        dateDispo: colocDateDispo,
        quartiers: colocQuartiers,
        telephone: colocTelephone,
        zones: colocZones,
        communesSlugs: colocCommunesSlugs,
        genre: colocGenre,
        bioCourte: colocBioCourte,
        languesCsv: colocLanguesCsv,
        instagram: colocInstagram,
        prefGenre,
        prefAgeMin: typeof prefAgeMin === 'number' ? prefAgeMin : undefined,
        prefAgeMax: typeof prefAgeMax === 'number' ? prefAgeMax : undefined,
        prefZones,
        prefCommunesSlugs,
        prefFumeur,
        prefAnimaux,
        prefProfession,
        prefLangues,
        prefMusique,
        prefSport,
        prefCuisine,
        prefVoyage,
        prefSorties,
        prefSoirees,
        prefCalme,
        prefProprete,
        prefInvites,
        musique
      };
      
      await saveColocProfile(profileData);
      setHasColocDoc(true);
      setColocEditing(false);
      showToast("success", "Profil colocataire sauvegardé avec succès !");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      showToast("error", "Erreur lors de la sauvegarde du profil");
    } finally {
      setSavingColoc(false);
    }
  };

  const handleDeleteColocProfile = async () => {
    if (!user) return;
    
    try {
      await deleteColocProfile();
      setHasColocDoc(false);
      setColocEditing(false);
      // Reset all form fields
      setColocNom("");
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
      setColocGenre("");
      setColocBioCourte("");
      setColocLanguesCsv("");
      setColocInstagram("");
      showToast("success", "Profil colocataire supprimé avec succès !");
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      showToast("error", "Erreur lors de la suppression du profil");
    }
  };

  // --- Profil colocataire: états ---
  // (supprimé) Ancien bloc déplacé plus haut pour éviter l’utilisation avant déclaration

  useEffect(() => {
    if (user) loadUserDoc(user);
  }, [user, loadUserDoc]);

  // Détecter le paramètre tab dans l'URL et définir l'onglet actif
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['annonces', 'messages', 'coloc', 'match'].includes(tabParam)) {
      setActiveTab(tabParam as "annonces" | "messages" | "coloc" | "match");
    }
  }, [searchParams]);

  // Charger les matches quand l'onglet match est sélectionné
  useEffect(() => {
    if (activeTab === "match") {
      loadMatches();
    }
  }, [activeTab, matchType, user]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    // Attendre d'avoir tenté de charger le doc user pour éviter permission-denied précoce
    if (!userDocLoaded) return;
    
    loadAnnonces();
  }, [user, loading, lastDoc, userDocLoaded, router, loadAnnonces]);

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



  // Pagination activée pour le chargement des annonces

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



  const openAnnonceDetail = async (annonceId: string) => {
    try {
      console.log("[Dashboard] openAnnonceDetail appelée avec:", annonceId);
      const response = await fetch(`/api/annonces/${annonceId}`);
      if (response.ok) {
        const annonce = await response.json();
        console.log("[Dashboard] Annonce récupérée:", { id: annonce.id, userId: annonce.userId });
        setSelectedAnnonceForDetail(annonce);
      } else {
        console.log("[Dashboard] Erreur API:", response.status);
        showToast("error", "Impossible de charger les détails de l'annonce");
      }
    } catch (error) {
      console.error("[Dashboard] Erreur lors du chargement de l'annonce:", error);
      showToast("error", "Erreur lors du chargement de l'annonce");
    }
  };

  // Fonction pour calculer un score de compatibilité
  const calculateCompatibilityScore = (item: any, userProfile: any, isAnnonce: boolean) => {
    let score = 0;
    let maxScore = 0;

    if (isAnnonce) {
      // Matching annonce -> profil colocataire
      maxScore = 100;
      
      // Budget (40 points)
      if (userProfile.budget && item.prix) {
        const budgetRatio = item.prix / userProfile.budget;
        if (budgetRatio <= 0.8) score += 40; // Excellent match
        else if (budgetRatio <= 1.0) score += 30; // Bon match
        else if (budgetRatio <= 1.2) score += 20; // Match acceptable
        else if (budgetRatio <= 1.5) score += 10; // Match limite
      } else if (!userProfile.budget || !item.prix) {
        score += 20; // Pas de critère budget
      }

      // Zone géographique (30 points)
      if (userProfile.communesSlugs && Array.isArray(userProfile.communesSlugs) && userProfile.communesSlugs.length > 0 && item.communeSlug) {
        if (userProfile.communesSlugs.includes(item.communeSlug)) {
          score += 30; // Même commune
        } else {
          // Vérifier si c'est dans la même zone
          const userZones = computeZonesFromSlugs(userProfile.communesSlugs);
          const annonceZones = computeZonesFromSlugs([item.communeSlug]);
          if (userZones.some(zone => annonceZones.includes(zone))) {
            score += 20; // Même zone
          } else {
            score += 5; // Zone différente
          }
        }
      } else {
        score += 15; // Pas de critère géographique
      }

      // Surface (20 points)
      if (item.surface) {
        if (item.surface >= 20 && item.surface <= 100) score += 20; // Surface idéale
        else if (item.surface >= 15 && item.surface <= 120) score += 15; // Surface acceptable
        else score += 10; // Surface limite
      } else {
        score += 10; // Surface non renseignée
      }

      // Équipements et description (10 points)
      if (item.description && item.description.length > 50) score += 10;
      else if (item.description && item.description.length > 20) score += 5;

    } else {
      // Matching profil -> annonce
      maxScore = 100;
      
      // Budget (40 points)
      if (item.budget && mesAnnonces.length > 0) {
        const avgPrix = mesAnnonces.reduce((sum, annonce) => sum + (annonce.prix || 0), 0) / mesAnnonces.length;
        const budgetRatio = item.budget / avgPrix;
        if (budgetRatio >= 0.8 && budgetRatio <= 1.2) score += 40; // Excellent match
        else if (budgetRatio >= 0.6 && budgetRatio <= 1.5) score += 30; // Bon match
        else if (budgetRatio >= 0.4 && budgetRatio <= 2.0) score += 20; // Match acceptable
        else score += 10; // Match limite
      } else {
        score += 20; // Pas de critère budget
      }

      // Zone géographique (30 points)
      if (item.communesSlugs && Array.isArray(item.communesSlugs) && item.communesSlugs.length > 0 && mesAnnonces.length > 0) {
        const hasZoneMatch = mesAnnonces.some(annonce => 
          annonce.communeSlug && item.communesSlugs.includes(annonce.communeSlug)
        );
        if (hasZoneMatch) {
          score += 30; // Même commune
        } else {
          // Vérifier les zones
          const profilZones = computeZonesFromSlugs(item.communesSlugs);
          const hasZoneOverlap = mesAnnonces.some(annonce => {
            if (!annonce.communeSlug) return false;
            const annonceZones = computeZonesFromSlugs([annonce.communeSlug]);
            return profilZones.some(zone => annonceZones.includes(zone));
          });
          if (hasZoneOverlap) score += 20; // Même zone
          else score += 5; // Zone différente
        }
      } else {
        score += 15; // Pas de critère géographique
      }

      // Âge et profession (20 points)
      if (item.age && item.profession) score += 20;
      else if (item.age || item.profession) score += 10;

      // Description complète (10 points)
      if (item.description && item.description.length > 100) score += 10;
      else if (item.description && item.description.length > 50) score += 5;
    }

    return { score, maxScore, percentage: Math.round((score / maxScore) * 100) };
  };

  // Fonction pour charger les matches
  const loadMatches = async () => {
    if (!user) return;
    
    setMatchLoading(true);
    try {
      if (matchType === "annonces") {
        // Charger les annonces qui correspondent au profil colocataire de l'utilisateur
        const response = await fetch('/api/annonces');
        if (response.ok) {
          const data = await response.json();
          const userColocProfile = await getColocProfile();
          
          if (userColocProfile) {
            // Calculer les scores de compatibilité pour chaque annonce
            const annoncesWithScores = data.items.map((annonce: any) => {
              const compatibility = calculateCompatibilityScore(annonce, userColocProfile, true);
              return {
                ...annonce,
                compatibilityScore: compatibility.score,
                compatibilityPercentage: compatibility.percentage
              };
            });

            // Filtrer et trier par score de compatibilité
            const matchedAnnonces = annoncesWithScores
              .filter((annonce: any) => annonce.compatibilityPercentage >= 30) // Minimum 30% de compatibilité
              .sort((a: any, b: any) => b.compatibilityScore - a.compatibilityScore)
              .slice(0, 20); // Limiter à 20 meilleurs matches

            setMatches(matchedAnnonces);
          } else {
            setMatches([]);
          }
        }
      } else {
        // Charger les profils colocataires qui correspondent aux annonces de l'utilisateur
        const response = await fetch('/api/coloc');
        if (response.ok) {
          const data = await response.json();
          
          if (mesAnnonces.length > 0) {
            // Calculer les scores de compatibilité pour chaque profil
            const profilsWithScores = data.items.map((profil: any) => {
              const compatibility = calculateCompatibilityScore(profil, null, false);
              
              // Trouver les annonces qui matchent avec ce profil
              const matchingAnnonces = mesAnnonces.filter((annonce: any) => {
                const budgetMatch = !profil.budget || !annonce.prix || profil.budget >= annonce.prix;
                const zoneMatch = !profil.communesSlugs || !Array.isArray(profil.communesSlugs) || profil.communesSlugs.length === 0 || 
                  (annonce.communeSlug && profil.communesSlugs.includes(annonce.communeSlug));
                return budgetMatch && zoneMatch;
              });
              
              return {
                ...profil,
                compatibilityScore: compatibility.score,
                compatibilityPercentage: compatibility.percentage,
                matchingAnnonces: matchingAnnonces
              };
            });

            // Filtrer et trier par score de compatibilité
            const matchedProfils = profilsWithScores
              .filter((profil: any) => profil.compatibilityPercentage >= 30) // Minimum 30% de compatibilité
              .sort((a: any, b: any) => b.compatibilityScore - a.compatibilityScore)
              .slice(0, 20); // Limiter à 20 meilleurs matches

            setMatches(matchedProfils);
          } else {
            setMatches([]);
          }
        }
      }
    } catch (error) {
      console.error("[Dashboard] Erreur lors du chargement des matches:", error);
      showToast("error", "Erreur lors du chargement des matches");
    } finally {
      setMatchLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-emerald-50 to-teal-50 p-2 sm:p-6 flex flex-col items-center">
      {/* En-tête moderne */}
      <div className="w-full max-w-6xl mb-8">
        <div className="relative rounded-3xl bg-gradient-to-br from-white to-slate-50 shadow-2xl border border-slate-200/60 p-6 sm:p-8 overflow-hidden">
          {/* Éléments décoratifs */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-sky-100 to-cyan-100 rounded-full -translate-y-16 translate-x-16 opacity-50 animate-pulse-slow"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full translate-y-12 -translate-x-12 opacity-50 animate-bounce-slow"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-sky-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg animate-spin-slow">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-sky-600 via-cyan-500 to-teal-500 bg-clip-text text-transparent mb-2 animate-fade-in">
                  Tableau de bord
                </h1>
                <p className="text-lg text-slate-600">
                  Organise ta colocation, échange avec tes futurs colocataires et personnalise ton profil
                  <br />
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets modernes */}
      <div className="w-full max-w-6xl mb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg p-2">
          <div className="flex gap-1">
            <button
              className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-sm flex items-center justify-center gap-2 ${
                activeTab === "annonces"
                  ? "bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-lg transform scale-105 animate-pulse-slow"
                  : "text-slate-700 hover:bg-slate-50 hover:text-sky-600"
              }`}
              onClick={() => setActiveTab("annonces")}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Mes annonces
            </button>
            <button
              className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-sm flex items-center justify-center gap-2 ${
                activeTab === "messages"
                  ? "bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-lg transform scale-105 animate-pulse-slow"
                  : "text-slate-700 hover:bg-slate-50 hover:text-sky-600"
              }`}
              onClick={() => setActiveTab("messages")}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Messages
            </button>
            <button
              className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-sm flex items-center justify-center gap-2 ${
                activeTab === "coloc"
                  ? "bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-lg transform scale-105 animate-pulse-slow"
                  : "text-slate-700 hover:bg-slate-50 hover:text-sky-600"
              }`}
              onClick={() => setActiveTab("coloc")}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profil colocataire
            </button>
            <button
              className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-300 text-sm flex items-center justify-center gap-2 ${
                activeTab === "match"
                  ? "bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-lg transform scale-105 animate-pulse-slow"
                  : "text-slate-700 hover:bg-slate-50 hover:text-sky-600"
              }`}
              onClick={() => setActiveTab("match")}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Match
            </button>
          </div>
        </div>
      </div>

      {/* Contenu des onglets */}
      <div className="w-full max-w-6xl bg-white/90 backdrop-blur-sm rounded-3xl border border-slate-200/50 shadow-2xl p-6 sm:p-8">
        {activeTab === "annonces" && (
          <>
            <button
              onClick={() => {
                setEditAnnonce(null);
                setModalOpen(true);
              }}
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-sky-600 to-cyan-500 text-white px-6 py-3 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 mb-8 font-semibold"
            >
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              Nouvelle annonce
            </button>

            {/* Barre d'actions moderne */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-slate-200/50 p-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <label className="inline-flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => (allSelected ? deselectAll() : selectAllVisible())}
                    className="w-5 h-5 appearance-none rounded-full border-2 border-slate-400 bg-white bg-center bg-no-repeat transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 checked:bg-gradient-to-r checked:from-blue-600 checked:to-purple-600 checked:border-transparent checked:ring-2 checked:ring-blue-300 checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22white%22 stroke-width=%223%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M3.5 8.5 L6.5 11.5 L12.5 4.5%22/></svg>')] checked:bg-[length:1rem_1rem]"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Tout sélectionner ({visibleIds.length})
                  </span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllVisible}
                    className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 text-sm font-medium text-slate-700"
                  >
                    Tout sélectionner
                  </button>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 text-sm font-medium text-slate-700"
                  >
                    Tout désélectionner
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmBulkOpen(true)}
                    disabled={selectedIds.length === 0}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedIds.length === 0
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg hover:scale-105"
                    }`}
                  >
                    Supprimer la sélection ({selectedIds.length})
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-cyan-500 bg-clip-text text-transparent">Mes annonces</h2>
            </div>
            
            {/* Publicité dans le dashboard */}
            <div className="mb-6">
              <AdBlock 
                placementKey="dashboard.annonces" 
                title="Conseils pour vos annonces"
                variant="compact"
                showBorder={false}
              />
            </div>
            {loadingAnnonces ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-600 font-medium">Chargement de vos annonces...</p>
                </div>
              </div>
            ) : sortedAnnonces.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">Aucune annonce pour le moment</h3>
                <p className="text-slate-500 mb-6">Créez votre première annonce pour commencer à trouver des colocataires !</p>
                <button
                  onClick={() => {
                    setEditAnnonce(null);
                    setModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-600 to-cyan-500 text-white px-6 py-3 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Créer ma première annonce
                </button>
              </div>
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
                          description={annonce.description || "Aucune description disponible"}
                          surface={annonce.surface || 0}
                          subCommunesLabel={subLabel || undefined}
                          onClick={() => openAnnonceDetail(annonce.id)}
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
                    
                    // Rafraîchir la liste des annonces après modification
                    setMesAnnonces([]); // Reset pour forcer le rechargement
                    setLastDoc(null); // Reset pagination
                    setHasMore(true); // Réactiver le chargement
                    loadAnnonces(); // Recharger les annonces
                  } else {
                    await addAnnonce({ uid: user!.uid, email: user!.email }, annonceData);
                    showToast("success", "Annonce créée avec succès ✅");
                    
                    // Rafraîchir la liste des annonces après création
                    setMesAnnonces([]); // Reset pour forcer le rechargement
                    setLastDoc(null); // Reset pagination
                    setHasMore(true); // Réactiver le chargement
                    loadAnnonces(); // Recharger les annonces
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
                  
                  // Rafraîchir la liste des annonces après suppression
                  setMesAnnonces([]); // Reset pour forcer le rechargement
                  setLastDoc(null); // Reset pagination
                  setHasMore(true); // Réactiver le chargement
                  loadAnnonces(); // Recharger les annonces
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
          <MessagesSection />
        )}

        {activeTab === "match" && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-4">💕 Mes matches</h2>
              <p className="text-gray-600 mb-4">
                Découvrez les annonces et profils qui correspondent à vos critères.
              </p>
              
              
              {/* Sélecteur de type de match */}
              <div className="flex gap-2 mb-6">
                <button
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    matchType === "annonces"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setMatchType("annonces")}
                >
                  🏠 Annonces pour moi
                </button>
                <button
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    matchType === "profils"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setMatchType("profils")}
                >
                  👥 Profils pour mes annonces
                </button>
              </div>

              {matchLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Recherche de matches...</p>
                </div>
              ) : matches.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">💔</div>
                  <p className="text-gray-600 mb-2">
                    {matchType === "annonces" 
                      ? "Aucune annonce ne correspond à votre profil colocataire pour le moment."
                      : "Aucun profil ne correspond à vos annonces pour le moment."
                    }
                  </p>
                  <p className="text-sm text-gray-500">
                    {matchType === "annonces" 
                      ? "Créez ou mettez à jour votre profil colocataire pour améliorer les matches."
                      : "Créez des annonces ou mettez à jour votre profil pour attirer plus de colocataires."
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      {matches.length} {matchType === "annonces" ? "annonce(s)" : "profil(s)"} trouvé(s)
                    </p>
                    <button
                      onClick={loadMatches}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      🔄 Actualiser
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matches.map((item: any) => (
                      <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow relative">
                        {/* Badge de compatibilité */}
                        <div className="absolute top-3 right-3">
                          <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            item.compatibilityPercentage >= 80 
                              ? "bg-green-100 text-green-800" 
                              : item.compatibilityPercentage >= 60 
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-orange-100 text-orange-800"
                          }`}>
                            {item.compatibilityPercentage}% match
                          </div>
                        </div>

                        {matchType === "annonces" ? (
                          <div>
                            <h3 className="font-semibold text-lg mb-2 pr-16">{item.titre}</h3>
                            <p className="text-gray-600 mb-2">📍 {item.ville}</p>
                            <p className="text-blue-600 font-semibold mb-2">
                              {item.prix ? `${item.prix} €/mois` : "Prix non renseigné"}
                            </p>
                            {item.surface && (
                              <p className="text-sm text-gray-500 mb-2">Surface: {item.surface} m²</p>
                            )}
                            <p className="text-sm text-gray-700 line-clamp-2">
                              {item.description || "Aucune description disponible"}
                            </p>
                            
                            {/* Indicateurs de compatibilité */}
                            <div className="mt-2 flex flex-wrap gap-1">
                              {item.compatibilityPercentage >= 80 && (
                                <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-200">
                                  💚 Excellent match
                                </span>
                              )}
                              {item.compatibilityPercentage >= 60 && item.compatibilityPercentage < 80 && (
                                <span className="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-full border border-yellow-200">
                                  💛 Bon match
                                </span>
                              )}
                              {item.compatibilityPercentage < 60 && (
                                <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-full border border-orange-200">
                                  🧡 Match acceptable
                                </span>
                              )}
                            </div>

                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => openAnnonceDetail(item.id)}
                                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                              >
                                Voir détails
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <h3 className="font-semibold text-lg mb-2 pr-16">{item.nom || "Profil colocataire"}</h3>
                            <p className="text-gray-600 mb-2">
                              {item.age ? `${item.age} ans` : ""} 
                              {item.profession ? ` • ${item.profession}` : ""}
                            </p>
                            <p className="text-blue-600 font-semibold mb-2">
                              {item.budget ? `Budget: ${item.budget} €/mois` : "Budget non renseigné"}
                            </p>
                            <p className="text-sm text-gray-700 line-clamp-2">
                              {item.description || "Aucune description disponible"}
                            </p>

                            {/* Annonces correspondantes */}
                            {item.matchingAnnonces && item.matchingAnnonces.length > 0 && (
                              <div className="mt-2 mb-2">
                                <p className="text-xs font-medium text-gray-600 mb-1">🏠 Correspond à vos annonces :</p>
                                <div className="flex flex-wrap gap-1">
                                  {item.matchingAnnonces.slice(0, 3).map((annonce: any, idx: number) => (
                                    <span 
                                      key={annonce.id} 
                                      className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200 cursor-pointer hover:bg-blue-100"
                                      title={`${annonce.titre} - ${annonce.prix}€/mois - ${annonce.ville}`}
                                      onClick={() => openAnnonceDetail(annonce.id)}
                                    >
                                      {annonce.titre.length > 20 ? `${annonce.titre.substring(0, 20)}...` : annonce.titre}
                                    </span>
                                  ))}
                                  {item.matchingAnnonces.length > 3 && (
                                    <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full border border-gray-200">
                                      +{item.matchingAnnonces.length - 3} autres
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Indicateurs de compatibilité */}
                            <div className="mt-2 flex flex-wrap gap-1">
                              {item.compatibilityPercentage >= 80 && (
                                <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-200">
                                  💚 Excellent match
                                </span>
                              )}
                              {item.compatibilityPercentage >= 60 && item.compatibilityPercentage < 80 && (
                                <span className="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-full border border-yellow-200">
                                  💛 Bon match
                                </span>
                              )}
                              {item.compatibilityPercentage < 60 && (
                                <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-full border border-orange-200">
                                  🧡 Match acceptable
                                </span>
                              )}
                            </div>

                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => {
                                  setColocDetail(item);
                                  setColocDetailOpen(true);
                                }}
                                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                              >
                                Voir profil
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
                      onClick={handleDeleteColocProfile}
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
              <form ref={colocFormRef} onSubmit={(e)=>{e.preventDefault(); handleSaveColocProfile();}} className="flex flex-col gap-4">
                {/* Actions en haut du formulaire */}
                <div className="sticky top-16 z-20 -mx-6 px-6 py-3 bg-white flex justify-center gap-3 border-b border-slate-200 shadow-sm">
                  {hasColocDoc && hasMeaningfulColocData && (
                    <button
                      type="button"
                      onClick={handleDeleteColocProfile}
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

        {/* Modal de détail d'annonce */}
        {selectedAnnonceForDetail && selectedAnnonceForDetail.id && (
        <AnnonceDetailModal
          annonce={selectedAnnonceForDetail}
            open={true}
          onClose={() => {
            console.log("[Dashboard] Fermeture du modal, selectedAnnonceForDetail:", selectedAnnonceForDetail);
            setSelectedAnnonceForDetail(null);
          }}
        />
        )}

        {/* Modal de détail du profil colocataire pour l'onglet Match */}
        {colocDetailOpen && colocDetail && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onMouseDown={(e) => { if (e.target === e.currentTarget) setColocDetailOpen(false); }}
          >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setColocDetailOpen(false)}
                className="absolute top-3 right-3 text-slate-600 hover:text-slate-900"
                aria-label="Fermer"
              >
                ✖
              </button>
              <h3 className="text-xl font-semibold mb-4">Profil colocataire</h3>
              <div className="flex flex-col gap-4">
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-32 h-32">
                    <Image
                      src={colocDetail.imageUrl || defaultColocImg}
                      alt="Photo de profil"
                      width={128}
                      height={128}
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-2xl font-bold">
                      {colocDetail.nom || "Profil colocataire"}
                    </div>
                    <div className="text-slate-700">
                      {colocDetail.age ? `${colocDetail.age} ans` : ""} 
                      {colocDetail.profession ? ` • ${colocDetail.profession}` : ""}
                    </div>
                    <div className="text-blue-600 font-semibold">
                      {colocDetail.budget ? `Budget: ${colocDetail.budget} €/mois` : "Budget non renseigné"}
                    </div>
                  </div>
                </div>
                
                {colocDetail.bioCourte && (
                  <div className="text-slate-700">{colocDetail.bioCourte}</div>
                )}
                
                {colocDetail.description && (
                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-1">À propos</div>
                    <p className="text-slate-800 whitespace-pre-line">{colocDetail.description}</p>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setColocDetailOpen(false)}
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Composant principal avec Suspense boundary
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

