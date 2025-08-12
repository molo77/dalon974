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
    <main className="w-full mx-auto p-6 bg-white shadow mt-6 rounded flex flex-col items-center">
      <div className="w-full max-w-2xl flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-4 text-center">{annonce?.titre}</h1>
        <p className="text-gray-600 mb-2 text-lg">📍 {annonce?.ville}</p>
        <p className="text-blue-600 font-bold text-xl mb-4">{annonce?.prix} € / mois</p>
        {annonce?.imageUrl && (
          <img
            src={annonce.imageUrl}
            alt={annonce?.titre}
            className="w-full h-72 object-cover rounded mb-6"
          />
        )}
        {/* Plus d'infos sur l'annonce */}
        <div className="mt-4 w-full flex flex-col gap-2">
          {annonce?.surface && (
            <p className="text-gray-700">
              <span className="font-semibold">Surface :</span> {annonce.surface} m²
            </p>
          )}
          {annonce?.description && (
            <p className="text-gray-700">
              <span className="font-semibold">Description :</span> {annonce.description}
            </p>
          )}
          {annonce?.nbChambres && (
            <p className="text-gray-700">
              <span className="font-semibold">Chambres :</span> {annonce.nbChambres}
            </p>
          )}
          {annonce?.equipements && (
            <p className="text-gray-700">
              <span className="font-semibold">Équipements :</span> {annonce.equipements}
            </p>
          )}
          {annonce?.userEmail && (
            <p className="text-gray-700">
              <span className="font-semibold">Contact :</span> {annonce.userEmail}
            </p>
          )}
          {/* Ajoutez d'autres champs si besoin */}
        </div>
        <a
          href="/"
          className="mt-8 text-blue-600 hover:underline font-medium"
        >
          ← Retour aux annonces
        </a>
      </div>
    </main>
  );
}
