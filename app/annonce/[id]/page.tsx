import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { notFound } from "next/navigation";

type Props = {
  params: {
    id: string;
  };
};

export default async function AnnonceDetailPage({ params }: Props) {
  const docRef = doc(db, "annonces", params.id);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return notFound();
  }

  const annonce = snapshot.data();

  return (
    <main className="max-w-xl mx-auto p-6 bg-white shadow mt-6 rounded">
      <h1 className="text-2xl font-bold mb-2">{annonce?.titre}</h1>
      <p className="text-gray-600 mb-2">📍 {annonce?.ville}</p>
      <p className="text-blue-600 font-bold text-lg mb-4">{annonce?.prix} € / mois</p>
      {annonce?.imageUrl && (
        <img
          src={annonce.imageUrl}
          alt={annonce?.titre}
          className="w-full h-64 object-cover rounded"
        />
      )}
    </main>
  );
}
