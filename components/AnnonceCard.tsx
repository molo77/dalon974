import Link from "next/link";
import { useState } from "react";

type AnnonceProps = {
  id: string;
  titre: string;
  ville: string;
  prix?: number;
  surface?: number;
  description?: string;
  userEmail?: string;
  onDelete?: () => void;
  onEdit?: () => void;
};

export default function AnnonceCard({
  id,
  titre,
  ville,
  prix,
  surface,
  description,
  userEmail,
  onDelete,
  onEdit,
}: AnnonceProps) {
  // Détermine l'origine pour le retour (accueil ou dashboard)
  const handleClick = () => {
    if (typeof window !== "undefined") {
      // Détecte la page d'origine
      const origin =
        window.location.pathname.startsWith("/dashboard")
          ? "dashboard"
          : "home";
      document.cookie = `annonceOrigin=${origin};path=/`;
    }
  };

  const [showMessageModal, setShowMessageModal] = useState(false);

  return (
    <Link
      href={`/annonce/${id}`}
      className="block w-full"
      onClick={handleClick}
    >
      <div className="relative border rounded-xl shadow p-4 w-full bg-white hover:bg-gray-50 transition">
        <h2 className="text-lg font-bold">{titre}</h2>
        <p className="text-sm text-gray-600">📍 {ville}</p>
        <p className="text-blue-600 font-semibold">
          {prix ? `${prix} € / mois` : "Prix non renseigné"}
        </p>
        {surface && (
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Surface :</span> {surface} m²
          </p>
        )}
        {description && (
          <div className="text-sm text-gray-700 mt-2">
            {(() => {
              const lines = description.split("\n");
              const firstLines = lines.slice(0, 2);
              const rest = lines.slice(2);
              return (
                <>
                  <span className="font-semibold">Description :</span>{" "}
                  {firstLines.map((line, idx) => (
                    <span key={idx} className="block">
                      {line}
                    </span>
                  ))}
                  {rest.length > 0 && (
                    <>
                      <span
                        className="block bg-gradient-to-r from-gray-700/80 to-transparent text-transparent bg-clip-text select-none"
                        style={{
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        {rest.join("\n")}
                      </span>
                      <span className="text-gray-400 ml-1">...</span>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onDelete();
            }}
            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
            title="Supprimer l'annonce"
          >
            🗑️
          </button>
        )}
        {onEdit && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onEdit();
            }}
            className="absolute top-2 right-10 text-gray-500 hover:text-black"
            title="Modifier l'annonce"
          >
            ✏️
          </button>
        )}
      </div>
    </Link>
  );
}


