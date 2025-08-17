"use client";

import React from "react";
import PhotoUploader from "./PhotoUploader";

export default function ColocPhotoSection({
  initialCsv,
  initialMain,
  onUpdate,
}: {
  initialCsv?: string | null;
  initialMain?: string | null;
  onUpdate: (csv: string, mainUrl?: string) => void;
}) {
  const initial = initialCsv ? initialCsv.split(",").map(s => s.trim()).filter(Boolean) : [];

  return (
    <div>
      <PhotoUploader
        initial={initial}
        initialMain={initialMain || undefined}
        onChange={(list) => {
          const csv = list.map(l => l.url).join(",");
          const main = list.find(l => l.isMain)?.url;
          onUpdate(csv, main);
        }}
      />
    </div>
  );
}
