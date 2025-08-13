import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";

export async function listMessagesForOwner(ownerId: string) {
  const q = query(collection(db, "messages"), where("annonceOwnerId", "==", ownerId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
