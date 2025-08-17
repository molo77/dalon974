"use client";

import { db } from "@/lib/firebase";
import MessageModal from "@/components/MessageModal";
import AnnonceModal from "@/components/AnnonceModal";
import { doc, getDoc } from "firebase/firestore";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import ExpandableImage from "@/components/ExpandableImage";

const ImageLightbox = dynamic(() => import("@/components/ImageLightbox"), { ssr: false });
import { useAuth } from "@/components/AuthProvider";
import { updateAnnonce, deleteAnnonce as deleteAnnonceSvc } from "@/lib/services/annonceService";

export default function AnnonceDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data } = useSession();
  const user = data?.user as any;

  const [annonce, setAnnonce] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const snap = await getDoc(doc(db, "annonces", id));
        if (mounted) setAnnonce(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, [id]);

  // Rôle admin fourni par AuthProvider (temps réel)
  const isOwner = useMemo(() => {
    if (!user || !annonce) return false;
    return annonce.uid === user.uid || annonce.ownerId === user.uid;
  }, [user, annonce]);

  const canEdit = isAdmin || isOwner;

  if (loading) {
    return <main className="min-h-screen p-6 flex items-center justify-center">Chargement…</main>;
  }

  if (!annonce) {
    return <main className="min-h-screen p-6 flex items-center justify-center">Annonce introuvable.</main>;
  }

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <div className="w-full max-w-3xl mx-auto">
        <div className="border rounded-xl shadow p-6 bg-white flex flex-col items-center">
          <h1 className="text-3xl font-bold mb-4 text-center">{annonce?.titre}</h1>
          <p className="text-gray-600 mb-2 text-lg">📍 {annonce?.ville}</p>
          <p className="text-blue-600 font-bold text-xl mb-4">{annonce?.prix} € / mois</p>
          {annonce?.imageUrl && (
            <ExpandableImage
              src={annonce.imageUrl}
              images={annonce.photos || (annonce.imageUrl ? [annonce.imageUrl] : [])}
              className="w-full h-72 object-cover rounded mb-6"
              alt={annonce?.titre}
            />
          )}
          {/* Galerie : afficher toutes les photos uploadées si présentes */}
          {Array.isArray(annonce?.photos) && annonce.photos.length > 0 && (
            <GalleryBlock images={annonce.photos} />
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

          {/* Barre d’actions (visible uniquement pour propriétaire ou admin) */}
          {canEdit && (
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
                disabled={updating}
              >
                Modifier
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!confirm("Supprimer cette annonce ?")) return;
                  try {
                    setDeleting(true);
                    await deleteAnnonceSvc(annonce.id);
                    router.push("/"); // ou "/dashboard" selon préférence
                  } catch (e) {
                    console.error("[Annonce][Delete]", e);
                    alert("Erreur lors de la suppression.");
                  } finally {
                    setDeleting(false);
                  }
                }}
                className="bg-rose-600 text-white px-4 py-2 rounded hover:bg-rose-700 disabled:opacity-60"
                disabled={deleting}
              >
                Supprimer
              </button>
            </div>
          )}

          {/* Modal d’édition (fallback ville simple si pas de datalist fournie) */}
          <AnnonceModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            annonce={annonce}
            onSubmit={async ({ titre, ville, prix, imageUrl, surface, nbChambres, equipements, description }) => {
              try {
                setUpdating(true);
                const payload: any = {
                  titre,
                  ville,
                  prix: prix ? Number(prix) : null,
                  imageUrl,
                  surface: surface ? Number(surface) : null,
                  nbChambres: nbChambres ? Number(nbChambres) : null,
                  equipements,
                  description,
                };
                Object.keys(payload).forEach((k) => (payload[k] === "" || payload[k] === null) && delete payload[k]);
                await updateAnnonce(annonce.id, payload);
                // Rafraîchir les données locales
                setAnnonce((prev: any) => ({ ...(prev || {}), ...payload }));
              } catch (e) {
                console.error("[Annonce][Update]", e);
                alert("Erreur lors de la mise à jour.");
              } finally {
                setUpdating(false);
              }
            }}
          />
        </div>
      </div>
    </main>
  );
}

function GalleryBlock({ images }: { images: string[] }) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  return (
    <div className="w-full mb-6">
      <div className="text-sm font-medium text-slate-600 mb-2">📷 Galerie</div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-slate-600">📷 Galerie</div>
        <div>
          <button type="button" className="text-sm text-blue-600 hover:underline" onClick={() => { setIdx(0); setOpen(true); }}>
            Agrandir la galerie
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {images.map((u, i) => (
          <div key={i} className="block rounded-lg overflow-hidden border p-0">
            <Image src={u} alt={`photo-${i+1}`} width={224} height={112} className="w-full h-28 object-cover" sizes="(max-width: 640px) 50vw, 25vw" />
          </div>
        ))}
      </div>
      {open && <ImageLightbox images={images} initialIndex={idx} onClose={() => setOpen(false)} />}
    </div>
  );
}

