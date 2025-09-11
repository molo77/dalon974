"use client";
import { useEffect, useState } from "react";
import EzoicBanner from "./EzoicBanner";

type AdUnit = {
  id: string;
  placementKey: string;
  slot: string;
  format?: string | null;
  fullWidthResponsive: boolean;
  height?: number | null;
};

type AdBlockProps = {
  placementKey: string;
  className?: string;
  title?: string;
  variant?: "default" | "compact" | "featured";
  showBorder?: boolean;
};

export default function AdBlock({ 
  placementKey, 
  className = "", 
  title = "Publicité",
  variant = "default",
  showBorder = true
}: AdBlockProps) {
  const [units, setUnits] = useState<AdUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/ads?placementKey=${encodeURIComponent(placementKey)}`, { cache: "no-store" });
        if (!stop && res.ok) {
          const data = await res.json();
          setUnits(data);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des publicités:", error);
      } finally {
        setIsLoading(false);
      }
    })();
    return () => { stop = true; };
  }, [placementKey]);

  if (isLoading) {
    return (
      <div className={`${className} ${getVariantClasses(variant)} ${showBorder ? "border border-sky-200" : ""}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-sky-200 rounded mb-3 w-20"></div>
          <div className="h-32 bg-sky-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Si aucune unité publicitaire n'est trouvée, afficher une publicité de démonstration
  if (!units.length) {
    return (
      <div className={`${className} ${getVariantClasses(variant)} ${showBorder ? "border border-sky-200/60" : ""}`}>
        {/* En-tête avec titre et icône */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-600">{title}</span>
          </div>
          <div className="text-xs text-slate-400 bg-sky-50 px-2 py-1 rounded-full">
            Annonce
          </div>
        </div>

        {/* Contenu publicitaire de démonstration */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-sky-50 to-cyan-50 border border-sky-200/50">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Espace Publicitaire</h3>
            <p className="text-slate-600 text-sm mb-4">
              Votre annonce pourrait apparaître ici
            </p>
            <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 px-4 py-2 rounded-lg text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Contactez-nous
            </div>
          </div>
          
          {/* Overlay décoratif pour le mode featured */}
          {variant === "featured" && (
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-sky-100/20 to-cyan-100/20 rounded-full -translate-y-8 translate-x-8"></div>
          )}
        </div>

        {/* Footer avec mention discrète */}
        <div className="mt-3 text-center">
          <span className="text-xs text-slate-400">
            Publicité • {process.env.NODE_ENV === "development" ? "Mode développement" : "Espace disponible"}
          </span>
        </div>
      </div>
    );
  }

  const ad = units[0];

  return (
    <div className={`${className} ${getVariantClasses(variant)} ${showBorder ? "border border-sky-200/60" : ""}`}>
      {/* En-tête avec titre et icône */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-slate-600">{title}</span>
        </div>
        <div className="text-xs text-slate-400 bg-sky-50 px-2 py-1 rounded-full">
          Annonce
        </div>
      </div>

      {/* Contenu publicitaire */}
      <div className="relative overflow-hidden rounded-xl">
        <EzoicBanner 
          slot={ad.slot} 
          className="w-full"
        />
        
        {/* Overlay décoratif pour le mode featured */}
        {variant === "featured" && (
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-sky-100/20 to-cyan-100/20 rounded-full -translate-y-8 translate-x-8"></div>
        )}
      </div>

      {/* Footer avec mention discrète */}
      <div className="mt-3 text-center">
        <span className="text-xs text-slate-400">
          Publicité • {process.env.NODE_ENV === "development" ? "Mode développement" : "Ezoic"}
        </span>
      </div>
    </div>
  );
}

function getVariantClasses(variant: string): string {
  switch (variant) {
    case "compact":
      return "bg-gradient-to-br from-white to-sky-50 rounded-2xl p-4 shadow-sm";
    case "featured":
      return "bg-gradient-to-br from-sky-50/50 to-cyan-50/50 rounded-3xl p-6 shadow-lg border border-sky-200/30";
    default:
      return "bg-gradient-to-br from-white to-sky-50 rounded-2xl p-5 shadow-md";
  }
}
