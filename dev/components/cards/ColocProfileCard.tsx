import { useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";

const ImageLightbox = dynamic(() => import("@/components/modals/ImageLightbox"), { ssr: false });

type ColocProfileCardProps = {
  id: string;
  nom: string;
  ville: string;
  age?: number;
  description?: string;
  createdAt?: any;
  userEmail?: string;
  imageUrl?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => void;
  // Optionnel: afficher un badge de sous-communes détectées
  subCommunesLabel?: string;
  // Zones recherchées (affichage)
  zonesLabel?: string;
};

export default function ColocProfileCard({
  id: _id,
  nom,
  ville,
  age,
  description,
  createdAt,
  userEmail: _userEmail,
  imageUrl,
  onClick,
  subCommunesLabel,
  zonesLabel,
}: ColocProfileCardProps) {
  const defaultColocImg = "/images/coloc-holder.svg";
  const thumbUrl = imageUrl || defaultColocImg;
  const [openImg, setOpenImg] = useState(false);
  const formatDate = (v: any): string | null => {
    if (!v) return null;
    let d: Date | null = null;
    if (typeof v === 'number') d = new Date(v);
    else if (typeof v === 'string') {
      const t = Date.parse(v);
      d = isNaN(t) ? null : new Date(t);
    } else if (v && typeof v === 'object' && v.toDate) {
      d = v.toDate();
    }
    if (!d) return null;
    return d.toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
  };
  const dateLabel = formatDate(createdAt);
  return (
    <div
      className="block w-full cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick && onClick(e);
        }
      }}
    >
      <div className="relative border rounded-xl shadow p-4 w-full bg-white hover:bg-gray-50 transition">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-28 h-28 rounded-lg overflow-hidden bg-gray-100 relative">
            <Image
              src={thumbUrl}
              alt={nom || "colocataire"}
              fill
              className="object-cover"
              sizes="112px"
              onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); setOpenImg(true); }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold truncate">{nom}</h2>
            <p className="text-sm text-gray-600">📍 {ville}</p>
            {zonesLabel && (
              <div className="mt-1">
                <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
                  Secteurs: {zonesLabel}
                </span>
              </div>
            )}
            {subCommunesLabel && (
              <div className="mt-1">
                <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-slate-50 text-slate-600 border border-slate-200">
                  Sous-communes: {subCommunesLabel}
                </span>
              </div>
            )}
            {age && (
              <p className="text-sm text-gray-700 mt-1">
                <span className="font-semibold">Âge :</span> {age} ans
              </p>
            )}
            {dateLabel && (
              <p className="text-xs text-gray-500 mt-1">📅 {dateLabel}</p>
            )}
            {description && (
              <div className="text-sm text-gray-700 mt-2">
                <span className="font-semibold">Description :</span>{" "}
                {(() => {
                  const lines = description.split("\n");
                  const firstLines = lines.slice(0, 2);
                  const rest = lines.slice(2);
                  return (
                    <>
                      {firstLines.map((line, idx) => (
                        <span key={idx} className="block truncate">
                          {line}
                        </span>
                      ))}
                      {rest.length > 0 && (
                        <span className="text-gray-400 ml-1">...</span>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
        {openImg && (
          <ImageLightbox images={[thumbUrl]} initialIndex={0} onClose={() => setOpenImg(false)} />
        )}
      </div>
    </div>
  );
}
