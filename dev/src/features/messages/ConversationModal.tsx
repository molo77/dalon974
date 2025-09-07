"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface Message {
  id: string;
  content: string;
  senderId: string;
  annonceOwnerId: string;
  createdAt: string;
  isRead: boolean;
}

interface Conversation {
  id: string;
  annonceId: string;
  annonceOwnerId: string;
  annonceOwnerName: string;
  annonceOwnerEmail: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  annonce: {
    id: string;
    titre: string;
    prix: number;
    type: string;
    surface: number;
    ville: string;
  } | null;
  messages: Message[];
  unreadCount: number;
  lastMessageAt: string;
  lastMessage: string;
}

interface ConversationModalProps {
  conversation: Conversation | null;
  isOpen: boolean;
  onClose: () => void;
  onMessageSent: () => void;
}

const ConversationModal: React.FC<ConversationModalProps> = ({
  conversation,
  isOpen,
  onClose,
  onMessageSent
}) => {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Charger les messages quand la conversation change
  useEffect(() => {
    console.log('[ConversationModal] useEffect déclenché:', { conversation: conversation?.id, isOpen });
    if (conversation && isOpen) {
      loadMessages();
    }
  }, [conversation, isOpen]);

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    if (!conversation) return;
    
    console.log('[ConversationModal] Chargement des messages pour:', conversation.id);
    setLoading(true);
    try {
      const response = await fetch(`/api/conversations/${conversation.id}`);
      console.log('[ConversationModal] Réponse API:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('[ConversationModal] Données reçues:', data);
        setMessages(data.messages || []);
      } else {
        console.error('[ConversationModal] Erreur API:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('[ConversationModal] Erreur lors du chargement des messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation || !session?.user) return;

    setSending(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
          annonceId: conversation.annonceId,
          annonceOwnerId: conversation.annonceOwnerId,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        await loadMessages(); // Recharger les messages
        onMessageSent(); // Notifier le parent pour rafraîchir la liste
      } else {
        console.error('Erreur lors de l\'envoi du message');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    }
  };

  if (!isOpen || !conversation) return null;

  const isOwner = session?.user?.id === conversation.annonceOwnerId;
  const otherParticipant = isOwner ? 
    (conversation.senderName || conversation.senderEmail) : 
    (conversation.annonceOwnerName || conversation.annonceOwnerEmail);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">
              {isOwner ? 'Demande pour votre annonce' : `Conversation avec ${otherParticipant}`}
            </h2>
            {conversation.annonce && (
              <div className="text-sm text-blue-600 mt-1">
                📋 {conversation.annonce.titre} - {conversation.annonce.prix}€/mois
                {conversation.annonce.ville && ` - ${conversation.annonce.ville}`}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Chargement des messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Aucun message dans cette conversation
            </div>
          ) : (
            messages.map((message) => {
              const isMyMessage = message.senderId === session?.user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isMyMessage
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      isMyMessage ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatMessageTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tapez votre message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
              disabled={sending}
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationModal;
