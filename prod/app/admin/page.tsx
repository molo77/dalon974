"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminUsers from "@/features/admin/AdminUsers";
import AdminAds from "@/features/admin/AdminAds";
import ImageCleanup from "@/features/admin/ImageCleanup";
import VersionInfo from "@/features/admin/VersionInfo";
import ExpandableImage from "@/shared/components/ExpandableImage"; // New import
// import AdminAnnonces from "@/components/admin/AdminAnnonces"; // affichage remplacé par une liste intégrée
import useAdminGate from "@/shared/hooks/useAdminGate";
// Firebase supprimé: à migrer vers API Prisma.
const serverTimestamp = () => new Date();
import AnnonceModal from "@/shared/components/AnnonceModal";
const ColocPhotoSection = dynamic(() => import("@/shared/components/ColocPhotoSection"), { ssr: false });
import { updateAnnonce, deleteAnnonce } from "@/core/business/annonceService";
import { updateColoc, deleteColoc, getColoc, listColoc } from "@/core/business/colocService";
// import Link from "next/link"; // + import
import Image from "next/image";
import { toast as appToast } from "@/shared/components/feedback/Toast";
import { formatDateReunion } from "@/core/validation/dateUtils";

// données seed retirées (non utilisées pendant la migration)

export default function AdminPage() {
  const { data: session, status } = useSession();
  const user = session?.user as any;
  const loading = status === "loading";
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"annonces" | "users" | "colocs" | "ads" | "scraper" | "maintenance">("annonces");
  const [isDevEnvironment, setIsDevEnvironment] = useState<boolean | null>(null);
  // État config scraper
  const [scraperConfig, setScraperConfig] = useState<Record<string,string|undefined>>({});
  const [scraperLoading, setScraperLoading] = useState(false);
  const [scraperRuns, setScraperRuns] = useState<any[]>([]);
  const [scraperSaving, setScraperSaving] = useState(false);
  const [scraperLaunching, setScraperLaunching] = useState(false);
  const [scraperCancelling, setScraperCancelling] = useState(false);
  const [scraperPurging, setScraperPurging] = useState(false);
  const [scraperFetchingDatadome, setScraperFetchingDatadome] = useState(false);
  const [confirmPurgeOpen, setConfirmPurgeOpen] = useState<null | 'runs' | 'all'>(null);
  const [showSecret, setShowSecret] = useState<Record<string,boolean>>({});
  const [showScraperConfig, setShowScraperConfig] = useState(false); // Caché par défaut
  const [showScraperLogs, setShowScraperLogs] = useState(false); // Caché par défaut
  const [scraperLogs, setScraperLogs] = useState<string>('');
  const toggleSecret = (k:string)=> setShowSecret(s=>({ ...s, [k]: !s[k] }));

  // Fonction pour récupérer l'environnement via l'API
  const fetchEnvironment = async () => {
    try {
      const response = await fetch('/api/version');
      if (response.ok) {
        const data = await response.json();
        setIsDevEnvironment(data.appEnv === 'development');
      } else {
        console.error('Erreur lors de la récupération de l\'environnement:', response.status);
        setIsDevEnvironment(false); // Fallback vers production
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'environnement:', error);
      setIsDevEnvironment(false); // Fallback vers production
    }
  };
  // Récupérer l'environnement au chargement du composant
  useEffect(() => {
    fetchEnvironment();
  }, []);

  const loadScraper = async () => {
    try {
      setScraperLoading(true);
      const [cfgRes, runsRes] = await Promise.all([
        fetch('/api/admin/scraper/settings',{ cache: 'no-store' }),
        fetch('/api/admin/scraper/run',{ cache: 'no-store' })
      ]);
      if (cfgRes.ok) setScraperConfig(await cfgRes.json());
      if (runsRes.ok) setScraperRuns(await runsRes.json());
    } catch (e) { console.error('[Admin][Scraper] load', e); }
    finally { setScraperLoading(false); }
  };
  const loadScraperRuns = async () => {
    try {
      const runsRes = await fetch('/api/admin/scraper/run',{ cache: 'no-store' });
      if (runsRes.ok) setScraperRuns(await runsRes.json());
    } catch(e) { console.error('[Admin][Scraper] runs load', e); }
  };
  
  const loadScraperLogs = async () => {
    try {
      console.log('[Admin][Scraper] Chargement des logs...');
      console.log('[Admin][Scraper] Runs disponibles:', scraperRuns.length);
      
      // Si pas de runs, afficher un message informatif
      if (scraperRuns.length === 0) {
        setScraperLogs('=== LOGS DU SCRAPER ===\n\nAucun run de scraper trouvé.\n\nPour voir des logs :\n1. Lancer un scraper\n2. Attendre qu\'il commence\n3. Recharger les logs');
        return;
      }
      
      // Récupérer les logs du dernier run en cours ou du dernier run terminé
      const currentRun = scraperRuns.find(r => r.status === 'running');
      if (currentRun) {
        console.log('[Admin][Scraper] Run en cours trouvé:', currentRun.id);
        // Si un run est en cours, récupérer ses logs en temps réel
        const logsRes = await fetch(`/api/admin/scraper/run/${currentRun.id}/logs`, { cache: 'no-store' });
        if (logsRes.ok) {
          const logs = await logsRes.text();
          setScraperLogs(logs);
        } else {
          console.error('[Admin][Scraper] Erreur API logs:', logsRes.status);
          setScraperLogs(`=== ERREUR ===\nImpossible de récupérer les logs du run ${currentRun.id}\nStatus: ${logsRes.status}`);
        }
      } else {
        console.log('[Admin][Scraper] Aucun run en cours, recherche du dernier run terminé...');
        // Sinon, récupérer les logs du dernier run terminé
        const lastRun = scraperRuns.find(r => r.status === 'success' || r.status === 'error' || r.status === 'aborted');
        if (lastRun) {
          console.log('[Admin][Scraper] Dernier run trouvé:', lastRun.id, 'Status:', lastRun.status);
          if (lastRun.rawLog && lastRun.rawLog.trim()) {
            setScraperLogs(lastRun.rawLog);
          } else {
            setScraperLogs(`=== RUN ${lastRun.id} ===\nStatut: ${lastRun.status}\nDébut: ${lastRun.startedAt ? formatDateReunion(lastRun.startedAt) : 'inconnu'}\nFin: ${lastRun.finishedAt ? formatDateReunion(lastRun.finishedAt) : 'inconnu'}\n\nAucun log détaillé disponible pour ce run.\n\nPour voir des logs détaillés :\n1. Lancer un nouveau scraper\n2. Attendre qu\'il commence\n3. Recharger les logs`);
          }
        } else {
          console.log('[Admin][Scraper] Aucun run terminé trouvé');
          setScraperLogs('=== LOGS DU SCRAPER ===\n\nAucun run terminé trouvé.\n\nRuns disponibles :\n' + scraperRuns.map(r => `- ${r.id}: ${r.status} (${r.startedAt ? formatDateReunion(r.startedAt) : 'inconnu'})`).join('\n'));
        }
      }
    } catch(e) { 
      console.error('[Admin][Scraper] logs load', e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      setScraperLogs(`=== ERREUR ===\nErreur lors du chargement des logs :\n${errorMessage}\n\nVérifiez que :\n1. Le serveur fonctionne\n2. Vous avez les permissions admin\n3. La base de données est accessible`);
    }
  };
  const DEFAULT_SCRAPER_CONFIG: Record<string,string> = {
    LBC_SEARCH_URL: 'https://www.leboncoin.fr/recherche?category=11&locations=r_26',
    LBC_BROWSER_HEADLESS: 'true',
    LBC_MAX: '40',
    LBC_FETCH_DETAILS: 'true',
    LBC_DETAIL_LIMIT: '12',
    LBC_DETAIL_SLEEP: '500',
    LBC_PAGES: '1',
    LBC_VERBOSE_LIST: 'false',
    LBC_EXPORT_JSON: 'false',
    LBC_NO_DB: 'false',
    LBC_UPDATE_COOLDOWN_HOURS: '0',
    LBC_EXTRA_SLEEP: '0',
    LBC_COOKIES: '',
    LBC_DATADOME: '',
    DATADOME_TOKEN: '',
    LBC_DEBUG: 'false',
    LBC_USE_PROTONVPN: 'true'
  };
  const applyDefaultsToEmpty = () => {
    setScraperConfig(prev => {
      const next = { ...prev };
      Object.entries(DEFAULT_SCRAPER_CONFIG).forEach(([k,v])=>{
        if (!next[k]) next[k] = v;
      });
      return next;
    });
  };
  useEffect(()=>{ if(activeTab==='scraper') loadScraper(); },[activeTab]);
  // Polling contrôlé (évite recréation boucle sur chaque update)
  const pollingRef = useRef<NodeJS.Timeout|null>(null);
  useEffect(()=>{
    if (activeTab !== 'scraper') {
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current=null; }
      return;
    }
    const hasRunning = scraperRuns.some(r=>r.status==='running');
    if (!hasRunning) {
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current=null; }
      return;
    }
    if (!pollingRef.current) {
      pollingRef.current = setInterval(()=>{ 
        loadScraperRuns(); 
        // Actualiser les logs si ils sont affichés et qu'un run est en cours
        if (showScraperLogs) {
          loadScraperLogs();
        }
      }, 5000);
    }
    return ()=>{ if (pollingRef.current){ clearInterval(pollingRef.current); pollingRef.current=null; } };
  },[activeTab, scraperRuns, showScraperLogs, loadScraperLogs]);
  const updateCfgField = async (k:string,v:string) => {
    setScraperConfig(prev=>({ ...prev, [k]: v }));
    
    // Sauvegarde automatique après un délai
    setTimeout(async () => {
      try {
        setScraperSaving(true);
        const body: Record<string,string> = {};
        Object.entries({...scraperConfig, [k]: v}).forEach(([key,val])=>{ if(val!==undefined) body[key]=val; });
        const res = await fetch('/api/admin/scraper/settings',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
        if(!res.ok) throw new Error('save fail');
        showToast('success','Config sauvegardée automatiquement ✅');
      } catch{ showToast('error','Erreur sauvegarde config'); }
      finally { setScraperSaving(false); }
    }, 1000); // Délai de 1 seconde pour éviter trop de requêtes
  };
  
  // const saveConfig = async () => {
  //   try {
  //     setScraperSaving(true);
  //     const body: Record<string,string> = {};
  //     Object.entries(scraperConfig).forEach(([k,v])=>{ if(v!==undefined) body[k]=v; });
  //     const res = await fetch('/api/admin/scraper/settings',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
  //     if(!res.ok) throw new Error('save fail');
  //     showToast('success','Config sauvegardée ✅');
  // } catch{ showToast('error','Erreur sauvegarde config'); }
  //   finally { setScraperSaving(false); }
  // };
  const launchScraper = async () => {
    try {
      setScraperLaunching(true);
      const res = await fetch('/api/admin/scraper/run',{ method:'POST' });
      if(!res.ok) throw new Error('launch fail');
      showToast('success','Scraper lancé ✅');
  setTimeout(()=>loadScraperRuns(),1500);
  } catch{ showToast('error','Erreur lancement'); }
    finally { setScraperLaunching(false); }
  };
  const forceRun = async () => {
    try {
      setScraperLaunching(true);
      const res = await fetch('/api/admin/scraper/run?force=1',{ method:'POST' });
      if(!res.ok) throw new Error('force fail');
      showToast('success','Force run lancé ✅');
  setTimeout(()=>loadScraperRuns(),1200);
    } catch { showToast('error','Erreur force run'); }
    finally { setScraperLaunching(false); }
  };
  const cancelRun = async () => {
    try {
      setScraperCancelling(true);
      const res = await fetch('/api/admin/scraper/run',{ method:'DELETE' });
      if(!res.ok) throw new Error('cancel fail');
      showToast('success','Run annulé');
      setTimeout(()=>loadScraperRuns(),800);
    } catch { showToast('error','Erreur annulation'); }
    finally { setScraperCancelling(false); }
  };
  const purgeCache = async (withAnnonces:boolean) => {
    try {
      setScraperPurging(true);
      const url = '/api/admin/scraper/cache' + (withAnnonces? '?annonces=1':'' );
      const res = await fetch(url,{ method:'DELETE' });
      if(!res.ok) throw new Error('purge fail');
      showToast('success','Cache supprimé');
      loadScraperRuns();
    } catch { showToast('error','Erreur purge'); }
    finally { setScraperPurging(false); }
  };
  const openPurge = (mode:'runs'|'all') => setConfirmPurgeOpen(mode);
  const doConfirmedPurge = () => {
    if (confirmPurgeOpen==='runs') purgeCache(false);
    if (confirmPurgeOpen==='all') purgeCache(true);
    setConfirmPurgeOpen(null);
  };
  const fetchDatadomeToken = async () => {
    try {
      setScraperFetchingDatadome(true);
      const res = await fetch('/api/admin/scraper/datadome', { method: 'POST' });
      if (!res.ok) throw new Error('fetch datadome fail');
      const data = await res.json();
      if (data.token) {
        // Mettre à jour la config avec le nouveau token
        setScraperConfig(prev => ({ ...prev, LBC_DATADOME: data.token }));
        showToast('success', 'Token Datadome récupéré ✅');
      } else {
        showToast('error', 'Aucun token trouvé');
      }
    } catch (e) {
      console.error('[Admin][Datadome]', e);
      showToast('error', 'Erreur récupération token');
    } finally {
      setScraperFetchingDatadome(false);
    }
  };
  // toast state removed (unused)
  // toastTimeout removed
  // Seed & réparation supprimés
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
  // Formulaire d'édition coloc (modale)
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

  // NOUVEAU: modal "Changer propriétaire"
  const [bulkOwnerOpen, setBulkOwnerOpen] = useState(false);
  const [bulkOwnerInput, setBulkOwnerInput] = useState("");

  // NOUVEAU: état pour la création de profils d'exemple
  // Seed colocataires supprimé

  // NOUVEAU: état pour modal de détails profil coloc
  const [colocDetailOpen, setColocDetailOpen] = useState(false);
  const [colocDetailLoading, setColocDetailLoading] = useState(false);
  const [colocDetail, setColocDetail] = useState<any | null>(null);
  
  // États pour le modal de détail annonce
  const [annonceDetailOpen, setAnnonceDetailOpen] = useState(false);
  const [annonceDetailLoading, setAnnonceDetailLoading] = useState(false);
  const [annonceDetail, setAnnonceDetail] = useState<any | null>(null);
  
  // Debug: surveiller les changements d'état du modal annonce
  useEffect(() => {
    console.log("[Admin][State] annonceDetailOpen changed to:", annonceDetailOpen);
    console.log("[Admin][State] annonceDetail:", annonceDetail);
    if (annonceDetailOpen) {
      console.log("[Admin][Render] Modal annonce devrait être rendu");
    }
  }, [annonceDetailOpen, annonceDetail]);

  const { isAdmin, checkingAdmin } = useAdminGate({ user, loading, router });

  const showToast = (type: "success" | "error", message: string) => {
    // Toaster global
    appToast[type](message);
  };

  // Utilitaire: formatage robuste d'un champ createdAt (Timestamp/Date/number/string)
  const formatCreatedAt = (v: any) => {
    if (!v) return "-";
    try {
      // Timestamp Firestore avec toDate()
      if (v && typeof v.toDate === "function") return formatDateReunion(v.toDate());
      // Timestamp Firestore brut { seconds, nanoseconds }
      if (v?.seconds) return formatDateReunion(v.seconds * 1000);
      // Nombre (ms)
      if (typeof v === "number") return formatDateReunion(v);
      // String/Date
      const d = new Date(v);
      return isNaN(d.getTime()) ? "-" : formatDateReunion(d);
    } catch {
      return "-";
    }
  };

  // seedExamples supprimé

  // NOUVEAU: réparer les URLs d'images placeholders cassées (annonces + colocs)
  // repairImages supprimé

  // NOUVEAU: créer des profils colocataires d'exemple
  // seedColocExamples supprimé

  // Chargement des annonces
  useEffect(() => {
    if (activeTab !== "annonces") return;
    let stop = false;
    const load = async () => {
      try {
        const res = await fetch("/api/annonces?limit=200", { cache: "no-store" });
        if (!res.ok) throw new Error("annonces fetch failed");
        const data = await res.json();
        // L'API retourne maintenant { items: [], total: number }
        const items = data.items || [];
        // assurer la compat UI
        const mapped = items.map((a: any) => ({ ...a, titre: a.titre ?? a.title ?? "" }));
        if (!stop) setAdminAnnonces(mapped);
      } catch {
        if (!stop) setAdminAnnonces([]);
      }
    };
    load();
    return () => { stop = true; };
  }, [activeTab]);

  // Fonction pour recharger les annonces
  const reloadAnnonces = async () => {
    try {
      const res = await fetch("/api/annonces?limit=200", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];
        const mapped = items.map((a: any) => ({ ...a, titre: a.titre ?? a.title ?? "" }));
        setAdminAnnonces(mapped);
      }
    } catch (error) {
      console.error("[Admin][ReloadAnnonces]", error);
    }
  };

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
        const result = await listColoc({ limit: 200 });
        if (!stop) setAdminColocs(result.items);
  } catch {
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
      
      // Recharger la liste après suppression
      await reloadAnnonces();
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

  // NOUVEAU: ouvrir la modale d'édition profil
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

  // NOUVEAU: ouvrir/fermer le détail d'un profil coloc
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
  
  // NOUVEAU: ouvrir/fermer le détail d'une annonce
  const openAnnonceDetail = async (annonce: any) => {
    console.log("[Admin][OpenAnnonceDetail] Début, annonce:", annonce);
    try {
      console.log("[Admin][OpenAnnonceDetail] Avant setAnnonceDetailOpen(true)");
      setAnnonceDetailOpen(true);
      console.log("[Admin][OpenAnnonceDetail] Après setAnnonceDetailOpen(true)");
      setAnnonceDetailLoading(true);
      setAnnonceDetail(null);
      console.log("[Admin][OpenAnnonceDetail] États mis à jour, appel API...");
      const res = await fetch(`/api/annonces/${annonce.id}`, { cache: "no-store" });
      console.log("[Admin][OpenAnnonceDetail] Réponse API:", res.status, res.ok);
      if (res.ok) {
        const data = await res.json();
        console.log("[Admin][OpenAnnonceDetail] Données reçues:", data);
        setAnnonceDetail(data);
      } else {
        console.error("[Admin][OpenAnnonceDetail] Erreur API:", res.status);
        showToast("error", "Erreur lors du chargement de l'annonce");
      }
    } catch (e) {
      console.error("[Admin][AnnonceDetail] load error", e);
      showToast("error", "Erreur lors du chargement de l'annonce");
      setAnnonceDetail(null);
    } finally {
      setAnnonceDetailLoading(false);
      console.log("[Admin][OpenAnnonceDetail] Fin de la fonction");
    }
  };
  
  const closeAnnonceDetail = () => {
    console.log("[Admin][CloseAnnonceDetail] Fermeture du modal annonce");
    setAnnonceDetailOpen(false);
    setAnnonceDetail(null);
    setAnnonceDetailLoading(false);
  };

  // NOUVEAU: enregistrer un profil (modale)
  const saveColocEdit = async () => {
    if (!editColoc) return;
    try {
      setAdminLoading(true);
      console.log("[Admin][SaveColoc] Début de la sauvegarde pour:", editColoc.id);
      
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
      
      // Nettoyer les champs vides
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
      
      console.log("[Admin][SaveColoc] Payload à envoyer:", payload);
      
      await updateColoc(editColoc.id, payload);
      
      console.log("[Admin][SaveColoc] Sauvegarde réussie");
      showToast("success", "Profil modifié ✅");
      
      // Recharger la liste des profils
      try {
        const result = await listColoc({ limit: 200 });
        setAdminColocs(result.items);
        console.log("[Admin][SaveColoc] Liste rechargée:", result.items.length, "profils");
      } catch (reloadError) {
        console.error("[Admin][SaveColoc] Erreur rechargement liste:", reloadError);
      }
      
      // Fermer le modal d'édition
      setColocModalOpen(false);
      setEditColoc(null);
      
      // Si on était dans le modal de détail, le rouvrir avec les données mises à jour
      if (colocDetailOpen && editColoc) {
        try {
          const updatedDetail = await getColoc(editColoc.id);
          if (updatedDetail) {
            setColocDetail(updatedDetail);
            console.log("[Admin][SaveColoc] Modal de détail mis à jour");
          }
        } catch (detailError) {
          console.error("[Admin][SaveColoc] Erreur mise à jour détail:", detailError);
        }
      }
    } catch (e) {
      console.error("[Admin][SaveColoc] Erreur:", e);
      showToast("error", "Erreur lors de la mise à jour du profil.");
    } finally {
      setAdminLoading(false);
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
          {/* Barre d'actions + table annonces */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-extrabold text-blue-800 tracking-tight">
              Administration
            </h1>
            {/* Boutons de création d'exemples - seulement en développement */}
            {isDevEnvironment === true && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setAdminLoading(true);
                      const villes = ['Saint-Denis', 'Saint-Paul', 'Saint-Pierre', 'Le Tampon', 'Saint-André', 'Saint-Louis', 'Le Port', 'La Possession', 'Saint-Joseph', 'Saint-Benoît'];
                      const types = ['Appartement', 'Maison', 'Studio', 'T2', 'T3', 'T4'];
                      const professions = ['Étudiant', 'Employé', 'Cadre', 'Artisan', 'Commerçant', 'Profession libérale'];
                      
                      let createdCount = 0;
                      for (let i = 0; i < 20; i++) {
                        const ville = villes[i % villes.length];
                        const type = types[i % types.length];
                        const profession = professions[i % professions.length];
                        const prix = 350 + (i * 25) + Math.floor(Math.random() * 100);
                        const surface = 15 + (i * 2) + Math.floor(Math.random() * 20);
                        
                        const res = await fetch('/api/annonces', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            titre: `Colocation ${type} ${ville} - ${profession}`,
                            description: `Belle colocation ${type.toLowerCase()} à ${ville}, idéal pour ${profession.toLowerCase()}. Logement meublé avec toutes commodités.`,
                            ville: ville,
                            prix: prix,
                            surface: surface,
                            nbChambres: 1 + (i % 3),
                            typeBien: type,
                            meuble: true,
                            nbPieces: 2 + (i % 4)
                          })
                        });
                        if (res.ok) {
                          createdCount++;
                        }
                      }
                      
                      showToast('success', `${createdCount} annonces exemples créées ✅`);
                      // Recharger la liste
                      const refreshRes = await fetch("/api/annonces?limit=200", { cache: "no-store" });
                      if (refreshRes.ok) {
                        const data = await refreshRes.json();
                        // L'API retourne maintenant { items: [], total: number }
                        const items = data.items || [];
                        const mapped = items.map((a: any) => ({ ...a, titre: a.titre ?? a.title ?? "" }));
                        setAdminAnnonces(mapped);
                      }
                    } catch (e) {
                      console.error('[Admin][CreateExampleAnnonces]', e);
                      showToast('error', 'Erreur création annonces exemples');
                    } finally {
                      setAdminLoading(false);
                    }
                  }}
                  disabled={adminLoading}
                  className="bg-green-600 text-white px-3 py-1.5 text-sm rounded hover:bg-green-700 disabled:opacity-60"
                >
                  {adminLoading ? "Création..." : "Créer 20 exemples annonces"}
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Barre d'actions */}
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
                      <th className="py-2 px-3 text-left">Photo</th>
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
                          onClick={() => { openAnnonceDetail(a); }}
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
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border">
                              <Image
                                src={a.imageUrl || "/images/annonce-holder.svg"}
                                alt="Photo principale"
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "/images/annonce-holder.svg";
                                }}
                              />
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className="text-blue-600 hover:underline cursor-pointer"
                              title="Cliquer pour voir le détail"
                            >
                              {a.titre || "(sans titre)"}
                            </span>
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
                              title="Voir le détail"
                              aria-label="Voir le détail"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                console.log("Bouton cliqué, annonce:", a);
                                openAnnonceDetail(a); 
                              }}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white hover:bg-blue-700"
                            >
                              👁️
                            </button>
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

            {/* NOUVEAU: Modal d'édition */}
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
                  
                  // Recharger la liste après mise à jour
                  await reloadAnnonces();
                  
                  // Si on était dans le modal de détail, le mettre à jour
                  if (annonceDetailOpen && editAnnonce) {
                    try {
                      const updatedDetailRes = await fetch(`/api/annonces/${editAnnonce.id}`, { cache: "no-store" });
                      if (updatedDetailRes.ok) {
                        const updatedDetail = await updatedDetailRes.json();
                        setAnnonceDetail(updatedDetail);
                        console.log("[Admin][UpdateAnnonce] Modal de détail mis à jour");
                      }
                    } catch (detailError) {
                      console.error("[Admin][UpdateAnnonce] Erreur mise à jour détail:", detailError);
                    }
                  }
                } catch (e: any) {
                  console.error("[Admin][UpdateAnnonce]", e);
                  showToast("error", "Erreur lors de la mise à jour.");
                } finally {
                  setModalOpen(false);
                  setEditAnnonce(null);
                }
              }}
            />

            {/* NOUVEAU: Modal "Changer propriétaire" */}
            {bulkOwnerOpen && (
              <div
                className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
                onMouseDown={(e) => { if (e.target === e.currentTarget) { setBulkOwnerOpen(false); setBulkOwnerInput(""); } }}
              >
                <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold mb-3">Changer le propriétaire</h3>
                  <p className="text-sm text-slate-600 mb-3">
                    Saisissez l'email OU l'identifiant (userId) du nouveau propriétaire
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
                  {/* Suggestions d'utilisateurs existants (email/displayName) */}
                  <datalist id="owners-suggestions">
                    {Object.entries(ownersById).map(([id, o]) => {
                      const label = o?.displayName
                        ? `${o.displayName} <${o.email || id}>`
                        : (o?.email || id);
                      // La valeur utilisable reste l'email s'il existe, sinon l'UID
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
          {/* Barre d'actions profils + table */}
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
            {/* Boutons de création d'exemples - seulement en développement */}
            {isDevEnvironment === true && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setAdminLoading(true);
                      const villes = ['Saint-Denis', 'Saint-Paul', 'Saint-Pierre', 'Le Tampon', 'Saint-André', 'Saint-Louis', 'Le Port', 'La Possession', 'Saint-Joseph', 'Saint-Benoît'];
                      const professions = ['Étudiant', 'Employé', 'Cadre', 'Artisan', 'Commerçant', 'Profession libérale', 'Développeur', 'Infirmier', 'Enseignant', 'Médecin'];
                      const noms = ['Alex', 'Marie', 'Thomas', 'Sophie', 'Lucas', 'Emma', 'Hugo', 'Léa', 'Nathan', 'Chloé', 'Louis', 'Jade', 'Gabriel', 'Inès', 'Raphaël', 'Zoé', 'Antoine', 'Lola', 'Maxime', 'Camille'];
                      const zones = [['Nord'], ['Ouest'], ['Sud'], ['Est'], ['Intérieur'], ['Nord', 'Ouest'], ['Sud', 'Est'], ['Ouest', 'Sud'], ['Nord', 'Est'], ['Intérieur', 'Nord']];
                      
                      let createdCount = 0;
                      for (let i = 0; i < 20; i++) {
                        const ville = villes[i % villes.length];
                        const profession = professions[i % professions.length];
                        const nom = noms[i % noms.length];
                        const zone = zones[i % zones.length];
                        const budget = 350 + (i * 30) + Math.floor(Math.random() * 150);
                        const age = 20 + (i % 15) + Math.floor(Math.random() * 10);
                        
                        const res = await fetch('/api/coloc', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            description: `Jeune ${profession.toLowerCase()} de ${age} ans, je recherche une colocation sympa à ${ville}. Je suis ${profession.toLowerCase()}, propre et respectueux.`,
                            ville: ville,
                            budget: budget,
                            age: age,
                            profession: profession,
                            nom: nom,
                            zones: zone,
                            communesSlugs: [ville.toLowerCase().replace(/\s+/g, '-')],
                            bioCourte: `${profession} de ${age} ans, recherche colocation à ${ville}`,
                            genre: i % 2 === 0 ? 'Homme' : 'Femme',
                            accepteFumeurs: i % 3 === 0,
                            accepteAnimaux: i % 4 === 0,
                            sportif: i % 2 === 0,
                            vegetarien: i % 5 === 0,
                            soirees: i % 3 === 0,
                            musique: i % 2 === 0 ? 'Pop/Rock' : 'Jazz/Classique'
                          })
                        });
                        if (res.ok) {
                          createdCount++;
                        }
                      }
                      
                      showToast('success', `${createdCount} profils coloc exemples créés ✅`);
                      // Recharger la liste
                      const result = await listColoc({ limit: 200 });
                      setAdminColocs(result.items);
                    } catch (e) {
                      console.error('[Admin][CreateExampleColocs]', e);
                      showToast('error', 'Erreur création profils coloc exemples');
                    } finally {
                      setAdminLoading(false);
                    }
                  }}
                  disabled={adminLoading}
                  className="bg-green-600 text-white px-3 py-1.5 text-sm rounded hover:bg-green-700 disabled:opacity-60"
                >
                  {adminLoading ? "Création..." : "Créer 20 exemples colocs"}
                </button>
              </div>
            )}
          </div>

          {/* Liste profils */}
          <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm mt-4">
            <table className="w-full text-[15px]">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="py-2 px-3 w-12 text-center select-none cursor-default" aria-label="Sélection"></th>
                  <th className="py-2 px-3 text-left">Photo</th>
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
                          <td className="py-2 px-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border">
                              <Image
                                src={p.imageUrl || "/images/coloc-holder.svg"}
                                alt="Photo principale"
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "/images/coloc-holder.svg";
                                }}
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
              className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4 overflow-y-auto"
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

          {/* Modal détail profil colocataire complet */}
          {colocDetailOpen && (
            <div
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
              onMouseDown={(e) => { if (e.target === e.currentTarget) closeColocDetail(); }}
            >
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 relative max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Détail complet du profil colocataire</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (colocDetail) {
                          openColocModal(colocDetail);
                          // Ne pas fermer le modal de détail, il sera mis à jour après la sauvegarde
                        }
                      }}
                      className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                      title="Modifier le profil"
                    >
                      ✏️ Modifier
                    </button>
                    <button
                      onClick={closeColocDetail}
                      className="text-slate-600 hover:text-slate-900 text-xl"
                      aria-label="Fermer"
                    >
                      ✖
                    </button>
                  </div>
                </div>
                {colocDetailLoading ? (
                  <p className="text-slate-600">Chargement…</p>
                ) : !colocDetail ? (
                  <p className="text-slate-600">Profil introuvable.</p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Colonne gauche - Informations principales */}
                    <div className="space-y-4">
                      {/* En-tête avec image et infos principales */}
                      <div className="flex gap-4 items-start">
                        <div className="flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden bg-gray-100">
                          <ExpandableImage 
                            src={colocDetail.imageUrl || "/images/coloc-holder.svg"} 
                            images={Array.isArray(colocDetail.photos) && colocDetail.photos.length ? colocDetail.photos : (colocDetail.imageUrl ? [colocDetail.imageUrl] : ["/images/coloc-holder.svg"])} 
                            className="w-full h-full object-cover" 
                            alt={colocDetail.nom || "Profil"} 
                          />
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

                      {/* Informations personnelles */}
                      <div className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-slate-800">Informations personnelles</h4>
                          <button
                            onClick={() => {
                              if (colocDetail) {
                                openColocModal(colocDetail);
                                // Ne pas fermer le modal de détail, il sera mis à jour après la sauvegarde
                              }
                            }}
                            className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                            title="Modifier les informations personnelles"
                          >
                            ✏️
                          </button>
                        </div>
                        <div className="space-y-2 text-sm">
                          {colocDetail.email && <div><span className="font-medium">Email:</span> {colocDetail.email}</div>}
                          {colocDetail.telephone && <div><span className="font-medium">Téléphone:</span> {colocDetail.telephone}</div>}
                          {colocDetail.genre && <div><span className="font-medium">Genre:</span> {colocDetail.genre}</div>}
          
                          {colocDetail.instagram && <div><span className="font-medium">Instagram:</span> {colocDetail.instagram}</div>}
                        </div>
                      </div>

                      {/* Bio et description */}
                      <div className="bg-slate-50 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-800 mb-3">Bio et description</h4>
                        <div className="space-y-2 text-sm">
                          {colocDetail.bioCourte && (
                            <div>
                              <span className="font-medium">Bio courte:</span>
                              <div className="mt-1 text-slate-700">{colocDetail.bioCourte}</div>
                            </div>
                          )}
                          {colocDetail.description && (
                            <div>
                              <span className="font-medium">Description complète:</span>
                              <div className="mt-1 text-slate-700">{colocDetail.description}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Langues */}
                      {Array.isArray(colocDetail.langues) && colocDetail.langues.length > 0 && (
                        <div className="bg-slate-50 rounded-lg p-4">
                          <h4 className="font-semibold text-slate-800 mb-3">Langues</h4>
                          <div className="flex flex-wrap gap-2">
                            {colocDetail.langues.map((l: string) => (
                              <span key={l} className="px-2 py-1 rounded-full text-xs bg-white text-slate-700 border border-slate-200">
                                {l}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Zones recherchées */}
                      {Array.isArray(colocDetail.zones) && colocDetail.zones.length > 0 && (
                        <div className="bg-slate-50 rounded-lg p-4">
                          <h4 className="font-semibold text-slate-800 mb-3">Zones recherchées</h4>
                          <div className="flex flex-wrap gap-2">
                            {colocDetail.zones.map((z: string) => (
                              <span key={z} className="px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
                                {z}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Communes recherchées */}
                      {Array.isArray(colocDetail.communesSlugs) && colocDetail.communesSlugs.length > 0 && (
                        <div className="bg-slate-50 rounded-lg p-4">
                          <h4 className="font-semibold text-slate-800 mb-3">Communes recherchées</h4>
                          <div className="flex flex-wrap gap-2">
                            {colocDetail.communesSlugs.map((c: string) => (
                              <span key={c} className="px-2 py-1 rounded-full text-xs bg-green-50 text-green-700 border border-green-200">
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Colonne droite - Préférences et critères */}
                    <div className="space-y-4">
                      {/* Préférences de colocataires */}
                      <div className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-slate-800">Préférences de colocataires</h4>
                          <button
                            onClick={() => {
                              if (colocDetail) {
                                openColocModal(colocDetail);
                                // Ne pas fermer le modal de détail, il sera mis à jour après la sauvegarde
                              }
                            }}
                            className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                            title="Modifier les préférences"
                          >
                            ✏️
                          </button>
                        </div>
                        <div className="space-y-2 text-sm">
                          {colocDetail.prefGenre && <div><span className="font-medium">Genre préféré:</span> {colocDetail.prefGenre}</div>}
                          {colocDetail.prefAgeMin && <div><span className="font-medium">Âge min:</span> {colocDetail.prefAgeMin} ans</div>}
                          {colocDetail.prefAgeMax && <div><span className="font-medium">Âge max:</span> {colocDetail.prefAgeMax} ans</div>}
                          {colocDetail.prefProfession && <div><span className="font-medium">Profession préférée:</span> {colocDetail.prefProfession}</div>}
                        </div>
                      </div>

                      {/* Préférences de logement */}
                      <div className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-slate-800">Préférences de logement</h4>
                          <button
                            onClick={() => {
                              if (colocDetail) {
                                openColocModal(colocDetail);
                                // Ne pas fermer le modal de détail, il sera mis à jour après la sauvegarde
                              }
                            }}
                            className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                            title="Modifier les préférences de logement"
                          >
                            ✏️
                          </button>
                        </div>
                        <div className="space-y-2 text-sm">
                          {typeof colocDetail.budget === "number" && <div><span className="font-medium">Budget:</span> {colocDetail.budget} €</div>}
                          {colocDetail.surface && <div><span className="font-medium">Surface souhaitée:</span> {colocDetail.surface} m²</div>}
                          {colocDetail.nbChambres && <div><span className="font-medium">Nombre de chambres:</span> {colocDetail.nbChambres}</div>}
                          {colocDetail.dateDispo && <div><span className="font-medium">Disponibilité:</span> {colocDetail.dateDispo}</div>}
                          {colocDetail.rythme && <div><span className="font-medium">Rythme de vie:</span> {colocDetail.rythme}</div>}
                          {colocDetail.proprete && <div><span className="font-medium">Niveau de propreté:</span> {colocDetail.proprete}</div>}
                        </div>
                      </div>

                      {/* Préférences de vie */}
                      <div className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-slate-800">Préférences de vie</h4>
                          <button
                            onClick={() => {
                              if (colocDetail) {
                                openColocModal(colocDetail);
                                // Ne pas fermer le modal de détail, il sera mis à jour après la sauvegarde
                              }
                            }}
                            className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                            title="Modifier les préférences de vie"
                          >
                            ✏️
                          </button>
                        </div>
                        <div className="space-y-2 text-sm">
                          {colocDetail.musique && <div><span className="font-medium">Musique:</span> {colocDetail.musique}</div>}
                          {colocDetail.accepteFumeurs && <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span>Accepte les fumeurs</div>}
                          {colocDetail.accepteAnimaux && <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span>Accepte les animaux</div>}
                          {colocDetail.sportif && <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span>Sportif</div>}
                          {colocDetail.vegetarien && <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span>Végétarien</div>}
                          {colocDetail.soirees && <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span>Aime les soirées</div>}
                        </div>
                      </div>



                      {/* Intérêts */}
                      {Array.isArray(colocDetail.interets) && colocDetail.interets.length > 0 && (
                        <div className="bg-slate-50 rounded-lg p-4">
                          <h4 className="font-semibold text-slate-800 mb-3">Intérêts</h4>
                          <div className="flex flex-wrap gap-2">
                            {colocDetail.interets.map((i: string) => (
                              <span key={i} className="px-2 py-1 rounded-full text-xs bg-purple-50 text-purple-700 border border-purple-200">
                                {i}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Photos */}
                      {Array.isArray(colocDetail.photos) && colocDetail.photos.length > 0 && (
                        <div className="bg-slate-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-slate-800">Photos ({colocDetail.photos.length})</h4>
                                                      <button
                            onClick={() => {
                              if (colocDetail) {
                                openColocModal(colocDetail);
                                // Ne pas fermer le modal de détail, il sera mis à jour après la sauvegarde
                              }
                            }}
                            className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                            title="Modifier les photos"
                          >
                            ✏️
                          </button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {colocDetail.photos.map((u: string, idx: number) => (
                              <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                <ExpandableImage 
                                  src={u} 
                                  images={colocDetail.photos} 
                                  className="w-full h-full object-cover" 
                                  alt={`Photo ${idx + 1}`} 
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        
        </>
      );
    }
    if (activeTab === "ads") {
      return <AdminAds />;
    }
    if (activeTab === 'scraper') {
             const fields = [
         'LBC_SEARCH_URL','LBC_BROWSER_HEADLESS','LBC_MAX','LBC_FETCH_DETAILS','LBC_DETAIL_LIMIT','LBC_DETAIL_SLEEP','LBC_PAGES','LBC_VERBOSE_LIST','LBC_EXPORT_JSON','LBC_NO_DB','LBC_UPDATE_COOLDOWN_HOURS','LBC_EXTRA_SLEEP','LBC_COOKIES','LBC_DATADOME','DATADOME_TOKEN','LBC_DEBUG','LBC_USE_PROTONVPN'
       ];
  const sensitive = new Set(['LBC_COOKIES','LBC_DATADOME','DATADOME_TOKEN']);
      return (
        <div className='space-y-8'>
          <div className='flex items-center justify-between'>
            <h1 className='text-3xl font-bold text-blue-800'>Scraper Leboncoin</h1>
            <div className='flex gap-2'>
              <button 
                onClick={() => setShowScraperConfig(!showScraperConfig)} 
                className='px-3 py-1.5 text-sm rounded bg-slate-400 text-white hover:bg-slate-500'
                title={showScraperConfig ? 'Masquer la configuration' : 'Afficher la configuration'}
              >
                {showScraperConfig ? '🔽 Masquer config' : '🔼 Afficher config'}
              </button>
              <button disabled={scraperLoading} onClick={loadScraper} className='px-3 py-1.5 text-sm rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-50'>Rafraîchir</button>

              <button disabled={scraperLaunching} onClick={launchScraper} className='px-3 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'>{scraperLaunching? 'Lancement...' : 'Lancer scraper'}</button>
              <button disabled={scraperCancelling} onClick={cancelRun} className='px-3 py-1.5 text-sm rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'>{scraperCancelling? 'Annulation...' : 'Annuler'}</button>
              <button disabled={scraperPurging} onClick={()=>openPurge('runs')} className='px-3 py-1.5 text-sm rounded bg-slate-600 text-white hover:bg-slate-700 disabled:opacity-50'>{scraperPurging? 'Purging...' : 'Purge runs'}</button>
              <button disabled={scraperPurging} onClick={()=>openPurge('all')} className='px-3 py-1.5 text-sm rounded bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50' title='Supprime aussi les annonces source LBC'>Purge + annonces</button>
              <button type='button' onClick={applyDefaultsToEmpty} className='px-3 py-1.5 text-sm rounded bg-slate-500 text-white hover:bg-slate-600'>Défauts vides</button>
              <button disabled={scraperLaunching} onClick={forceRun} title='Interrompt le run en cours et démarre un nouveau' className='px-3 py-1.5 text-sm rounded bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50'>Force run</button>
              <button disabled={scraperFetchingDatadome} onClick={fetchDatadomeToken} title='Récupère un nouveau token Datadome depuis Leboncoin' className='px-3 py-1.5 text-sm rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50'>{scraperFetchingDatadome ? 'Récupération...' : 'Récupérer Datadome'}</button>
              <button 
                onClick={() => {
                  setShowScraperLogs(!showScraperLogs);
                  if (!showScraperLogs) {
                    loadScraperLogs();
                  }
                }} 
                className='px-3 py-1.5 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700'
                title={showScraperLogs ? 'Masquer les logs' : 'Afficher les logs'}
              >
                {showScraperLogs ? '📋 Masquer logs' : '📋 Afficher logs'}
              </button>
            </div>
          </div>
          {scraperLoading ? <p>Chargement config…</p> : showScraperConfig && (
            <div className='border border-slate-200 rounded-lg p-4 bg-slate-50'>
              <div className='flex items-center justify-between mb-3'>
                <h3 className='text-lg font-semibold text-slate-700'>Configuration du Scraper</h3>
                {scraperSaving && (
                  <span className='text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded'>
                    💾 Sauvegarde automatique...
                  </span>
                )}
              </div>
              <div className='grid md:grid-cols-2 gap-4'>
                {fields.map(k => {
                  const isSens = sensitive.has(k);
                  const isBoolean = k === 'LBC_USE_PROTONVPN' || k === 'LBC_BROWSER_HEADLESS' || k === 'LBC_FETCH_DETAILS' || k === 'LBC_VERBOSE_LIST' || k === 'LBC_EXPORT_JSON' || k === 'LBC_NO_DB' || k === 'LBC_DEBUG';
                  
                  return (
                    <div key={k} className='flex flex-col gap-1'>
                      <label className='text-xs font-semibold text-slate-600 flex items-center justify-between'>
                        <span>{k}</span>
                        {isSens && (
                          <button type='button' onClick={()=>toggleSecret(k)} className='text-[10px] px-1 py-0.5 rounded border border-slate-300 hover:bg-slate-100'>
                            {showSecret[k] ? 'Masquer' : 'Voir'}
                          </button>
                        )}
                      </label>
                      {isBoolean ? (
                        <select
                          value={scraperConfig[k] ?? DEFAULT_SCRAPER_CONFIG[k]}
                          onChange={e=>updateCfgField(k,e.target.value)}
                          className='border rounded px-2 py-1 text-sm'
                        >
                          <option value="true">true</option>
                          <option value="false">false</option>
                        </select>
                      ) : (
                        <input
                          type={isSens && !showSecret[k] ? 'password':'text'}
                          value={scraperConfig[k] ?? ''}
                          placeholder={DEFAULT_SCRAPER_CONFIG[k]}
                          onChange={e=>updateCfgField(k,e.target.value)}
                          className='border rounded px-2 py-1 text-sm placeholder:text-slate-400'
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div>
            <h2 className='text-xl font-semibold mb-2'>Dernières exécutions</h2>
      <table className='w-full text-sm border border-slate-200 rounded overflow-hidden'>
              <thead className='bg-slate-50'>
  <tr><th className='p-2 text-left'>Début</th><th className='p-2 text-left'>Fin</th><th className='p-2'>Statut</th><th className='p-2'>Progress</th><th className='p-2'>Collectées</th><th className='p-2'>Upserts</th><th className='p-2'>Créées</th><th className='p-2'>MAJ</th><th className='p-2'>Cooldown skip</th><th className='p-2'>Use Proton</th><th className='p-2'>Log (fin)</th></tr>
              </thead>
              <tbody>
                {scraperRuns.map(r => {
                  let eta: string | null = null;
                  let phase: string | null = null;
                  if (r.status==='running' && r.progress!=null && r.progress>0) {
                    // estimation simple sur base durée écoulée / progress
                    const started = r.startedAt ? new Date(r.startedAt).getTime() : null;
                    if (started) {
                      const elapsed = Date.now() - started;
                      const estTotal = elapsed / r.progress;
                      const remaining = estTotal - elapsed;
                      if (isFinite(remaining) && remaining > 0) {
                        const mins = Math.floor(remaining/60000);
                        const secs = Math.floor((remaining%60000)/1000);
                        eta = mins>0 ? `${mins}m${secs.toString().padStart(2,'0')}s` : `${secs}s`;
                      }
                    }
                    
                    // Utiliser les nouveaux champs d'étapes si disponibles
                    if (r.currentStep) {
                      phase = r.currentStep;
                    } else {
                      phase = (r.progress < 0.3) ? 'Listing' : 'Détails';
                    }
                  }
                  return (
                  <tr key={r.id} className='border-t hover:bg-slate-50'>
                                    <td className='p-2'>{r.startedAt ? formatDateReunion(r.startedAt) : '-'}</td>
                <td className='p-2'>{r.finishedAt ? formatDateReunion(r.finishedAt) : (r.status==='running'?'…':'-')}</td>
          <td className='p-2'><span className={`px-2 py-0.5 rounded text-xs font-medium ${r.status==='success'?'bg-green-100 text-green-700': r.status==='error'?'bg-rose-100 text-rose-700': r.status==='aborted' ? 'bg-gray-200 text-gray-700':'bg-amber-100 text-amber-700'}`}>{r.status||'-'}</span></td>
          <td className='p-2 text-center w-32'>
            {r.status==='running' ? (
              <div className='flex flex-col gap-1'>
                <div className='w-full h-2 bg-slate-200 rounded overflow-hidden'>
                  <div className='h-full bg-blue-500 transition-all' style={{width: ((r.progress ?? 0)*100).toFixed(1)+ '%'}} />
                </div>
                <span className='text-[10px] text-slate-600'>
                  {phase? phase+' · ':''}{(((r.progress ?? 0)*100)|0)}%{eta? ' · ETA '+eta:''}
                  {r.currentMessage ? ` · ${r.currentMessage}` : ''}
                </span>
              </div>
            ): (r.progress!=null ? (((r.progress*100)|0)+'%') : '-')}
          </td>
          <td className='p-2 text-center'>{r.totalCollected ?? '-'}</td>
          <td className='p-2 text-center'>{r.totalUpserts ?? ((r.createdCount ?? 0)+(r.updatedCount ?? 0) || '-')}</td>
          <td className='p-2 text-center'>{r.createdCount ?? '-'}</td>
          <td className='p-2 text-center'>{r.updatedCount ?? '-'}</td>
          <td className='p-2 text-center'>{r.skippedRecentCount ?? '-'}</td>
          <td className='p-2 text-center'>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.config?.LBC_USE_PROTONVPN === 'true' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {r.config?.LBC_USE_PROTONVPN === 'true' ? 'Oui' : 'Non'}
            </span>
          </td>
          <td className='p-2 max-w-[300px] text-xs font-mono whitespace-pre overflow-hidden text-ellipsis'>{r.rawLog ? r.rawLog.slice(-300) : ''}</td>
                  </tr>
                ); })}
              </tbody>
            </table>
          </div>
          
          {/* Section des logs du scraper */}
          {showScraperLogs && (
            <div className='mt-6 border border-slate-200 rounded-lg p-4 bg-slate-50'>
              <div className='flex items-center justify-between mb-3'>
                <h3 className='text-lg font-semibold text-slate-700'>Logs du Scraper</h3>
                <div className='flex gap-2'>
                  <button 
                    onClick={loadScraperLogs}
                    className='px-2 py-1 text-xs rounded bg-slate-600 text-white hover:bg-slate-700'
                    title='Actualiser les logs'
                  >
                    🔄 Actualiser
                  </button>
                  <button 
                    onClick={() => setScraperLogs('')}
                    className='px-2 py-1 text-xs rounded bg-slate-500 text-white hover:bg-slate-600'
                    title='Effacer les logs affichés'
                  >
                    🗑️ Effacer
                  </button>
                </div>
              </div>
              <div className='bg-black text-green-400 p-4 rounded font-mono text-sm overflow-auto max-h-96'>
                <pre className='whitespace-pre-wrap'>{scraperLogs || 'Chargement des logs...'}</pre>
              </div>
            </div>
          )}
          
          {confirmPurgeOpen && (
            <div className='fixed inset-0 z-50 flex items-center justify-center'>
              <div className='absolute inset-0 bg-black/40' onClick={()=>setConfirmPurgeOpen(null)} />
              <div className='relative bg-white rounded-lg shadow-lg p-6 w-full max-w-md space-y-4'>
                <h3 className='text-lg font-semibold'>Confirmer la purge</h3>
                <p className='text-sm text-slate-600'>
                  {confirmPurgeOpen==='runs' ? 'Cette action efface tout l\'historique des exécutions du scraper.' : 'Cette action efface l\'historique DES RUNS ET toutes les annonces importées depuis Leboncoin (source = lbc).'}
                </p>
                <div className='flex justify-end gap-3'>
                  <button onClick={()=>setConfirmPurgeOpen(null)} className='px-4 py-2 rounded border text-slate-600 hover:bg-slate-100'>Annuler</button>
                  <button onClick={doConfirmedPurge} className='px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700'>Confirmer</button>
                </div>
              </div>
            </div>
          )}
          

        </div>
      );
    }
    
    if (activeTab === "maintenance") {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-extrabold text-blue-800 tracking-tight">
              Maintenance
            </h1>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informations de version */}
            <VersionInfo />
            
            {/* Nettoyage des images */}
            <ImageCleanup />
          </div>
        </div>
      );
    }
    
    return <AdminUsers showToast={showToast} />;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-0 flex flex-col md:flex-row w-full overflow-x-hidden">
      <aside className="w-full md:w-72 md:min-h-screen bg-white shadow-lg flex flex-col gap-2 py-8 px-4 border-b md:border-b-0 md:border-r border-slate-200">
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
        <button
          className={`text-left px-4 py-3 rounded-lg transition ${activeTab === "ads" ? "bg-blue-600 text-white shadow" : "hover:bg-blue-50 text-slate-700"}`}
          onClick={() => setActiveTab("ads")}
        >
          💸 Publicités (AdSense)
        </button>
        <button
          className={`text-left px-4 py-3 rounded-lg transition ${activeTab === "scraper" ? "bg-blue-600 text-white shadow" : "hover:bg-blue-50 text-slate-700"}`}
          onClick={() => setActiveTab("scraper")}
        >
          🕷️ Scraper
        </button>
        <button
          className={`text-left px-4 py-3 rounded-lg transition ${activeTab === "maintenance" ? "bg-blue-600 text-white shadow" : "hover:bg-blue-50 text-slate-700"}`}
          onClick={() => setActiveTab("maintenance")}
        >
          🛠️ Maintenance
        </button>
      </aside>
      <section className="flex-1 w-full px-4 md:px-12 py-10 overflow-x-hidden">
        {/* ...existing code header... */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {renderTab()}
        </div>
      </section>
      
      {/* Modals globaux */}
      {/* Modal détail annonce complet */}
      {annonceDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeAnnonceDetail} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            {/* En-tête du modal */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-bold text-slate-800">Détail de l'annonce</h3>
                {annonceDetailLoading && (
                  <div className="text-sm text-slate-500">Chargement...</div>
                )}
              </div>
              <button
                onClick={closeAnnonceDetail}
                className="text-slate-600 hover:text-slate-900 text-xl"
                aria-label="Fermer"
              >
                ✖
              </button>
            </div>
            
            {/* Contenu du modal */}
            {annonceDetail && (
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Colonne gauche - Informations principales */}
                  <div className="space-y-4">
                    {/* En-tête avec image et infos principales */}
                    <div className="flex gap-4 items-start">
                      <div className="flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden bg-gray-100">
                        <ExpandableImage 
                          src={annonceDetail.imageUrl || "/images/annonce-holder.svg"}
                          alt={annonceDetail.titre || "Annonce"} 
                        />
                      </div>
                      <div className="flex-1">
                        <div className="text-2xl font-bold">{annonceDetail.titre || "Annonce sans titre"}</div>
                        <div className="text-slate-700">
                          {annonceDetail.ville || "-"}
                          {typeof annonceDetail.prix === "number" && (
                            <span className="ml-2 text-blue-700 font-semibold">• {annonceDetail.prix} €</span>
                          )}
                        </div>
                        <div className="text-slate-600 text-sm mt-1">
                          {annonceDetail.typeBien ? `${annonceDetail.typeBien}` : ""}
                          {typeof annonceDetail.surface === "number" ? ` • ${annonceDetail.surface} m²` : ""}
                          {typeof annonceDetail.nbChambres === "number" ? ` • ${annonceDetail.nbChambres} chambre(s)` : ""}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {annonceDetail.createdAt ? `Créé le ${formatCreatedAt(annonceDetail.createdAt)}` : ""}
                          {annonceDetail.updatedAt ? ` • Maj: ${formatCreatedAt(annonceDetail.updatedAt)}` : ""}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {annonceDetail.description && (
                      <div className="bg-slate-50 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-800 mb-3">Description</h4>
                        <div className="text-sm text-slate-700 whitespace-pre-wrap">{annonceDetail.description}</div>
                      </div>
                    )}

                    {/* Caractéristiques principales */}
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-800 mb-3">Caractéristiques principales</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Ville:</span>
                          <div className="text-slate-700">{annonceDetail.ville || "-"}</div>
                        </div>
                        <div>
                          <span className="font-medium">Prix:</span>
                          <div className="text-slate-700">
                            {typeof annonceDetail.prix === "number" ? `${annonceDetail.prix} €` : "-"}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Surface:</span>
                          <div className="text-slate-700">
                            {typeof annonceDetail.surface === "number" ? `${annonceDetail.surface} m²` : "-"}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Chambres:</span>
                          <div className="text-slate-700">
                            {typeof annonceDetail.nbChambres === "number" ? `${annonceDetail.nbChambres}` : "-"}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Type de bien:</span>
                          <div className="text-slate-700">{annonceDetail.typeBien || "-"}</div>
                        </div>
                        <div>
                          <span className="font-medium">Meublé:</span>
                          <div className="text-slate-700">
                            {annonceDetail.meuble === true ? "Oui" : annonceDetail.meuble === false ? "Non" : "-"}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Nombre de pièces:</span>
                          <div className="text-slate-700">
                            {typeof annonceDetail.nbPieces === "number" ? `${annonceDetail.nbPieces}` : "-"}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Salles de bain:</span>
                          <div className="text-slate-700">
                            {typeof annonceDetail.nbSdb === "number" ? `${annonceDetail.nbSdb}` : "-"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Caractéristiques détaillées */}
                    {(annonceDetail.natureBien || annonceDetail.caracteristiques || annonceDetail.exposition || annonceDetail.exterieur) && (
                      <div className="bg-slate-50 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-800 mb-3">Caractéristiques détaillées</h4>
                        <div className="space-y-2 text-sm">
                          {annonceDetail.natureBien && (
                            <div>
                              <span className="font-medium">Nature du bien:</span>
                              <div className="text-slate-700">{annonceDetail.natureBien}</div>
                            </div>
                          )}
                          {annonceDetail.caracteristiques && (
                            <div>
                              <span className="font-medium">Caractéristiques:</span>
                              <div className="text-slate-700">{annonceDetail.caracteristiques}</div>
                            </div>
                          )}
                          {annonceDetail.exposition && (
                            <div>
                              <span className="font-medium">Exposition:</span>
                              <div className="text-slate-700">{annonceDetail.exposition}</div>
                            </div>
                          )}
                          {annonceDetail.exterieur && (
                            <div>
                              <span className="font-medium">Extérieur:</span>
                              <div className="text-slate-700">{annonceDetail.exterieur}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Informations de location */}
                    {(annonceDetail.placesParking || annonceDetail.disponibleAPartir || annonceDetail.typeLocation || annonceDetail.nombreColocataires || annonceDetail.statutFumeur) && (
                      <div className="bg-slate-50 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-800 mb-3">Informations de location</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {annonceDetail.placesParking && (
                            <div>
                              <span className="font-medium">Places parking:</span>
                              <div className="text-slate-700">{annonceDetail.placesParking}</div>
                            </div>
                          )}
                          {annonceDetail.disponibleAPartir && (
                            <div>
                              <span className="font-medium">Disponible à partir:</span>
                              <div className="text-slate-700">{annonceDetail.disponibleAPartir}</div>
                            </div>
                          )}
                          {annonceDetail.typeLocation && (
                            <div>
                              <span className="font-medium">Type de location:</span>
                              <div className="text-slate-700">{annonceDetail.typeLocation}</div>
                            </div>
                          )}
                          {annonceDetail.nombreColocataires && (
                            <div>
                              <span className="font-medium">Nombre de colocataires:</span>
                              <div className="text-slate-700">{annonceDetail.nombreColocataires}</div>
                            </div>
                          )}
                          {annonceDetail.statutFumeur && (
                            <div>
                              <span className="font-medium">Statut fumeur:</span>
                              <div className="text-slate-700">{annonceDetail.statutFumeur}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Équipements */}
                    {annonceDetail.equipements && (
                      <div className="bg-slate-50 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-800 mb-3">Équipements</h4>
                        <div className="text-sm text-slate-700">{annonceDetail.equipements}</div>
                      </div>
                    )}
                  </div>

                  {/* Colonne droite - Photos et métadonnées */}
                  <div className="space-y-4">
                    {/* Photos */}
                    {Array.isArray(annonceDetail.photos) && annonceDetail.photos.length > 0 && (
                      <div className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-slate-800">Photos ({annonceDetail.photos.length})</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {annonceDetail.photos.map((photo: string, idx: number) => (
                            <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                              <ExpandableImage 
                                src={photo}
                                alt={`Photo ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-800 mb-3">Actions</h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (annonceDetail) {
                              setEditAnnonce(annonceDetail);
                              setModalOpen(true);
                              // Ne pas fermer le modal de détail, il sera mis à jour après la sauvegarde
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) {
                              try {
                                await deleteAnnonce(annonceDetail.id);
                                showToast("success", "Annonce supprimée ✅");
                                await reloadAnnonces();
                                closeAnnonceDetail();
                              } catch (error) {
                                console.error("[Admin][DeleteAnnonce]", error);
                                showToast("error", "Erreur lors de la suppression.");
                              }
                            }
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}