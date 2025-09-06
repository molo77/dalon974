"use client";
import { useEffect, useState } from "react";

type AdUnit = {
  id: string;
  name: string;
  placementKey: string;
  slot: string;
  format?: string | null;
  fullWidthResponsive: boolean;
  height?: number | null;
  isActive: boolean;
  createdAt?: any;
};

export default function AdminAds() {
  const [items, setItems] = useState<AdUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<AdUnit>>({ fullWidthResponsive: true, isActive: true });

  // Placements connus (lisibles)
  const KNOWN_PLACEMENTS: { key: string; label: string }[] = [
    { key: "home.initial.belowHero", label: "Accueil — sous l’image (bandeau)" },
    { key: "listing.inline.1", label: "Listing — bloc inline (toutes les 16 cartes)" },
    { key: "home.list.rightSidebar", label: "Listing — colonne droite (sidebar)" },
  ];
  const labelForPlacement = (key?: string) => KNOWN_PLACEMENTS.find(p => p.key === key)?.label || key || "";

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ads", { cache: "no-store" });
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ fullWidthResponsive: true, isActive: true });
        await load();
      }
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: string, data: Partial<AdUnit>) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/ads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) await load();
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer cette unité ?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/ads/${id}`, { method: "DELETE" });
      if (res.ok) await load();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Gestion des publicités (AdSense)</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl border">
        <input className="border px-3 py-2 rounded" placeholder="Nom" value={form.name || ""} onChange={e=>setForm(f=>({...f, name:e.target.value}))} />
        <div>
          <label className="block text-sm font-medium mb-1">Emplacement</label>
          <select
            className="border px-3 py-2 rounded w-full"
            value={KNOWN_PLACEMENTS.some(p=>p.key===form.placementKey) ? form.placementKey : ""}
            onChange={(e)=>{
              const v = e.target.value;
              setForm(f=>({...f, placementKey: v || undefined }));
            }}
          >
            <option value="">— Choisir un emplacement —</option>
            {KNOWN_PLACEMENTS.map(p=> (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
          {/* Astuce: si vous avez un emplacement personnalisé, entrez la clé ci-dessous */}
          <input
            className="mt-2 border px-3 py-2 rounded w-full"
            placeholder="Ou entrez une clé personnalisée (ex: page.x.y)"
            value={form.placementKey && !KNOWN_PLACEMENTS.some(p=>p.key===form.placementKey) ? form.placementKey : ""}
            onChange={e=>setForm(f=>({...f, placementKey: e.target.value || undefined}))}
          />
        </div>
        <input className="border px-3 py-2 rounded" placeholder="Slot (data-ad-slot)" value={form.slot || ""} onChange={e=>setForm(f=>({...f, slot:e.target.value}))} />
        <input className="border px-3 py-2 rounded" placeholder="Format (ex: auto)" value={form.format || ""} onChange={e=>setForm(f=>({...f, format:e.target.value}))} />
        <input className="border px-3 py-2 rounded" placeholder="Hauteur (px)" type="number" value={form.height ?? ""} onChange={e=>setForm(f=>({...f, height: e.target.value ? Number(e.target.value) : undefined}))} />
        <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!form.fullWidthResponsive} onChange={e=>setForm(f=>({...f, fullWidthResponsive:e.target.checked}))} />Full width responsive</label>
        <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!form.isActive} onChange={e=>setForm(f=>({...f, isActive:e.target.checked}))} />Actif</label>
        <button onClick={create} disabled={loading} className="bg-blue-600 text-white px-3 py-2 rounded">Créer</button>
      </div>

      {loading && <p>Chargement…</p>}
      {!loading && items.length === 0 && <p className="text-slate-500">Aucune unité.</p>}

      {items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left">Nom</th>
                <th className="px-3 py-2 text-left">Placement</th>
                <th className="px-3 py-2 text-left">Slot</th>
                <th className="px-3 py-2 text-left">Format</th>
                <th className="px-3 py-2 text-left">Actif</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((ad) => (
                <tr key={ad.id} className="border-t">
                  <td className="px-3 py-2">{ad.name}</td>
                  <td className="px-3 py-2">
                    <div className="leading-tight">
                      <div>{labelForPlacement(ad.placementKey)}</div>
                      {KNOWN_PLACEMENTS.every(p=>p.key!==ad.placementKey) && (
                        <div className="text-[11px] text-slate-500">{ad.placementKey}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">{ad.slot}</td>
                  <td className="px-3 py-2">{ad.format || "auto"}</td>
                  <td className="px-3 py-2">{ad.isActive ? "Oui" : "Non"}</td>
                  <td className="px-3 py-2 flex gap-2">
                    <button className="px-2 py-1 rounded border" onClick={()=>update(ad.id, { isActive: !ad.isActive })}>{ad.isActive ? "Désactiver" : "Activer"}</button>
                    <button className="px-2 py-1 rounded border" onClick={()=>remove(ad.id)}>Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
