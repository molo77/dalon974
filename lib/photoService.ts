import { collection, addDoc, getDocs, query, where, deleteDoc, Timestamp, setDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Upload a file via the Next.js local API and create a Firestore doc in colocProfiles/{uid}/images
export async function uploadColocPhotoWithMeta(file: File, userId: string) {
  if (!file) {
    console.error('[uploadColocPhotoWithMeta] Aucun fichier sélectionné');
    throw new Error('Aucun fichier sélectionné');
  }
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Erreur upload local');
  const data = await res.json();
  const url = data.url;
  // Créer un doc Firestore dans la sous-collection images
  const imagesCol = collection(db, "colocProfiles", userId, "images");
  try {
    const docRef = await addDoc(imagesCol, {
      url,
      name: file.name,
      createdAt: Timestamp.now(),
      size: file.size,
      type: file.type,
      storagePath: url,
    });
    return { url, id: docRef.id };
  } catch (err: any) {
    console.error('[uploadColocPhotoWithMeta] Firestore error:', err);
    throw err;
  }
}

// Delete photo meta doc in Firestore (images subcollection) and request local server to delete the file
export async function deleteColocPhotoWithMeta(userId: string, url: string) {
  const imagesCol = collection(db, "colocProfiles", userId, "images");
  const q = query(imagesCol, where("url", "==", url));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const docImg = snap.docs[0];
    try { await deleteDoc(docImg.ref); } catch (e) { console.warn('Erreur suppression doc image', e); }
  }
  try {
    await fetch('/api/delete-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
  } catch (e) {
    // ignore server delete error
  }
}

// Upload for annonce images (annonceId is the doc id under 'annonces')
export async function uploadAnnoncePhotoWithMeta(file: File, annonceId: string) {
  if (!file) throw new Error('Aucun fichier sélectionné');
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Erreur upload local');
  const data = await res.json();
  const url = data.url;
  const imagesCol = collection(db, "annonces", annonceId, "images");
  const docRef = await addDoc(imagesCol, { url, name: file.name, createdAt: Timestamp.now(), size: file.size, type: file.type, storagePath: url });
  return { url, id: docRef.id };
}

export async function deleteAnnoncePhotoWithMeta(annonceId: string, url: string) {
  const imagesCol = collection(db, "annonces", annonceId, "images");
  const q = query(imagesCol, where("url", "==", url));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const docImg = snap.docs[0];
    try { await deleteDoc(docImg.ref); } catch (e) { console.warn('Erreur suppression doc image annonce', e); }
  }
  try {
    await fetch('/api/delete-upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
  } catch (e) {}
}

// Set main photo index for a coloc profile
export async function setColocMainPhoto(userId: string, idx: number) {
  if (!userId) throw new Error('userId required');
  const ref = doc(db, 'colocProfiles', userId);
  await setDoc(ref, { mainPhotoIdx: idx, updatedAt: serverTimestamp() }, { merge: true });
}

// Set main photo index for an annonce
export async function setAnnonceMainPhoto(annonceId: string, idx: number) {
  if (!annonceId) throw new Error('annonceId required');
  const ref = doc(db, 'annonces', annonceId);
  await setDoc(ref, { mainPhotoIdx: idx, updatedAt: serverTimestamp() }, { merge: true });
}
