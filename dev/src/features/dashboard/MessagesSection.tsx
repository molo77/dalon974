"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ConversationModal from "@/features/messages/ConversationModal";
import AnnonceDetailModal from "@/shared/components/AnnonceDetailModal";

interface Conversation {
  id: string;
  annonceId: string;
  annonceOwnerId: string;
  annonceOwnerEmail: string;
  annonceOwnerName: string;
  senderId: string;
  senderEmail: string;
  senderName: string;
  messages: any[];
  unreadCount: number;
  lastMessageAt: string;
  lastMessage: string;
  annonce?: {
    id: string;
    titre: string;
    prix: number;
    type: string;
    surface: number;
    ville: string;
  };
}

export default function MessagesSection() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const _router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingConversation, setDeletingConversation] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showBlockModal, setShowBlockModal] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnnonce, setSelectedAnnonce] = useState<any | null>(null);
  const [isAnnonceModalOpen, setIsAnnonceModalOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    
    const fetchConversations = async () => {
      try {
        const response = await fetch('/api/conversations');
        if (response.ok) {
          const data = await response.json();
          setConversations(data);
        } else {
          setError('Erreur lors du chargement des conversations');
        }
      } catch {
        setError('Erreur de connexion');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
    
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "À l'instant";
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)}h`;
    } else if (diffInHours < 48) {
      return "Hier";
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    setDeletingConversation(conversationId);
    try {
      const response = await fetch(`/api/conversations?conversationId=${conversationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Supprimer la conversation de la liste locale
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
        setShowDeleteConfirm(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors de la suppression');
      }
    } catch {
      setError('Erreur de connexion lors de la suppression');
    } finally {
      setDeletingConversation(null);
    }
  };

  const handleDeleteClick = (conversationId: string, event: React.MouseEvent) => {
    event.preventDefault(); // Empêcher la navigation vers la conversation
    event.stopPropagation();
    setShowDeleteConfirm(conversationId);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  const handleBlockUser = async (userId: string) => {
    try {
      const response = await fetch('/api/users/block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blockedId: userId,
          reason: blockReason
        }),
      });

      if (response.ok) {
        setShowBlockModal(null);
        setBlockReason("");
        // Rafraîchir les conversations pour exclure l'utilisateur bloqué
        window.location.reload();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors du blocage');
      }
    } catch {
      setError('Erreur de connexion lors du blocage');
    }
  };

  const handleReportUser = async (userId: string) => {
    try {
      const response = await fetch('/api/users/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportedId: userId,
          reason: reportReason,
          description: reportDescription
        }),
      });

      if (response.ok) {
        setShowReportModal(null);
        setReportReason("");
        setReportDescription("");
        alert('Signalement envoyé avec succès');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors du signalement');
      }
    } catch {
      setError('Erreur de connexion lors du signalement');
    }
  };

  const handleBlockClick = (userId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setShowBlockModal(userId);
  };

  const handleReportClick = (userId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setShowReportModal(userId);
  };

  const handleAnnonceClick = (annonce: any, conversation: Conversation, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedAnnonce(annonce);
    setSelectedConversation(conversation);
    setIsAnnonceModalOpen(true);
  };

  const handleCancelBlock = () => {
    setShowBlockModal(null);
    setBlockReason("");
  };

  const handleCancelReport = () => {
    setShowReportModal(null);
    setReportReason("");
    setReportDescription("");
  };

  const handleOpenConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedConversation(null);
  };

  const handleMessageSent = async () => {
    // Rafraîchir la liste des conversations après l'envoi d'un message
    if (user?.id) {
      try {
        const response = await fetch('/api/conversations');
        if (response.ok) {
          const data = await response.json();
          setConversations(data);
        }
      } catch (error) {
        console.error('Erreur lors du rafraîchissement des conversations:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Chargement des conversations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header avec lien vers la page complète */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Messages</h2>
        <Link
          href="/messages"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Voir tous les messages →
        </Link>
      </div>

      {/* Liste des conversations */}
      {conversations.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <div className="text-gray-400 text-4xl mb-3">📧</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune conversation</h3>
          <p className="text-gray-500">Vous n'avez pas encore de messages.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.slice(0, 5).map((conversation) => {
            const isOwner = conversation.annonceOwnerId === user.id;
            const otherParticipant = isOwner ? 
              (conversation.senderName || conversation.senderEmail) : 
              (conversation.annonceOwnerName || conversation.annonceOwnerEmail);
            
            return (
              <div
                key={conversation.id}
                className="relative group p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleOpenConversation(conversation)}
                    className="flex-1 min-w-0 cursor-pointer text-left hover:bg-gray-50 p-2 -m-2 rounded transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {isOwner ? 'Demande pour votre annonce' : `Conversation avec ${otherParticipant}`}
                      </h3>
                      {conversation.unreadCount > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    {conversation.annonce && (
                      <div className="text-xs text-blue-600 mb-1">
                        📋 <span
                          onClick={(e) => handleAnnonceClick(conversation.annonce, conversation, e)}
                          className="hover:underline hover:text-blue-800 transition-colors cursor-pointer"
                          title="Voir les détails de l'annonce"
                        >
                          {conversation.annonce.titre} - {conversation.annonce.prix}€/mois
                          {conversation.annonce.ville && ` - ${conversation.annonce.ville}`}
                        </span>
                      </div>
                    )}
                    <p className="text-sm text-gray-600 truncate mb-1">
                      {conversation.lastMessage}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatMessageTime(conversation.lastMessageAt)}
                    </p>
                  </button>
                  
                  <div className="ml-4 flex-shrink-0 flex items-center gap-1">
                    {conversation.unreadCount > 0 && (
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    )}
                    
                    {/* Bouton de signalement */}
                    <button
                      onClick={(e) => handleReportClick(isOwner ? conversation.senderId : conversation.annonceOwnerId, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-orange-600 transition-all duration-200"
                      title="Signaler cet utilisateur"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </button>

                    {/* Bouton de blocage */}
                    <button
                      onClick={(e) => handleBlockClick(isOwner ? conversation.senderId : conversation.annonceOwnerId, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-all duration-200"
                      title="Bloquer cet utilisateur"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                      </svg>
                    </button>

                    {/* Bouton de suppression */}
                    <button
                      onClick={(e) => handleDeleteClick(conversation.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-all duration-200"
                      title="Supprimer la conversation"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Modal de confirmation de suppression */}
                {showDeleteConfirm === conversation.id && (
                  <div className="absolute inset-0 bg-white bg-opacity-95 rounded-lg flex items-center justify-center z-10">
                    <div className="text-center p-4">
                      <div className="text-red-600 text-2xl mb-2">⚠️</div>
                      <p className="text-sm font-medium text-gray-900 mb-3">
                        Supprimer cette conversation ?
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        La conversation sera supprimée de votre vue uniquement
                      </p>
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={handleCancelDelete}
                          className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={() => handleDeleteConversation(conversation.id)}
                          disabled={deletingConversation === conversation.id}
                          className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {deletingConversation === conversation.id ? (
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                              Suppression...
                            </div>
                          ) : (
                            'Supprimer'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          {conversations.length > 5 && (
            <div className="text-center pt-4">
              <Link
                href="/messages"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Voir {conversations.length - 5} conversation(s) supplémentaire(s) →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Modal de blocage */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-blue-600/20 backdrop-blur-sm flex items-center justify-center z-[9999] rounded-2xl">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bloquer cet utilisateur</h3>
            <p className="text-sm text-gray-600 mb-4">
              Cette personne ne pourra plus vous contacter et vous ne verrez plus ses messages.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raison du blocage (optionnel)
              </label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Expliquez pourquoi vous bloquez cette personne..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelBlock}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleBlockUser(showBlockModal)}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Bloquer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de signalement */}
      {showReportModal && (
        <div className="fixed inset-0 bg-blue-600/20 backdrop-blur-sm flex items-center justify-center z-[9999] rounded-2xl">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Signaler cet utilisateur</h3>
            <p className="text-sm text-gray-600 mb-4">
              Votre signalement sera examiné par notre équipe de modération.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raison du signalement *
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Sélectionnez une raison</option>
                <option value="spam">Spam ou publicité</option>
                <option value="harassment">Harcèlement</option>
                <option value="inappropriate">Contenu inapproprié</option>
                <option value="fake">Profil faux ou trompeur</option>
                <option value="scam">Tentative d'arnaque</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optionnel)
              </label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Décrivez le problème en détail..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelReport}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleReportUser(showReportModal)}
                disabled={!reportReason}
                className="px-4 py-2 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Signaler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de conversation */}
      <ConversationModal
        conversation={selectedConversation}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onMessageSent={handleMessageSent}
      />

      {/* Modal de détail d'annonce - côte à côte */}
      {isAnnonceModalOpen && selectedAnnonce && (
        <div className="fixed inset-0 z-[99999] bg-blue-600/20 backdrop-blur-sm flex items-center justify-center p-4 rounded-2xl">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex">
            {/* Contenu de l'annonce */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Détail de l'annonce</h3>
                <button
                  onClick={() => {
                    setIsAnnonceModalOpen(false);
                    setSelectedAnnonce(null);
                  }}
                  className="text-slate-600 hover:text-slate-900"
                  aria-label="Fermer"
                >
                  ✖
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{selectedAnnonce.titre}</h4>
                  <p className="text-2xl font-bold text-blue-600">{selectedAnnonce.prix}€/mois</p>
                </div>
                
                {selectedAnnonce.ville && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {selectedAnnonce.ville}
                  </div>
                )}
                
                {selectedAnnonce.type && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {selectedAnnonce.type}
                  </div>
                )}
                
                {selectedAnnonce.surface && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    {selectedAnnonce.surface} m²
                  </div>
                )}
              </div>
            </div>
            
            {/* Séparateur vertical */}
            <div className="w-px bg-gray-200"></div>
            
            {/* Conversation côte à côte */}
            <div className="flex-1 p-6 overflow-y-auto">
              <h3 className="text-xl font-semibold mb-4">Conversation</h3>
              {selectedConversation && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>Conversation avec:</strong> {selectedConversation.senderName || selectedConversation.senderEmail}
                    </div>
                    <div className="text-sm text-gray-500 mb-2">
                      <strong>Dernier message:</strong> {selectedConversation.lastMessage}
                    </div>
                    {selectedConversation.unreadCount > 0 && (
                      <div className="text-sm text-red-600 mb-2">
                        <strong>Messages non lus:</strong> {selectedConversation.unreadCount}
                      </div>
                    )}
                    <div className="text-xs text-gray-400">
                      {formatMessageTime(selectedConversation.lastMessageAt)}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setIsAnnonceModalOpen(false);
                      setSelectedAnnonce(null);
                      // Ouvrir la conversation complète
                      setSelectedConversation(selectedConversation);
                      setIsModalOpen(true);
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Ouvrir la conversation complète
                  </button>
                  
                  <button
                    onClick={() => {
                      setIsAnnonceModalOpen(false);
                      setSelectedAnnonce(null);
                    }}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
