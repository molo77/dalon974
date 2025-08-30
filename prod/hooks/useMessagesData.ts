import { useEffect, useState } from "react";
import { listMessagesForOwner, listMessagesFromUser } from "@/lib/services/messageService";

export default function useMessagesData(params: {
  user: any;
  firestoreError: string | null;
  userDocLoaded: boolean;
  showToast: (type: "success" | "error" | "info", msg: string) => void;
  handleFirestoreError: (err: any, ctx: string) => void;
}) {
  const { user, firestoreError, userDocLoaded } = params;
  const [messages, setMessages] = useState<any[]>([]);
  const [sentMessages, setSentMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!user || firestoreError || !userDocLoaded) return;
    let stopped = false;
    const load = async () => {
      try {
        const [inbox, sent] = await Promise.all([
          listMessagesForOwner(user.id || user.uid),
          listMessagesFromUser(user.id || user.uid),
        ]);
        if (!stopped) {
          setMessages(inbox);
          setSentMessages(sent);
        }
  } catch {
        // silencieux
      }
    };
    load();
    const t = setInterval(load, 10000);
    return () => { stopped = true; clearInterval(t); };
  }, [user, firestoreError, userDocLoaded]);

  return { messages, sentMessages, setMessages, setSentMessages };
}
