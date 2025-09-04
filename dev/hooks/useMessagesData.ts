import { useMessages } from "@/contexts/MessagesContext";

export default function useMessagesData(params: {
  user: any;
  firestoreError: string | null;
  userDocLoaded: boolean;
  showToast: (type: "success" | "error" | "info", msg: string) => void;
  handleFirestoreError: (err: any, ctx: string) => void;
}) {
  // Utiliser le contexte centralisé pour les messages
  const { messages, sentMessages, setMessages, setSentMessages, refreshMessages } = useMessages();

  return { 
    messages, 
    sentMessages, 
    setMessages, 
    setSentMessages,
    refreshMessages // Exposer la fonction de rafraîchissement si nécessaire
  };
}
