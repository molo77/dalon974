"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Conversation {
  id: string;
  annonceId: string;
  annonceOwnerId: string;
  senderId: string;
  senderEmail: string;
  messages: any[];
  unreadCount: number;
  lastMessageAt: string;
  lastMessage: string;
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
            const otherParticipant = isOwner ? conversation.senderEmail : conversation.annonceOwnerId;
            
            return (
              <div
                key={conversation.id}
                className="relative group p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Link
                  href={`/messages/${conversation.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
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
                      <p className="text-sm text-gray-600 truncate mb-1">
                        {conversation.lastMessage}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatMessageTime(conversation.lastMessageAt)}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex items-center gap-2">
                      {conversation.unreadCount > 0 && (
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      )}
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
                </Link>

                {/* Modal de confirmation de suppression */}
                {showDeleteConfirm === conversation.id && (
                  <div className="absolute inset-0 bg-white bg-opacity-95 rounded-lg flex items-center justify-center z-10">
                    <div className="text-center p-4">
                      <div className="text-red-600 text-2xl mb-2">⚠️</div>
                      <p className="text-sm font-medium text-gray-900 mb-3">
                        Supprimer cette conversation ?
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        Cette action est irréversible
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
    </div>
  );
}
