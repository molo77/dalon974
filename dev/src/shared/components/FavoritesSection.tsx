"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getFavoritesWithDetails, removeFavorite, type FavoriteWithDetails } from '@/core/business/favoritesService';
import AnnonceCard from './AnnonceCard';
import ColocProfileCard from './ColocProfileCard';
import { toast as appToast } from './feedback/Toast';

export default function FavoritesSection() {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState<FavoriteWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'annonces' | 'profils'>('all');
  
  // États pour le modal de détail du profil
  const [colocDetailOpen, setColocDetailOpen] = useState(false);
  const [colocDetail, setColocDetail] = useState<any>(null);
  const [colocDetailLoading, setColocDetailLoading] = useState(false);
  
  // États pour le modal de détail de l'annonce
  const [annonceDetailOpen, setAnnonceDetailOpen] = useState(false);
  const [annonceDetail, setAnnonceDetail] = useState<any>(null);
  const [annonceDetailLoading, setAnnonceDetailLoading] = useState(false);

  const loadFavorites = async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    try {
      const type = activeTab === 'all' ? undefined : (activeTab === 'annonces' ? 'annonce' : 'coloc_profile');
      const data = await getFavoritesWithDetails(type);
      setFavorites(data);
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
      appToast.error('Erreur lors du chargement des favoris');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [session?.user?.id, activeTab]);

  const handleRemoveFavorite = async (itemId: string, itemType: 'annonce' | 'coloc_profile') => {
    try {
      await removeFavorite(itemId, itemType);
      setFavorites(prev => prev.filter(fav => !(fav.id === itemId && fav.itemType === itemType)));
      appToast.success('Supprimé des favoris');
    } catch (error) {
      console.error('Erreur lors de la suppression du favori:', error);
      appToast.error('Erreur lors de la suppression');
    }
  };

  // Fonction pour ouvrir le détail d'un profil
  const handleViewProfile = async (profileId: string) => {
    setColocDetailLoading(true);
    setColocDetailOpen(true);
    
    try {
      const response = await fetch(`/api/coloc/${profileId}`);
      if (!response.ok) {
        throw new Error('Profil introuvable');
      }
      const profileData = await response.json();
      setColocDetail(profileData);
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      appToast.error('Erreur lors du chargement du profil');
      setColocDetailOpen(false);
    } finally {
      setColocDetailLoading(false);
    }
  };

  // Fonction pour ouvrir le détail d'une annonce
  const handleViewAnnonce = async (annonceId: string) => {
    setAnnonceDetailLoading(true);
    setAnnonceDetailOpen(true);
    
    try {
      const response = await fetch(`/api/annonces/${annonceId}`);
      if (!response.ok) {
        throw new Error('Annonce introuvable');
      }
      const annonceData = await response.json();
      setAnnonceDetail(annonceData);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'annonce:', error);
      appToast.error('Erreur lors du chargement de l\'annonce');
      setAnnonceDetailOpen(false);
    } finally {
      setAnnonceDetailLoading(false);
    }
  };

  const annoncesFavorites = favorites.filter(fav => fav.itemType === 'annonce');
  const profilsFavorites = favorites.filter(fav => fav.itemType === 'coloc_profile');

  if (!session?.user?.id) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Connexion requise</h3>
        <p className="text-gray-500">Connectez-vous pour voir vos favoris</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl border border-red-100 p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Mes favoris</h2>
            <p className="text-gray-600">Vos annonces et profils préférés</p>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/70 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{favorites.length}</div>
            <div className="text-sm text-gray-600">Total favoris</div>
          </div>
          <div className="bg-white/70 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{annoncesFavorites.length}</div>
            <div className="text-sm text-gray-600">Annonces</div>
          </div>
          <div className="bg-white/70 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{profilsFavorites.length}</div>
            <div className="text-sm text-gray-600">Profils</div>
          </div>
        </div>
      </div>

      {/* Onglets de filtrage */}
      <div className="flex gap-2 bg-white rounded-xl border border-gray-200 p-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Tous ({favorites.length})
        </button>
        <button
          onClick={() => setActiveTab('annonces')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'annonces'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Annonces ({annoncesFavorites.length})
        </button>
        <button
          onClick={() => setActiveTab('profils')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'profils'
              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Profils ({profilsFavorites.length})
        </button>
      </div>

      {/* Contenu des favoris */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Chargement de vos favoris...</p>
          </div>
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun favori pour le moment</h3>
          <p className="text-gray-500 mb-6">
            {activeTab === 'all' 
              ? "Ajoutez des annonces et profils à vos favoris en cliquant sur le cœur"
              : activeTab === 'annonces'
              ? "Ajoutez des annonces à vos favoris en cliquant sur le cœur"
              : "Ajoutez des profils à vos favoris en cliquant sur le cœur"
            }
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Annonces favorites */}
          {(activeTab === 'all' || activeTab === 'annonces') && annoncesFavorites.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Annonces favorites ({annoncesFavorites.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {annoncesFavorites.map((favorite) => (
                  <div key={favorite.id} className="relative">
                    <AnnonceCard
                      id={favorite.id}
                      titre={favorite.title || favorite.titre || 'Titre manquant'}
                      ville={favorite.ville || 'Ville non renseignée'}
                      prix={favorite.prix}
                      surface={favorite.surface}
                      description={favorite.description}
                      createdAt={favorite.createdAt}
                      imageUrl={favorite.imageUrl || '/images/annonce-holder.svg'}
                      nbChambres={favorite.nbChambres}
                      meuble={favorite.meuble}
                      onClick={() => handleViewAnnonce(favorite.id)}
                    />
                    {/* Bouton supprimer des favoris */}
                    <button
                      onClick={() => handleRemoveFavorite(favorite.id, 'annonce')}
                      className="absolute top-2 left-2 w-8 h-8 bg-red-500/90 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 z-10"
                      title="Supprimer des favoris"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Profils favorites */}
          {(activeTab === 'all' || activeTab === 'profils') && profilsFavorites.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profils favorites ({profilsFavorites.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profilsFavorites.map((favorite) => (
                  <div key={favorite.id} className="relative">
                    <ColocProfileCard
                      id={favorite.id}
                      nom={favorite.nom || favorite.title || 'Nom manquant'}
                      ville={favorite.ville || 'Ville non renseignée'}
                      age={favorite.age}
                      description={favorite.description}
                      createdAt={favorite.createdAt}
                      imageUrl={favorite.imageUrl || '/images/coloc-holder.svg'}
                      zonesLabel={favorite.zones ? JSON.stringify(favorite.zones) : undefined}
                      onClick={() => handleViewProfile(favorite.id)}
                    />
                    {/* Bouton supprimer des favoris */}
                    <button
                      onClick={() => handleRemoveFavorite(favorite.id, 'coloc_profile')}
                      className="absolute top-2 left-2 w-8 h-8 bg-red-500/90 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 z-10"
                      title="Supprimer des favoris"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de détail du profil colocataire */}
      {colocDetailOpen && (
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
            {colocDetailLoading ? (
              <p className="text-slate-600">Chargement…</p>
            ) : !colocDetail ? (
              <p className="text-slate-600">Profil introuvable.</p>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-32 h-32">
                    <img
                      src={colocDetail.imageUrl || '/images/coloc-holder.svg'}
                      alt="Photo de profil"
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
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">À propos</h4>
                    <p className="text-slate-700">{colocDetail.bioCourte}</p>
                  </div>
                )}

                {colocDetail.description && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Description</h4>
                    <p className="text-slate-700">{colocDetail.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {colocDetail.ville && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">Ville</h4>
                      <p className="text-slate-700">{colocDetail.ville}</p>
                    </div>
                  )}
                  {colocDetail.dateDispo && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">Disponible</h4>
                      <p className="text-slate-700">{new Date(colocDetail.dateDispo).toLocaleDateString('fr-FR')}</p>
                    </div>
                  )}
                </div>

                {colocDetail.interets && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Centres d'intérêt</h4>
                    <p className="text-slate-700">{colocDetail.interets}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de détail de l'annonce */}
      {annonceDetailOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setAnnonceDetailOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setAnnonceDetailOpen(false)}
              className="absolute top-3 right-3 text-slate-600 hover:text-slate-900"
              aria-label="Fermer"
            >
              ✖
            </button>
            <h3 className="text-xl font-semibold mb-4">Détail de l'annonce</h3>
            {annonceDetailLoading ? (
              <p className="text-slate-600">Chargement…</p>
            ) : !annonceDetail ? (
              <p className="text-slate-600">Annonce introuvable.</p>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-32 h-32">
                    <img
                      src={annonceDetail.imageUrl || '/images/annonce-holder.svg'}
                      alt="Photo de l'annonce"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-2xl font-bold">
                      {annonceDetail.titre || annonceDetail.title || "Annonce"}
                    </div>
                    <div className="text-slate-700">
                      {annonceDetail.ville && `📍 ${annonceDetail.ville}`}
                    </div>
                    <div className="text-blue-600 font-semibold">
                      {annonceDetail.prix ? `${annonceDetail.prix} €/mois` : "Prix non renseigné"}
                    </div>
                    <div className="text-sm text-slate-600">
                      {annonceDetail.surface && `🏠 ${annonceDetail.surface} m²`}
                      {annonceDetail.nbChambres && ` • ${annonceDetail.nbChambres} chambre(s)`}
                      {annonceDetail.meuble && ` • ${annonceDetail.meuble ? 'Meublé' : 'Non meublé'}`}
                    </div>
                  </div>
                </div>
                
                {annonceDetail.description && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Description</h4>
                    <p className="text-slate-700 whitespace-pre-wrap">{annonceDetail.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {annonceDetail.ville && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">Ville</h4>
                      <p className="text-slate-700">{annonceDetail.ville}</p>
                    </div>
                  )}
                  {annonceDetail.codePostal && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">Code postal</h4>
                      <p className="text-slate-700">{annonceDetail.codePostal}</p>
                    </div>
                  )}
                  {annonceDetail.surface && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">Surface</h4>
                      <p className="text-slate-700">{annonceDetail.surface} m²</p>
                    </div>
                  )}
                  {annonceDetail.nbChambres && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-1">Chambres</h4>
                      <p className="text-slate-700">{annonceDetail.nbChambres}</p>
                    </div>
                  )}
                </div>

                {annonceDetail.createdAt && (
                  <div className="text-sm text-slate-500 border-t pt-4">
                    Annonce publiée le {new Date(annonceDetail.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
