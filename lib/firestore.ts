// lib/firestore.ts
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export type Annonce = {
  id: string;
  titre: string;
  ville: string;
  prix: number;
  imageUrl?: string;
};

export async function getAnnonces(): Promise<Annonce[]> {
  const q = query(collection(db, "annonces"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Annonce, "id">),
  }));
}
