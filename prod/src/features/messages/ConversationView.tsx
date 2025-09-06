"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderEmail: string;
  createdAt: string;
  parentMessageId?: string;
  isRead: boolean;
}

interface ConversationViewProps {
  conversationId: string;
}

export default function ConversationView({ conversationId }: ConversationViewProps) {
  const { data: session } = useSession();
  const user = session?.user as any;
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Ne pas charger les messages si l'utilisateur n'est pas authentifié
    if (!user?.id) {
      console.log('[ConversationView] Utilisateur non authentifié, attente...');
      setLoading(true);
      return;
    }
    
    const fetchMessages = async () => {
      try {
        console.log('[ConversationView] Fetching messages for conversation:', conversationId);
        console.log('[ConversationView] User ID:', user.id);
        
        const response = await fetch(`/api/conversations/${conversationId}`);
        console.log('[ConversationView] Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[ConversationView] Messages received:', data.length);
          setMessages(data);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('[ConversationView] API Error:', response.status, errorData);
          
          if (response.status === 401) {
            setError('Session expirée. Veuillez vous reconnecter.');
          } else if (response.status === 403) {
            setError('Accès non autorisé à cette conversation.');
          } else {
            setError(`Erreur lors du chargement des messages (${response.status})`);
          }
        }
      } catch (err) {
        console.error('[ConversationView] Network error:', err);
        setError('Erreur de connexion au serveur');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [conversationId, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    setError(null); // Clear previous errors
    
    try {
      console.log('[ConversationView] Sending message:', newMessage.trim());
      
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage.trim()
        }),
      });

      console.log('[ConversationView] Send response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('[ConversationView] Message sent successfully:', result.data);
        setMessages(prev => [...prev, result.data]);
        setNewMessage("");
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('[ConversationView] Send error:', response.status, errorData);
        
        if (response.status === 401) {
          setError('Session expirée. Veuillez vous reconnecter.');
        } else if (response.status === 403) {
          setError('Accès non autorisé à cette conversation.');
        } else {
          setError(`Erreur lors de l'envoi du message (${response.status})`);
        }
      }
    } catch (err) {
      console.error('[ConversationView] Send network error:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Chargement des messages...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 mb-3">{error}</p>
        {(error.includes('Session expirée') || error.includes('non authentifié')) && (
          <button
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Se reconnecter
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header de la conversation */}
      <div className="border-b border-gray-200 p-4 bg-white">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 mb-2"
        >
          ← Retour aux conversations
        </button>
        <h2 className="text-lg font-semibold text-gray-900">
          Conversation
        </h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Aucun message dans cette conversation
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId === user.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwnMessage
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {formatMessageTime(message.createdAt)}
                    {!isOwnMessage && !message.isRead && (
                      <span className="ml-1">• Non lu</span>
                    )}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Formulaire d'envoi */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tapez votre message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Envoi...' : 'Envoyer'}
          </button>
        </form>
      </div>
    </div>
  );
}
