"use client";

import { useState } from "react";
import PhotoUploader from "./PhotoUploader";

export default function ColocProfileModal({
  open,
  onClose,
  profile,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  profile: any;
  onSubmit: (data: any) => void;
}) {
  const [form, setForm] = useState({
    nom: profile?.nom || "",
    description: profile?.description || "",
    photos: Array.isArray(profile?.photos) ? profile.photos : [],
    imageUrl: profile?.imageUrl || "",
  });
  const [mainPhoto, setMainPhoto] = useState<string | undefined>(profile?.imageUrl);

  return open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-black" onClick={onClose}>✕</button>
        <h2 className="text-lg font-bold mb-4">Modifier le profil colocataire</h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            onSubmit({ ...form, imageUrl: mainPhoto });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Nom</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={form.nom}
              onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="border rounded px-3 py-2 w-full"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Photos</label>
            <PhotoUploader
              initial={form.photos}
              initialMain={mainPhoto}
              openOnClick={true}
              onChange={list => {
                setForm(f => ({ ...f, photos: list.map(l => l.url) }));
                const main = list.find(l => l.isMain)?.url;
                setMainPhoto(main);
              }}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" className="px-4 py-2 rounded bg-slate-100 text-slate-700 hover:bg-slate-200" onClick={onClose}>Annuler</button>
            <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Enregistrer</button>
          </div>
        </form>
  {/** Confirmation de suppression conservée ailleurs; pas de confirmation pour l'enregistrement. */}
      </div>
    </div>
  ) : null;
}
