"use client";

import { useEffect, useRef } from "react";

type Props = {
  slot: string;
  className?: string;
  style?: React.CSSProperties;
  format?: string; // ex: "auto"
  fullWidthResponsive?: boolean;
};

/**
 * Bandeau Google AdSense.
 * Nécessite NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXX dans l’environnement.
 */
export default function AdsenseBanner({
  slot,
  className,
  style,
  format = "auto",
  fullWidthResponsive = true,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  useEffect(() => {
    if (!client || !slot) return; // pas configuré
    try {
      // @ts-expect-error: adsbygoogle n'est pas typé
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, [client, slot]);

  if (!client || !slot) {
    return null; // Ne rien afficher si non configuré
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
      />
    </div>
  );
}
