import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";

type Props = {
  params: Promise<{ id: string }>;

};

export default async function AnnonceDetailPage({ params }: Props) {
  const { id } = await params; // Attendre params avant d'utiliser id
  const docRef = doc(db, "annonces", id);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return notFound();
  }

  const annonce = snapshot.data();

  // Détermine la provenance via un cookie "annonceOrigin"
  const origin = (await cookies()).get("annonceOrigin")?.value;

  let retourHref = "/";
  if (origin === "dashboard") {
    retourHref = "/dashboard";
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="border rounded-xl shadow p-6 bg-white flex flex-col items-center">
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
          <div className="mt-4 w-full flex flex-col gap-2">
            {/* Champs supplémentaires */}
            {annonce?.surface && (
              <p className="text-gray-700">
                <span className="font-semibold">Surface :</span> {annonce.surface} m²
              </p>
            )}
            {annonce?.nbChambres && (
              <p className="text-gray-700">
                <span className="font-semibold">Nombre de pièces :</span> {annonce.nbChambres}
              </p>
            )}
            {annonce?.equipements && (
              <p className="text-gray-700">
                <span className="font-semibold">Équipements :</span> {annonce.equipements}
              </p>
            )}
            {annonce?.description && (
              <div className="text-gray-700">
                <span className="font-semibold">Description :</span>
                <div className="whitespace-pre-line mt-1">
                  {annonce.description}
                </div>
              </div>
            )}
            {annonce?.userEmail && (
              <p className="text-gray-700">
                <span className="font-semibold">Contact :</span> {annonce.userEmail}
              </p>
            )}
            {annonce?.createdAt && (
              <p className="text-gray-500 text-sm">
                <span className="font-semibold">Créée le :</span>{" "}
                {annonce.createdAt.toDate
                  ? annonce.createdAt.toDate().toLocaleString()
                  : annonce.createdAt}
              </p>
            )}
          </div>
          <a
            href={retourHref}
            className="mt-8 text-blue-600 hover:underline font-medium"
          >
            ← Retour aux annonces
          </a>
        </div>
      </div>
    </main>
  );
}

