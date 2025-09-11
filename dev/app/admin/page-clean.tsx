"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminUsers from "@/features/admin/AdminUsers";
import AdminAds from "@/features/admin/AdminAds";
import ImageCleanup from "@/features/admin/ImageCleanup";
import VersionInfo from "@/features/admin/VersionInfo";
import ExpandableImage from "@/shared/components/ExpandableImage";
import useAdminGate from "@/shared/hooks/useAdminGate";
import AnnonceModal from "@/shared/components/AnnonceModal";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const user = session?.user as any;
  const loading = status === "loading";
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"annonces" | "users" | "colocs" | "ads" | "maintenance">("annonces");
  const [isDevEnvironment, setIsDevEnvironment] = useState<boolean | null>(null);
  const [showSecret, setShowSecret] = useState<Record<string,boolean>>({});
  const toggleSecret = (k:string)=> setShowSecret(s=>({ ...s, [k]: !s[k] }));

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
  useAdminGate();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Accès refusé</h1>
          <p className="text-gray-600">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
          <p className="text-gray-600 mt-2">Gestion de la plateforme RodColoc</p>
        </div>

        {/* Navigation tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "annonces", label: "Annonces", icon: "📋" },
              { id: "users", label: "Utilisateurs", icon: "👥" },
              { id: "colocs", label: "Colocations", icon: "🏠" },
              { id: "ads", label: "Publicités", icon: "📢" },
              { id: "maintenance", label: "Maintenance", icon: "🔧" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === "annonces" && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Gestion des annonces</h2>
              <p className="text-gray-600">Interface de gestion des annonces de colocation.</p>
            </div>
          )}

          {activeTab === "users" && (
            <div className="p-6">
              <AdminUsers />
            </div>
          )}

          {activeTab === "colocs" && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Gestion des colocations</h2>
              <p className="text-gray-600">Interface de gestion des profils de colocation.</p>
            </div>
          )}

          {activeTab === "ads" && (
            <div className="p-6">
              <AdminAds />
            </div>
          )}

          {activeTab === "maintenance" && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ImageCleanup />
                <VersionInfo />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
