"use client";
import { useEffect, useState } from "react";
import AdsenseBanner from "./AdsenseBanner";

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

  if (!units.length) return null;

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
        <AdsenseBanner 
          slot={ad.slot} 
          format={ad.format || undefined} 
          fullWidthResponsive={ad.fullWidthResponsive}
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
          Publicité • {process.env.NODE_ENV === "development" ? "Mode développement" : "Google AdSense"}
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
