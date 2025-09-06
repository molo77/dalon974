"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { showToast } from "@/infrastructure/communication/toast";

interface MessagesContextType {
  messages: any[];
  sentMessages: any[];
  unreadCount: number;
  hasNewMessages: boolean;
  setMessages: (messages: any[]) => void;
  setSentMessages: (messages: any[]) => void;
  refreshMessages: () => Promise<void>;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const user = session?.user as any;
  
  const [messages, setMessages] = useState<any[]>([]);
  const [sentMessages, setSentMessages] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [hasNewMessages, setHasNewMessages] = useState<boolean>(false);
  
  const previousMessageCount = useRef<number>(0);
  const isFirstLoad = useRef<boolean>(true);
  const lastFetchTime = useRef<number>(0);
  const fetchInterval = useRef<NodeJS.Timeout | null>(null);

  // Fonction pour demander la permission de notification
  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return Notification.permission === "granted";
  };

  // Fonction pour afficher une notification
  const showNotification = (message: any) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Nouveau message reçu", {
        body: `De: ${message.senderEmail}\nContenu: ${message.content.substring(0, 50)}...`,
        icon: "/favicon.ico",
        tag: `message-${message.id}`,
      });
    }
  };

  // Fonction pour rafraîchir les messages
  const refreshMessages = async () => {
    if (!user?.id) return;
    
    const now = Date.now();
    // Éviter les requêtes trop fréquentes (minimum 5 secondes entre les requêtes)
    if (now - lastFetchTime.current < 5000) {
      return;
    }
    
    lastFetchTime.current = now;
    
    try {
      // Utiliser la nouvelle API des conversations
      const conversationsResponse = await fetch('/api/conversations');
      
      if (conversationsResponse.ok) {
        const conversations = await conversationsResponse.json();
        
        // Extraire tous les messages des conversations
        const allMessages: any[] = [];
        let totalUnreadCount = 0;
        
        conversations.forEach((conversation: any) => {
          allMessages.push(...conversation.messages);
          totalUnreadCount += conversation.unreadCount;
        });
        
        // Détecter les nouveaux messages
        if (!isFirstLoad.current && allMessages.length > previousMessageCount.current) {
          const newMessages = allMessages.slice(0, allMessages.length - previousMessageCount.current);
          
          // Afficher une alerte pour chaque nouveau message
          newMessages.forEach((message: any) => {
            showToast("info", `💬 Nouveau message de ${message.senderEmail}`);
            showNotification(message);
          });
          
          setHasNewMessages(true);
          // Réinitialiser l'indicateur après 5 secondes
          setTimeout(() => setHasNewMessages(false), 5000);
        }
        
        setMessages(allMessages);
        setUnreadCount(totalUnreadCount);
        previousMessageCount.current = allMessages.length;
        isFirstLoad.current = false;
      }
    } catch (error) {
      console.error("Erreur lors du chargement des messages:", error);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    
    // Demander la permission de notification au premier chargement
    if (isFirstLoad.current) {
      requestNotificationPermission();
    }
    
    // Chargement initial
    refreshMessages();
    
    // Vérifier toutes les 30 secondes au lieu de 10 secondes
    fetchInterval.current = setInterval(refreshMessages, 30000);
    
    return () => {
      if (fetchInterval.current) {
        clearInterval(fetchInterval.current);
      }
    };
  }, [user?.id, refreshMessages]);

  const value: MessagesContextType = {
    messages,
    sentMessages,
    unreadCount,
    hasNewMessages,
    setMessages,
    setSentMessages,
    refreshMessages,
  };

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  const context = useContext(MessagesContext);
  if (context === undefined) {
    throw new Error("useMessages must be used within a MessagesProvider");
  }
  return context;
}
