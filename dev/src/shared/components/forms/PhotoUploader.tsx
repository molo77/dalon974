"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import ConfirmModal from "../ConfirmModal";
import { 
  uploadPhoto, 
  addAnnonceImageMeta, 
  deleteAnnoncePhotoWithMeta, 
  setAnnonceMainPhoto,
  setColocImageMainByUrl,
  deleteColocPhotoWithMeta
} from "@/infrastructure/storage/photoService";

type PhotoItem = {
  id: string;
  file?: File;
  previewUrl: string; // object URL or uploaded URL
  uploadedUrl?: string; // server URL (/uploads/xxx)
  isMain: boolean;
  uploading?: boolean;
  progress?: number; // 0-100
};

export default function PhotoUploader({
  initial = [],
  onChange,
  resourceType,
  resourceId,
  initialMain,
  openOnClick = false,
}: {
  initial?: string[]; // array of already uploaded URLs
  onChange?: (photos: { url: string; isMain: boolean }[]) => void;
  resourceType?: 'annonce' | 'coloc';
  resourceId?: string; // annonceId or uid
  initialMain?: string;
  openOnClick?: boolean;
}) {
  const [items, setItems] = useState<PhotoItem[]>(() =>
    initial.map((u, i) => ({ 
      id: `i-${i}`, 
      previewUrl: u, 
      uploadedUrl: u, 
      isMain: initialMain ? (u === initialMain) : (i === 0), 
      progress: 100 
    }))
  );

  // store xhrs to allow abort on delete
  const xhrs = useRef<Record<string, XMLHttpRequest | null>>({});
  // remember last applied `initial` payload to avoid repeated setItems when parent
  // recreates an array instance with same values (prevents feedback loops)
  const lastInitRef = useRef<string | null>(null);

  // Keep items in sync when `initial` prop changes (e.g. editing an annonce)
  const initialKey = JSON.stringify(initial || []);
  useEffect(() => {
    // build items from initial URLs using stable ids (based on url)
    const initUrls = (initial || []).map((u) => String(u).trim()).filter(Boolean);
    const init = initUrls.map(
      (u, i) => ({ 
        id: `i-${encodeURIComponent(u)}`, 
        previewUrl: u, 
        uploadedUrl: u, 
        isMain: initialMain ? (u === initialMain) : (i === 0), 
        progress: 100 
      } as PhotoItem)
    );

    // short-circuit if incoming `initial` (by value) matches last applied one
    const initKey = JSON.stringify(initUrls);
    if (lastInitRef.current === initKey) return;

    // compare current uploaded URLs to incoming initial URLs to avoid unnecessary updates
    const currentUrls = items.filter((it) => it.uploadedUrl).map((it) => String(it.uploadedUrl));
    const same = currentUrls.length === initUrls.length && currentUrls.every((v: string, idx: number) => v === initUrls[idx]);
    if (!same) {
      setItems(init);
      lastInitRef.current = initKey;
    } else {
      // remember that we've seen this initial payload so we don't reapply it repeatedly
      lastInitRef.current = initKey;
    }
    // only re-run when the value of `initial` or `initialMain` changes
  }, [initialKey, initialMain, items, initial]);

  // avoid feedback loops: only call onChange when payload differs from last sent
  const lastSentRef = useRef<string | null>(null);
  useEffect(() => {
    if (!onChange) return;
    const payload = items
      .filter((it) => it.uploadedUrl)
      .map((it) => ({ url: it.uploadedUrl as string, isMain: it.isMain }));
    const serialized = JSON.stringify(payload);
    const last = lastSentRef.current;
    if (last === serialized) return;
    lastSentRef.current = serialized;
    onChange(payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files).map((file) => {
      const id = `f-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      return { id, file, previewUrl: URL.createObjectURL(file), isMain: false, progress: 0 } as PhotoItem;
    });
    setItems((s) => {
      const merged = [...s, ...arr];
      if (!merged.some((it) => it.isMain) && merged.length) merged[0].isMain = true;
      return merged;
    });

    // upload each file immediately using photoService
    arr.forEach((it) => uploadFile(it));
  }

  async function uploadFile(item: PhotoItem) {
    if (!item.file) return;
    setItems((s) => s.map((x) => (x.id === item.id ? { ...x, uploading: true, progress: 0 } : x)));

    try {
      // Use photoService for upload
      const uploadedUrl = await uploadPhoto(item.file);
      
      setItems((s) => s.map((x) => (x.id === item.id ? { 
        ...x, 
        uploadedUrl, 
        previewUrl: uploadedUrl, 
        uploading: false, 
        progress: 100 
      } : x)));

      // persist metadata if resource provided
      if (resourceType && resourceId) {
        try {
          if (resourceType === "annonce") {
            await addAnnonceImageMeta(resourceId, { 
              url: uploadedUrl, 
              filename: item.file?.name,
              isMain: item.isMain 
            });
          }
        } catch (e) {
          console.warn('persist image meta failed', e);
        }
      }
    } catch (err) {
      console.error("upload error", err);
      setItems((s) => s.map((x) => (x.id === item.id ? { ...x, uploading: false } : x)));
    }
  }

  // Gestion du modal de confirmation
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState<string|null>(null);

  async function doRemoveItem(id: string) {
    const it = items.find((x) => x.id === id);
    if (!it) return;

    // abort upload if in progress
    const currentXhr = xhrs.current[id];
    if (currentXhr) {
      try { currentXhr.abort(); } catch { /* ignore */ }
      xhrs.current[id] = null;
    }

    // revoke object URL if any
    if (it.file && it.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(it.previewUrl);
    }

    // Use photoService for deletion
    if (it.uploadedUrl && resourceType && resourceId) {
      try {
        if (resourceType === 'coloc') {
          await deleteColocPhotoWithMeta(resourceId, it.uploadedUrl);
        } else if (resourceType === 'annonce') {
          await deleteAnnoncePhotoWithMeta(resourceId, it.uploadedUrl);
        }
      } catch (e) {
        console.warn('delete meta failed', e);
      }
    }

    setItems((s) => {
      const next = s.filter((x) => x.id !== id);
      if (!next.some((x) => x.isMain) && next.length) next[0].isMain = true;
      return next;
    });
  }

  function removeItem(id: string) {
    setPendingRemoveId(id);
    setConfirmOpen(true);
  }

  async function setMain(id: string) {
    setItems((s) => {
      const next = s.map((x) => ({ ...x, isMain: x.id === id }));
      const selected = next.find((x) => x.id === id);
      
      // persist main selection if resource provided and selected has an uploaded URL
      if (selected && selected.uploadedUrl && resourceType && resourceId) {
        try {
          if (resourceType === 'coloc') {
            setColocImageMainByUrl(resourceId, selected.uploadedUrl as string);
          } else if (resourceType === 'annonce') {
            // Find the index of the selected photo and set it as main
            const index = next.findIndex(x => x.id === id);
            if (index !== -1) {
              setAnnonceMainPhoto(resourceId, index);
            }
          }
        } catch (e) { 
          console.warn('set main failed', e); 
        }
      }
      return next;
    });
  }

  // reorder support via drag/drop
  function onDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData("text/plain", id);
  }
  
  function onDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    setItems((s) => {
      const srcIdx = s.findIndex(x => x.id === id);
      const tgtIdx = s.findIndex(x => x.id === targetId);
      if (srcIdx === -1 || tgtIdx === -1) return s;
      const copy = [...s];
      const [moved] = copy.splice(srcIdx, 1);
      copy.splice(tgtIdx, 0, moved);
      return copy;
    });
  }

  return (
    <div>
      <div className="flex gap-2 items-center">
        <label className="inline-block px-3 py-2 bg-slate-100 border rounded-md cursor-pointer hover:bg-slate-200 transition-colors">
          Ajouter des photos
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </label>
      </div>

      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((it, idx) => (
          <div
            key={it.id}
            className="relative group"
            draggable
            onDragStart={(e)=>onDragStart(e,it.id)}
            onDragOver={(e)=>e.preventDefault()}
            onDrop={(e)=>onDrop(e,it.id)}
            onClick={() => {
              // lightbox functionality removed
            }}
            role={openOnClick ? "button" : undefined}
          >
            <div className="w-28 h-28 rounded-lg overflow-hidden bg-gray-100 border relative">
              <Image
                src={it.previewUrl}
                alt="photo"
                width={112}
                height={112}
                className="w-full h-full object-cover"
                style={{ cursor: openOnClick ? 'pointer' : 'default' }}
                tabIndex={0}
              />
              
              {/* Overlay icônes */}
              <div className="absolute top-1 right-1 flex flex-col gap-1 z-10">
                {/* Coche principale */}
                <button
                  type="button"
                  className={`w-6 h-6 flex items-center justify-center rounded-full border ${
                    it.isMain 
                      ? "bg-blue-600 border-blue-600" 
                      : "bg-white border-slate-300 hover:border-blue-400"
                  } shadow transition-all duration-100`}
                  onClick={e => { e.stopPropagation(); setMain(it.id); }}
                  title={it.isMain ? "Photo principale" : "Définir comme principale"}
                  style={{ marginBottom: 0 }}
                >
                  {it.isMain ? (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="white" />
                    </svg>
                  )}
                </button>
                
                {/* Poubelle */}
                <button
                  type="button"
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-rose-100 text-rose-700 border border-rose-200 hover:bg-rose-200 shadow transition-all duration-100"
                  onClick={e => { e.stopPropagation(); removeItem(it.id); }}
                  title="Supprimer la photo"
                  style={{ marginBottom: 0 }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Étoile sur la photo principale */}
              {it.isMain && (
                <div className="absolute bottom-1 left-1 bg-yellow-400 rounded-full p-0.5 shadow text-white flex items-center justify-center z-10">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.122-6.545L.488 6.91l6.561-.955L10 0l2.951 5.955 6.561.955-4.756 4.635 1.122 6.545z"/>
                  </svg>
                </div>
              )}
              
              {/* Hover/focus overlay: magnifier (visual only) */}
              <div
                className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 group-focus-within:bg-black/30 transition-colors"
                aria-hidden="true"
              >
                <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="6" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
            </div>

            {/* Barre de progression */}
            {it.uploading && (
              <div className="absolute left-0 right-0 bottom-0 px-1 pb-1">
                <div className="h-2 bg-white/60 rounded overflow-hidden border">
                  <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${it.progress ?? 0}%` }} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setPendingRemoveId(null); }}
        onConfirm={() => {
          if (pendingRemoveId) doRemoveItem(pendingRemoveId);
          setConfirmOpen(false);
          setPendingRemoveId(null);
        }}
        title="Supprimer la photo ?"
        description="Voulez-vous vraiment supprimer cette photo ? Cette action est irréversible."
      />
    </div>
  );
}