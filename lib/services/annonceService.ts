import { db } from "@/lib/firebase";
import { addDoc, collection, deleteDoc, doc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, startAfter, updateDoc, where } from "firebase/firestore";

export async function listUserAnnoncesPage(userId: string, opts?: { lastDoc?: any; pageSize?: number }) {
  const base = query(collection(db, "annonces"), where("userId", "==", userId), limit(opts?.pageSize ?? 10));
  const q = opts?.lastDoc ? query(base, startAfter(opts.lastDoc)) : base;
  const snap = await getDocs(q);
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const newLast = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;
  return { items, lastDoc: newLast };
}

export function subscribeUserAnnonces(userId: string, cb: (items: any[]) => void, onErr: (e: any) => void) {
  const q = query(collection(db, "annonces"), where("userId", "==", userId), orderBy("createdAt", "desc"));
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))), onErr);
}

export async function addAnnonce(user: { uid: string; email: string | null }, data: any) {
  return addDoc(collection(db, "annonces"), {
    ...data,
    createdAt: serverTimestamp(),
    userId: user.uid,
    userEmail: user.email,
  });
}

export async function updateAnnonce(id: string, patch: any) {
  await updateDoc(doc(db, "annonces", id), patch);
}

export async function deleteAnnonce(id: string) {
  await deleteDoc(doc(db, "annonces", id));
}
