import { db } from "@/lib/firebase";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, query, setDoc, updateDoc, where, writeBatch } from "firebase/firestore";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

export async function listUsers() {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getUserRole(uid: string): Promise<string | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data().role || null) : null;
}

export async function ensureUserDoc(uid: string, data: { email: string; displayName: string; role: string; providerId: string }) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { ...data, createdAt: Date.now() });
  } else if (!snap.data()?.providerId) {
    await setDoc(ref, { providerId: data.providerId }, { merge: true });
  }
}

export async function createUserDoc(data: { email: string; displayName?: string; role: string }) {
  return addDoc(collection(db, "users"), data);
}

export async function updateUserDoc(id: string, patch: { email: string; displayName: string; role: string }) {
  await updateDoc(doc(db, "users", id), patch);
}

export async function deleteUserDoc(id: string) {
  await deleteDoc(doc(db, "users", id));
}

export async function normalizeUsers(): Promise<number> {
  const snap = await getDocs(collection(db, "users"));
  const batch = writeBatch(db);
  let count = 0;
  snap.forEach(s => {
    const d = s.data() as any;
    const patch: any = {};
    if (d.providerId == null) patch.providerId = "password";
    if (d.role == null) patch.role = "user";
    if (d.createdAt == null) patch.createdAt = Date.now();
    if (d.displayName == null) patch.displayName = "";
    if (Object.keys(patch).length) {
      batch.update(doc(db, "users", s.id), patch);
      count++;
    }
  });
  if (count) await batch.commit();
  return count;
}

export async function sendResetTo(email: string) {
  const auth = getAuth();
  await sendPasswordResetEmail(auth, email);
}
