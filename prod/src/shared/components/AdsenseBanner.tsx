"use client";

import { useEffect, useRef } from "react";

type Props = {
  slot: string;
  className?: string;
  style?: React.CSSProperties;
  format?: string; // ex: "auto"
  fullWidthResponsive?: boolean;
  // Force le mode test (utile pour localhost). Par défaut: actif en non-production.
  testMode?: boolean;
};

/**
 * Bandeau Google AdSense.
 * ⚠️ DÉPRÉCIÉ : Utilisez EzoicBanner à la place pour de meilleurs revenus.
 * Nécessite NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXX dans l'environnement.
 * @deprecated Utilisez EzoicBanner pour maximiser vos revenus publicitaires
 */
export default function AdsenseBanner({
  slot,
  className,
  style,
  format = "auto",
  fullWidthResponsive = true,
  testMode,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const isProd = process.env.NODE_ENV === "production";
  const isTest = typeof testMode === "boolean" ? testMode : !isProd;

  useEffect(() => {
    if (!client || !slot) return; // pas configuré
    try {
      // @ts-expect-error: adsbygoogle n'est pas typé
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, [client, slot]);

  // Si client manquant ou sans préfixe attendu, ne pas rendre l'INS (évite erreurs)
  const clientLooksValid = !!client && /^ca-pub-/.test(client);
  if (!clientLooksValid || !slot) {
    // Fallback discret en dev pour visualiser l'emplacement
    if (!isProd) {
      return (
        <div className={className} style={{ minHeight: 90, ...(style || {}), display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed #cbd5e1", borderRadius: 6, background: "#f8fafc" }}>
          <span className="text-xs text-slate-500">AdSense non configuré (client attendu &quot;ca-pub-…&quot;)</span>
        </div>
      );
    }
    return null;
  }

  return (
    <div ref={ref} className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", ...(style || {}) }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
        {...(isTest ? { "data-adtest": "on" } : {})}
      />
      {/* Fallback visuel en dev pour confirmer l'emplacement */}
      {!isProd && (
        <div style={{ position: "relative", marginTop: -2 }} aria-hidden>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", border: "1px dashed transparent" }} />
        </div>
      )}
    </div>
  );
}
