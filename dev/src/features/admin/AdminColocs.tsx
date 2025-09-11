"use client";

import { useState, useEffect } from "react";

type AdminColocsProps = {
  showToast: (type: "success" | "error", message: string) => void;
};

export default function AdminColocs({ showToast }: AdminColocsProps) {
  const [colocs, setColocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchColocs();
  }, []);

  const fetchColocs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/coloc", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setColocs(data.items || []);
      } else {
        showToast("error", "Erreur lors du chargement des profils colocataires");
      }
    } catch (error) {
      console.error("Erreur fetchColocs:", error);
      showToast("error", "Erreur lors du chargement des profils colocataires");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteColoc = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce profil colocataire ?")) {
      return;
    }

    try {
      const res = await fetch(`/api/coloc/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast("success", "Profil colocataire supprimé avec succès");
        fetchColocs(); // Recharger la liste
      } else {
        showToast("error", "Erreur lors de la suppression du profil");
      }
    } catch (error) {
      console.error("Erreur deleteColoc:", error);
      showToast("error", "Erreur lors de la suppression du profil");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-pink-400 rounded-full animate-spin mx-auto mb-4" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-slate-600 font-medium">Chargement des profils colocataires...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Gestion des profils colocataires</h2>
          <p className="text-slate-600">Gérez et modérez les profils de colocataires</p>
        </div>
        <button
          onClick={fetchColocs}
          className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl hover:scale-105"
        >
          <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualiser
        </button>
      </div>

      {colocs.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Aucun profil colocataire</h3>
          <p className="text-slate-500">Aucun profil colocataire n'a été trouvé pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full border border-purple-200">
              <span className="text-sm font-medium text-purple-800">
                {colocs.length} profil{colocs.length > 1 ? 's' : ''} colocataire{colocs.length > 1 ? 's' : ''} trouvé{colocs.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
          
          <div className="grid gap-6">
            {colocs.map((coloc) => (
              <div key={coloc.id} className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-purple-200 transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {coloc.nom || "Profil sans nom"}
                      </h3>
                      {coloc.age && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {coloc.age} ans
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                      {coloc.budget && (
                        <div>
                          <span className="font-medium">Budget:</span> {coloc.budget}€/mois
                        </div>
                      )}
                      {coloc.profession && (
                        <div>
                          <span className="font-medium">Profession:</span> {coloc.profession}
                        </div>
                      )}
                      {coloc.genre && (
                        <div>
                          <span className="font-medium">Genre:</span> {coloc.genre}
                        </div>
                      )}
                      {coloc.telephone && (
                        <div>
                          <span className="font-medium">Téléphone:</span> {coloc.telephone}
                        </div>
                      )}
                    </div>

                    {coloc.description && (
                      <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                        {coloc.description}
                      </p>
                    )}

                    {coloc.bioCourte && (
                      <p className="text-gray-600 text-sm italic">
                        "{coloc.bioCourte}"
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => handleDeleteColoc(coloc.id)}
                      className="group inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg hover:scale-105"
                    >
                      <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
