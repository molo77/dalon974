"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";

const ImageLightbox = dynamic(() => import("./ImageLightbox"), { ssr: false });

export default function ExpandableImage({
  src,
  images,
  initialIndex = 0,
  className,
  alt,
}: {
  src: string;
  images?: string[];
  initialIndex?: number;
  className?: string;
  alt?: string;
}) {
  const [open, setOpen] = useState(false);

  const openLightbox = () => {
    if (images && images.length > 0) setOpen(true);
    else if (src) setOpen(true);
  };

  const imgs = images && images.length ? images : (src ? [src] : []);

  return (
    <div className={`relative inline-block group`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={className}
        style={{ cursor: imgs.length ? 'zoom-in' : 'default' }}
        onClick={openLightbox}
      />

      {/* visual loupe overlay on hover */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors" aria-hidden="true">
        <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="6" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      {open && (
        <ImageLightbox images={imgs} initialIndex={initialIndex} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}
