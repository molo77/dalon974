"use client";

import { db } from "@/lib/firebase";
import MessageModal from "@/components/MessageModal";
import { doc, getDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AnnonceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [annonce, setAnnonce] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showMessageModal, setShowMessageModal] = useState(false);

  useEffect(() => {
    const fetchAnnonce = async () => {
      if (!id) return;
      const docRef = doc(db, "annonces", id as string);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setAnnonce({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    };
    fetchAnnonce();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }
  if (!annonce) {
    return <div className="p-8 text-center text-red-600">Annonce introuvable.</div>;
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
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-4"
            onClick={() => setShowMessageModal(true)}
          >
            Contacter
          </button>
          <MessageModal
            annonceId={annonce.id}
            annonceOwnerId={annonce.userId}
            isOpen={showMessageModal}
            onClose={() => setShowMessageModal(false)}
          />
          <button
            className="mt-8 text-blue-600 hover:underline font-medium"
            onClick={() => router.back()}
            type="button"
          >
            ← Retour aux annonces
          </button>
        </div>
      </div>
    </main>
  );
}

