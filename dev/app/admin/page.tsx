"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminUsers from "@/features/admin/AdminUsers";
import AdminAnnonces from "@/features/admin/AdminAnnonces";
import AdminColocs from "@/features/admin/AdminColocs";
import AdminReports from "@/features/admin/AdminReports";
import AdminAds from "@/features/admin/AdminAds";
import ImageCleanup from "@/features/admin/ImageCleanup";
import VersionInfo from "@/features/admin/VersionInfo";
import ExpandableImage from "@/shared/components/ExpandableImage";
import useAdminGate from "@/shared/hooks/useAdminGate";
import AnnonceModal from "@/shared/components/AnnonceModal";
import AdminStats from "@/shared/components/AdminStats";
import AdminQuickActions from "@/shared/components/AdminQuickActions";
import AdminToast, { useAdminToast } from "@/shared/components/AdminToast";
import AdminCharts, { AdminPieChart } from "@/shared/components/AdminCharts";
import AdminViewToggle from "@/shared/components/AdminViewToggle";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const user = session?.user as any;
  const loading = status === "loading";
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"dashboard" | "annonces" | "users" | "colocs" | "reports" | "ads" | "maintenance">("dashboard");
  const [isDevEnvironment, setIsDevEnvironment] = useState<boolean | null>(null);
  const [showSecret, setShowSecret] = useState<Record<string,boolean>>({});
  const toggleSecret = (k:string)=> setShowSecret(s=>({ ...s, [k]: !s[k] }));

  // Système de toast moderne
  const { toasts, removeToast, showSuccess, showError } = useAdminToast();

  // Fonction pour afficher les toasts (compatible avec l'ancien système)
  const showToast = (type: "success" | "error", message: string) => {
    if (type === "success") {
      showSuccess("Succès", message);
    } else {
      showError("Erreur", message);
    }
  };

  // Fonction pour récupérer l'environnement via l'API
  const fetchEnvironment = async () => {
    try {
      const response = await fetch('/api/admin/environment');
      if (response.ok) {
        const data = await response.json();
        setIsDevEnvironment(data.isDev);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'environnement:', error);
    }
  };

  useEffect(() => {
    fetchEnvironment();
  }, []);

  // Vérification des permissions admin
  useAdminGate({
    user,
    loading,
    router,
    refreshOnUserChange: true
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-400 rounded-full animate-spin mx-auto mb-4" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-slate-600 font-medium">Chargement de l'administration...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Accès refusé</h1>
          <p className="text-gray-600 mb-6">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { 
      id: "dashboard", 
      label: "Tableau de bord", 
      icon: "📊",
      description: "Vue d'ensemble et statistiques",
      color: "from-emerald-500 to-teal-500"
    },
    { 
      id: "annonces", 
      label: "Annonces", 
      icon: "📋",
      description: "Gérer les annonces de colocation",
      color: "from-blue-500 to-cyan-500"
    },
    { 
      id: "users", 
      label: "Utilisateurs", 
      icon: "👥",
      description: "Gérer les comptes utilisateurs",
      color: "from-green-500 to-emerald-500"
    },
    { 
      id: "colocs", 
      label: "Colocataires", 
      icon: "🏠",
      description: "Gérer les profils colocataires",
      color: "from-purple-500 to-pink-500"
    },
    { 
      id: "reports", 
      label: "Signalements", 
      icon: "🚨",
      description: "Gérer les signalements et blocages",
      color: "from-red-500 to-rose-500"
    },
    { 
      id: "ads", 
      label: "Publicités", 
      icon: "📢",
      description: "Gérer les publicités",
      color: "from-orange-500 to-red-500"
    },
    { 
      id: "maintenance", 
      label: "Maintenance", 
      icon: "🔧",
      description: "Outils de maintenance",
      color: "from-gray-500 to-slate-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header moderne avec gradient */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600"></div>
        <div className="absolute inset-0 bg-black/10"></div>
        
        {/* Éléments décoratifs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                Administration
              </h1>
              <p className="text-blue-100 text-lg">
                Gestion de la plateforme RodColoc
              </p>
              {isDevEnvironment !== null && (
                <div className="mt-3">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    isDevEnvironment 
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                      : 'bg-green-100 text-green-800 border border-green-200'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      isDevEnvironment ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    {isDevEnvironment ? 'Environnement de développement' : 'Environnement de production'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation tabs moderne */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-2">
            <nav className="flex space-x-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`group relative flex-1 px-6 py-4 rounded-xl font-semibold transition-all duration-300 text-sm ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-lg transform scale-105`
                      : "text-slate-700 hover:bg-white/50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-xl">{tab.icon}</span>
                    <div className="text-center">
                      <div className="font-semibold">{tab.label}</div>
                      <div className={`text-xs mt-1 ${
                        activeTab === tab.id ? 'text-white/80' : 'text-slate-500'
                      }`}>
                        {tab.description}
                      </div>
                    </div>
                  </div>
                  
                  {/* Indicateur actif */}
                  {activeTab === tab.id && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-lg"></div>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Contenu des onglets avec design moderne */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
          {/* Header du contenu */}
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200/50 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${tabs.find(t => t.id === activeTab)?.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <span className="text-2xl">{tabs.find(t => t.id === activeTab)?.icon}</span>
                </div>
                <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  {tabs.find(t => t.id === activeTab)?.label}
                </h2>
                <p className="text-slate-600">
                  {tabs.find(t => t.id === activeTab)?.description}
                </p>
              </div>
            </div>
            
            {/* Basculement de vue Admin/Utilisateur */}
            <AdminViewToggle />
          </div>
          </div>

          {/* Contenu principal */}
          <div className="p-8">
            {activeTab === "dashboard" && (
              <div className="space-y-8">
                {/* Statistiques générales */}
                <AdminStats onTabChange={setActiveTab} />
                
                {/* Graphiques */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <AdminCharts />
                  <AdminPieChart />
                </div>
                
                {/* Actions rapides */}
                <AdminQuickActions />
              </div>
            )}

            {activeTab === "annonces" && (
              <div className="space-y-6">
                <AdminAnnonces showToast={showToast} />
              </div>
            )}

            {activeTab === "users" && (
              <div className="space-y-6">
                <AdminUsers showToast={showToast} />
              </div>
            )}

            {activeTab === "colocs" && (
              <div className="space-y-6">
                <AdminColocs showToast={showToast} />
              </div>
            )}

            {activeTab === "reports" && (
              <div className="space-y-6">
                <AdminReports showToast={showToast} />
              </div>
            )}

            {activeTab === "ads" && (
              <div className="space-y-6">
                <AdminAds />
              </div>
            )}

            {activeTab === "maintenance" && (
              <div className="space-y-8">
                <AdminQuickActions />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ImageCleanup />
                  <VersionInfo />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Système de toast */}
      <AdminToast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}