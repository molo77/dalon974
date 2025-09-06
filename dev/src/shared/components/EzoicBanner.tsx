"use client";

import { useEffect, useRef } from "react";

type Props = {
  slot: string;
  className?: string;
  style?: React.CSSProperties;
  testMode?: boolean;
};

/**
 * Bandeau Ezoic.
 * Nécessite NEXT_PUBLIC_EZOIC_SITE_ID dans l'environnement.
 */
export default function EzoicBanner({
  slot,
  className,
  style,
  testMode,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const siteId = process.env.NEXT_PUBLIC_EZOIC_SITE_ID;
  const isProd = process.env.NODE_ENV === "production";
  const isTest = typeof testMode === "boolean" ? testMode : !isProd;

  useEffect(() => {
    if (!siteId || !slot) return; // pas configuré
    
    try {
      // Charger le script Ezoic si pas déjà chargé
      if (!window.ezstandalone) {
        const script = document.createElement('script');
        script.src = `https://go.ezodn.com/static/ez.js`;
        script.async = true;
        script.setAttribute('data-ez-site-id', siteId);
        document.head.appendChild(script);
      }

      // Initialiser la zone publicitaire
      if (window.ezstandalone) {
        window.ezstandalone.define(slot, ref.current);
      }
    } catch (error) {
      console.warn('Erreur lors du chargement d\'Ezoic:', error);
    }
  }, [siteId, slot]);

  // Si siteId manquant, ne pas rendre la div (évite erreurs)
  const siteIdLooksValid = !!siteId && /^[0-9]+$/.test(siteId);
  if (!siteIdLooksValid || !slot) {
    // Fallback discret en dev pour visualiser l'emplacement
    if (!isProd) {
      return (
        <div 
          className={className} 
          style={{ 
            minHeight: 90, 
            ...(style || {}), 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            border: "1px dashed #cbd5e1", 
            borderRadius: 6, 
            background: "#f8fafc" 
          }}
        >
          <span className="text-xs text-slate-500">
            Ezoic non configuré (site ID attendu)
          </span>
        </div>
      );
    }
    return null;
  }

  return (
    <div ref={ref} className={className} style={style}>
      {/* Zone Ezoic sera injectée ici */}
      {!isProd && (
        <div style={{ position: "relative", marginTop: -2 }} aria-hidden>
          <div style={{ 
            position: "absolute", 
            inset: 0, 
            pointerEvents: "none", 
            border: "1px dashed transparent" 
          }} />
        </div>
      )}
    </div>
  );
}

// Déclaration des types globaux pour Ezoic
declare global {
  interface Window {
    ezstandalone?: {
      define: (slot: string, element: HTMLElement | null) => void;
    };
  }
}

