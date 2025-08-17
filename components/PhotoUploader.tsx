"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
// thumbnails should not open the global lightbox here

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
    initial.map((u, i) => ({ id: `i-${i}`, previewUrl: u, uploadedUrl: u, isMain: initialMain ? (u === initialMain) : (i === 0), progress: 100 }))
  );
  // no local lightbox for thumbnails (site-wide ImageLightbox is used for large images)

  // store xhrs to allow abort on delete
  const xhrs = useRef<Record<string, XMLHttpRequest | null>>({});
  // remember last applied `initial` payload to avoid repeated setItems when parent
  // recreates an array instance with same values (prevents feedback loops)
  const lastInitRef = useRef<string | null>(null);

  // Keep items in sync when `initial` prop changes (e.g. editing an annonce)
  useEffect(() => {
    // build items from initial URLs using stable ids (based on url)
    const initUrls = (initial || []).map((u) => String(u).trim()).filter(Boolean);
    const init = initUrls.map(
      (u, i) => ({ id: `i-${encodeURIComponent(u)}`, previewUrl: u, uploadedUrl: u, isMain: initialMain ? (u === initialMain) : (i === 0), progress: 100 } as PhotoItem)
    );

    // short-circuit if incoming `initial` (by value) matches last applied one
    const initKey = JSON.stringify(initUrls);
    if (lastInitRef.current === initKey) return;

    // compare current uploaded URLs to incoming initial URLs to avoid unnecessary updates
    const currentUrls = items.filter((it) => it.uploadedUrl).map((it) => String(it.uploadedUrl));
    const same = currentUrls.length === initUrls.length && currentUrls.every((v, idx) => v === initUrls[idx]);
    if (!same) {
      setItems(init);
      lastInitRef.current = initKey;
    } else {
      // remember that we've seen this initial payload so we don't reapply it repeatedly
      lastInitRef.current = initKey;
    }
    // only re-run when the value of `initial` or `initialMain` changes
  }, [JSON.stringify(initial || []), initialMain]);

  // optional site-wide lightbox for thumbnails
  const ImageLightbox = dynamic(() => import("./ImageLightbox"), { ssr: false });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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

  // upload each file immediately
  arr.forEach((it) => uploadFile(it));
  }

  function uploadFile(item: PhotoItem) {
    if (!item.file) return;
    setItems((s) => s.map((x) => (x.id === item.id ? { ...x, uploading: true, progress: 0 } : x)));

    const fd = new FormData();
    fd.append("files", item.file as File);

    const xhr = new XMLHttpRequest();
    xhrs.current[item.id] = xhr;

    xhr.open("POST", "/api/uploads");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        setItems((s) => s.map((x) => (x.id === item.id ? { ...x, progress: pct } : x)));
      }
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (data?.files && data.files.length > 0) {
          const uploaded = data.files[0];
          setItems((s) => s.map((x) => (x.id === item.id ? { ...x, uploadedUrl: uploaded, previewUrl: uploaded, uploading: false, progress: 100 } : x)));
          // persist metadata if resource provided
          if (resourceType && resourceId) {
            import("@/lib/photoService").then(async (svc) => {
              try {
                if (resourceType === "coloc") await svc.addColocImageMeta(resourceId, { url: uploaded, filename: item.file?.name });
                if (resourceType === "annonce") await svc.addAnnonceImageMeta(resourceId, { url: uploaded, filename: item.file?.name });
              } catch (e) {
                console.warn('persist image meta failed', e);
              }
            });
          }
        } else {
          setItems((s) => s.map((x) => (x.id === item.id ? { ...x, uploading: false } : x)));
        }
      } catch (err) {
        console.error("upload parse error", err);
        setItems((s) => s.map((x) => (x.id === item.id ? { ...x, uploading: false } : x)));
      }
      xhrs.current[item.id] = null;
    };
    xhr.onerror = () => {
      console.error("upload xhr error");
      setItems((s) => s.map((x) => (x.id === item.id ? { ...x, uploading: false } : x)));
      xhrs.current[item.id] = null;
    };
    xhr.send(fd);
  }

  async function removeItem(id: string) {
    const it = items.find((x) => x.id === id);
    if (!it) return;

    // abort upload if in progress
    const currentXhr = xhrs.current[id];
    if (currentXhr) {
      try { currentXhr.abort(); } catch (e) { /* ignore */ }
      xhrs.current[id] = null;
    }

    if (it.uploadedUrl) {
      try {
        await fetch(`/api/uploads?path=${encodeURIComponent(it.uploadedUrl)}`, { method: "DELETE" });
      } catch (err) {
        console.error("delete error", err);
      }
    }
    // revoke object URL if any
    if (it.file && it.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(it.previewUrl);
    }
    setItems((s) => {
      const next = s.filter((x) => x.id !== id);
      if (!next.some((x) => x.isMain) && next.length) next[0].isMain = true;
      return next;
    });
    // if resource provided, also delete meta doc by url
    try {
      const it = items.find(x => x.id === id);
      if (it && it.uploadedUrl && resourceType && resourceId) {
        const svc = await import("@/lib/photoService");
        if (resourceType === 'coloc') await svc.deleteColocPhotoWithMeta(resourceId, it.uploadedUrl);
        if (resourceType === 'annonce') await svc.deleteAnnoncePhotoWithMeta(resourceId, it.uploadedUrl);
      }
    } catch (e) {
      console.warn('delete meta failed', e);
    }
  }

  function setMain(id: string) {
    setItems((s) => {
      const next = s.map((x) => ({ ...x, isMain: x.id === id }));
      const selected = next.find((x) => x.id === id);
      // persist main selection if resource provided and selected has an uploaded URL
      if (selected && selected.uploadedUrl && resourceType && resourceId) {
        import("@/lib/photoService").then(async (svc) => {
          try {
            if (resourceType === 'coloc') {
              await svc.setColocImageMainByUrl(resourceId, selected.uploadedUrl as string);
            } else if (resourceType === 'annonce') {
              // no URL-based helper for annonce main in photoService; try to update root imageUrl similarly
              await svc.setAnnonceMainPhoto(resourceId, 0).catch(() => {});
            }
          } catch (e) { console.warn('set main failed', e); }
        });
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
        <label className="inline-block px-3 py-2 bg-slate-100 border rounded-md cursor-pointer">
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
                if (!openOnClick) return;
                // open lightbox at this index among current items
                setLightboxIndex(idx);
                setLightboxOpen(true);
              }}
              role={openOnClick ? "button" : undefined}
            >
            <div className="w-28 h-28 rounded-lg overflow-hidden bg-gray-100 border relative">
              <img
                src={it.previewUrl}
                alt="photo"
                  className="w-full h-full object-cover"
                  style={{ cursor: openOnClick ? 'pointer' : 'default' }}
                tabIndex={0}
              />
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
            <div className="mt-1 flex gap-1">
              <button
                type="button"
                className={`px-2 py-1 text-sm rounded-md ${it.isMain ? "bg-blue-600 text-white" : "bg-white border"}`}
                onClick={() => setMain(it.id)}
              >
                {it.isMain ? "Principale" : "Définir principale"}
              </button>
              <button
                type="button"
                className="px-2 py-1 text-sm rounded-md bg-rose-100 text-rose-700 border"
                onClick={() => removeItem(it.id)}
              >
                Supprimer
              </button>
            </div>

            {it.uploading && (
              <div className="absolute left-0 right-0 bottom-0 px-1 pb-1">
                <div className="h-2 bg-white/60 rounded overflow-hidden border">
                  <div className="h-full bg-blue-600" style={{ width: `${it.progress ?? 0}%` }} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {lightboxOpen && (
        <ImageLightbox
          images={items.map((it) => it.previewUrl)}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
  {/* No local lightbox rendering here: thumbnails should not open the global lightbox */}
    </div>
  );
}
