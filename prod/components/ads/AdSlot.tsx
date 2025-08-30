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

export default function AdSlot({ placementKey, className }: { placementKey: string; className?: string }) {
  const [units, setUnits] = useState<AdUnit[]>([]);

  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        const res = await fetch(`/api/ads?placementKey=${encodeURIComponent(placementKey)}`, { cache: "no-store" });
        if (!stop && res.ok) setUnits(await res.json());
      } catch {}
    })();
    return () => { stop = true; };
  }, [placementKey]);

  if (!units.length) return null;
  // Pour l’instant: afficher la première unité active
  const ad = units[0];
  return (
    <div className={className} style={ad.height ? { minHeight: ad.height } : undefined}>
      <AdsenseBanner slot={ad.slot} format={ad.format || undefined} fullWidthResponsive={ad.fullWidthResponsive} />
    </div>
  );
}
