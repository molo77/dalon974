"use client";

import React, { Fragment, useEffect, useState, type KeyboardEvent } from "react";
import { Dialog, Transition } from "@headlessui/react";

export default function ImageLightbox({
  images,
  initialIndex = 0,
  onClose,
}: {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [loaded, setLoaded] = useState(false);

  // ensure index follows initialIndex but stays within bounds when images change
  useEffect(() => {
    if (!images || images.length === 0) return;
    const clamped = Math.max(0, Math.min(initialIndex ?? 0, images.length - 1));
    setIndex(clamped);
    setLoaded(false);
  }, [initialIndex, images]);

  useEffect(() => {
    function onKey(e: KeyboardEvent | KeyboardEventInit) {
      // @ts-ignore
      const key = e.key || (e as any).code;
      if (key === "Escape") onClose();
      if (key === "ArrowLeft") prev();
      if (key === "ArrowRight") next();
    }
    const handler = (e: KeyboardEvent) => onKey(e);
    window.addEventListener("keydown", handler as any);
    return () => window.removeEventListener("keydown", handler as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, images]);

  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setIndex((i) => (i + 1) % images.length);

  if (!images || images.length === 0) return null;

  return (
    <Transition appear show as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50" onClose={onClose}>
        <div className="min-h-screen text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            {/* Dialog.Overlay n'est pas présent dans les types importés ici; utiliser une div comme overlay */}
            {/* give overlay a lower z-index so the panel (rendered after) can appear above it */}
            <div aria-hidden className="fixed inset-0 bg-black/80 z-40" />
          </Transition.Child>

          {/* center the panel */}
          <span className="inline-block h-screen align-middle" aria-hidden="true">
            &#8203;
          </span>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="inline-block w-full max-w-[90vw] max-h-[90vh] p-4 align-middle relative z-50 pointer-events-auto">
              <button className="absolute top-4 right-4 text-white text-2xl z-60 pointer-events-auto" onClick={onClose} aria-label="Fermer">✖</button>
              <button className="absolute left-4 text-white text-3xl p-2 z-60 pointer-events-auto" onClick={prev} aria-label="Précédent">◀</button>
              <div className="flex items-center justify-center">
                <img
                  src={images[index]}
                  alt={`img-${index + 1}`}
                  className="max-w-full max-h-[80vh] rounded shadow-lg"
                  onLoad={() => setLoaded(true)}
                />
              </div>
              <button className="absolute right-4 text-white text-3xl p-2 z-60 pointer-events-auto" style={{ right: 48 }} onClick={next} aria-label="Suivant">▶</button>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
