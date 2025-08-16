import { useEffect, useState } from "react";
import { collection, getDocs, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { listMessagesForOwner } from "@/lib/services/messageService";

export default function useMessagesData(params: {
  user: any;
  firestoreError: string | null;
  userDocLoaded: boolean;
  showToast: (type: "success" | "error" | "info", msg: string) => void;
  handleFirestoreError: (err: any, ctx: string) => void;
}) {
  const { user, firestoreError, userDocLoaded, showToast, handleFirestoreError } = params;
  const [messages, setMessages] = useState<any[]>([]);
  const [sentMessages, setSentMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!user || firestoreError || !userDocLoaded) return;
    (async () => {
      try {
        const msgs = await listMessagesForOwner(user.uid);
        setMessages(msgs);
      } catch (err: any) {
        if (err?.code === "failed-precondition" && String(err?.message || "").toLowerCase().includes("index")) {
          try {
            const q = query(collection(db, "messages"), where("annonceOwnerId", "==", user.uid));
            const snap = await getDocs(q);
            const unsorted = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            unsorted.sort((a: any, b: any) => (b?.createdAt?.seconds || 0) - (a?.createdAt?.seconds || 0));
            setMessages(unsorted);
          } catch (fallbackErr: any) {
            handleFirestoreError(fallbackErr, "messages-fallback");
          }
        } else {
          handleFirestoreError(err, "messages");
        }
      }
    })();
  }, [user, firestoreError, userDocLoaded]);

  useEffect(() => {
    if (!user || firestoreError || !userDocLoaded) return;
    let unsubscribe: undefined | (() => void);

    const qWithOrder = query(
      collection(db, "messages"),
      where("annonceOwnerId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    try {
      unsubscribe = onSnapshot(
        qWithOrder,
        (snap) => setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => {
          if (err?.code === "failed-precondition" && String(err?.message || "").toLowerCase().includes("index")) {
            try {
              const qNoOrder = query(collection(db, "messages"), where("annonceOwnerId", "==", user.uid));
              unsubscribe = onSnapshot(
                qNoOrder,
                (snap2) => {
                  const arr = snap2.docs.map((d) => ({ id: d.id, ...d.data() }));
                  arr.sort((a: any, b: any) => (b?.createdAt?.seconds || 0) - (a?.createdAt?.seconds || 0));
                  setMessages(arr);
                },
                (e2) => handleFirestoreError(e2, "messages-fallback-snapshot")
              );
              
            } catch (inner) {
              handleFirestoreError(inner, "messages-fallback-setup");
            }
          } else {
            handleFirestoreError(err, "messages-snapshot");
          }
        }
      );
    } catch (e: any) {
      handleFirestoreError(e, "messages-snapshot-setup");
    }
    return () => { if (unsubscribe) unsubscribe(); };
  }, [user, firestoreError, userDocLoaded]);

  useEffect(() => {
    if (!user || firestoreError || !userDocLoaded) return;
    let unsubscribe: undefined | (() => void);

    const qWithOrder = query(
      collection(db, "messages"),
      where("fromUserId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    try {
      unsubscribe = onSnapshot(
        qWithOrder,
        (snap) => setSentMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => {
          if (err?.code === "failed-precondition" && String(err?.message || "").toLowerCase().includes("index")) {
            try {
              const qNoOrder = query(collection(db, "messages"), where("fromUserId", "==", user.uid));
              unsubscribe = onSnapshot(
                qNoOrder,
                (snap2) => {
                  const arr = snap2.docs.map((d) => ({ id: d.id, ...d.data() }));
                  arr.sort((a: any, b: any) => (b?.createdAt?.seconds || 0) - (a?.createdAt?.seconds || 0));
                  setSentMessages(arr);
                },
                (e2) => handleFirestoreError(e2, "sent-fallback-snapshot")
              );
              
            } catch (inner) {
              handleFirestoreError(inner, "sent-fallback-setup");
            }
          } else {
            handleFirestoreError(err, "sent-snapshot");
          }
        }
      );
    } catch (e: any) {
      handleFirestoreError(e, "sent-snapshot-setup");
    }
    return () => { if (unsubscribe) unsubscribe(); };
  }, [user, firestoreError, userDocLoaded]);

  return { messages, sentMessages, setMessages, setSentMessages };
}
