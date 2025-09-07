"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

export default function ConversationsList() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const _router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (conversations.length === 0) {
    return (
      <div className="text-center p-8">
        <div className="text-gray-400 text-6xl mb-4">📧</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune conversation</h3>
        <p className="text-gray-500">Vous n'avez pas encore de messages.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => {
        const isOwner = conversation.annonceOwnerId === user.id;
        const otherParticipant = isOwner ? 
          (conversation.senderName || conversation.senderEmail) : 
          (conversation.annonceOwnerName || conversation.annonceOwnerEmail);
        
        return (
          <Link
            key={conversation.id}
            href={`/messages/${conversation.id}`}
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
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
                {conversation.annonce && (
                  <div className="text-xs text-blue-600 mb-1">
                    📋 {conversation.annonce.titre} - {conversation.annonce.prix}€/mois
                    {conversation.annonce.ville && ` - ${conversation.annonce.ville}`}
                  </div>
                )}
                <p className="text-sm text-gray-600 truncate">
                  {conversation.lastMessage}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(conversation.lastMessageAt).toLocaleString('fr-FR')}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                {conversation.unreadCount > 0 && (
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
