"use client";
import { Fragment, useEffect, useState } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast as appToast } from "@/components/Toast";

export default function AnnonceModal({
  isOpen,
  onClose,
  onSubmit,
  annonce,
  villeDropdown, // compat
  villeDatalist, // input + datalist
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: {
    titre: string;
    ville: string;
    prix: string;
    imageUrl: string;
    surface?: string;
    nbChambres?: string;
    equipements?: string;
    description?: string;
    photos?: string[];
  }) => void;
  annonce?: any | null;
  villeDropdown?: {
    value: string;
    onChange: (v: string) => void;
    main: { name: string; cp: string }[];
    sub: { name: string; cp: string }[];
    label?: string;
  };
  villeDatalist?: {
    value: string;
    onChange: (v: string) => void;
    main: { name: string; cp: string }[];
    sub: { name: string; cp: string }[];
    label?: string;
    datalistId?: string;
  };
}) {
  const [titre, setTitre] = useState("");
  const [ville, setVille] = useState("");
  const [prix, setPrix] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [surface, setSurface] = useState("");
  const [nbChambres, setNbChambres] = useState("");
  const [equipements, setEquipements] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (annonce) {
      setTitre(annonce.titre || "");
      setVille(annonce.ville || "");
      setPrix(annonce.prix?.toString?.() || "");
      setImageUrl(annonce.imageUrl || "");
      setSurface(annonce.surface?.toString?.() || "");
      setNbChambres(annonce.nbChambres?.toString?.() || "");
      setEquipements(Array.isArray(annonce.equipements) ? annonce.equipements.join(", ") : (annonce.equipements || ""));
      setDescription(annonce.description || "");
      setPhotos(Array.isArray(annonce.photos) ? annonce.photos : []);
    } else {
      setTitre(""); setVille(""); setPrix(""); setImageUrl("");
      setSurface(""); setNbChambres(""); setEquipements(""); setDescription("");
      setPhotos([]);
    }
  }, [annonce]);

  const uploadAnnoncePhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const storage = getStorage();
      const uploaded: string[] = [];
      await Promise.all(
        Array.from(files).map(async (file) => {
          const r = ref(storage, `annonces/${annonce?.id || "new"}/${Date.now()}-${file.name}`);
          await uploadBytes(r, file);
          const url = await getDownloadURL(r);
          uploaded.push(url);
        })
      );
      setPhotos((prev) => [...prev, ...uploaded]);
      if (!imageUrl && uploaded[0]) setImageUrl(uploaded[0]);
      appToast.success(`${uploaded.length} photo(s) ajoutée(s)`);
    } catch {
      appToast.error("Échec de l’upload des photos.");
    } finally {
      setUploading(false);
    }
  };
  const removePhoto = (url: string) => setPhotos((prev) => prev.filter((u) => u !== url));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const villeValue = villeDatalist ? villeDatalist.value : villeDropdown ? villeDropdown.value : ville;
    onSubmit({ titre, ville: villeValue, prix, imageUrl, surface, nbChambres, equipements, description, photos });
    onClose();
  };

  if (!isOpen) return null;
  const dlId = villeDatalist?.datalistId || "communes-reu-modal";

  return (
    <Fragment>
      <div
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto space-y-3">
          <h3 className="text-lg font-semibold">Modifier l’annonce</h3>

          <input className="border rounded px-3 py-2 w-full" placeholder="Titre" value={titre} onChange={e=>setTitre(e.target.value)} />

          {villeDatalist ? (
            <>
              <input
                className="border rounded px-3 py-2 w-full"
                placeholder={villeDatalist.label || "Commune"}
                value={villeDatalist.value}
                onChange={(e)=>villeDatalist.onChange(e.target.value)}
                list={dlId}
              />
              <datalist id={dlId}>
                {villeDatalist.main.map((c) => (<option key={`m-${c.name}-${c.cp}`} value={c.name}>{`${c.name} (${c.cp})`}</option>))}
                {villeDatalist.sub.map((c) => (<option key={`s-${c.name}-${c.cp}`} value={c.name}>{`${c.name} (${c.cp})`}</option>))}
              </datalist>
            </>
          ) : (
            <input className="border rounded px-3 py-2 w-full" placeholder="Commune" value={ville} onChange={e=>setVille(e.target.value)} />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className="border rounded px-3 py-2 w-full" placeholder="Prix (€)" type="number" value={prix} onChange={e=>setPrix(e.target.value)} />
            <input className="border rounded px-3 py-2 w-full" placeholder="Surface (m²)" type="number" value={surface} onChange={e=>setSurface(e.target.value)} />
            <input className="border rounded px-3 py-2 w-full" placeholder="Nb chambres" type="number" value={nbChambres} onChange={e=>setNbChambres(e.target.value)} />
            <input className="border rounded px-3 py-2 w-full" placeholder="Équipements (CSV)" value={equipements} onChange={e=>setEquipements(e.target.value)} />
          </div>

          <textarea className="border rounded px-3 py-2 w-full" rows={4} placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} />

          <div>
            <label className="block text-sm font-medium mb-1">Image principale (URL)</label>
            <input className="border rounded px-3 py-2 w-full" placeholder="https://…" value={imageUrl} onChange={e=>setImageUrl(e.target.value)} />
            <div className="mt-2 flex items-center gap-2">
              <input type="file" accept="image/*" multiple onChange={(e)=>uploadAnnoncePhotos(e.target.files)} />
              {imageUrl && <img src={imageUrl} alt="cover" className="w-16 h-12 object-cover rounded border" />}
            </div>
          </div>

          {photos.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-1">Galerie</div>
              <div className="grid grid-cols-3 gap-2">
                {photos.map((u) => (
                  <div key={u} className="relative">
                    <img src={u} alt="photo" className="w-full h-20 object-cover rounded border" />
                    <button type="button" onClick={() => removePhoto(u)} className="absolute -top-2 -right-2 bg-black/60 text-white rounded-full w-6 h-6" aria-label="Supprimer">✖</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-700">Annuler</button>
            <button type="submit" className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700" disabled={uploading}>Enregistrer</button>
          </div>
        </form>
      </div>
    </Fragment>
  );
}
  