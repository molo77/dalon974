"use client";

import { useCallback } from "react";
import dynamic from "next/dynamic";

const MapReunionLeaflet = dynamic(() => import("@/components/map/MapReunionLeaflet"), { ssr: false });

type Props = {
  value: string[]; // slugs des communes sélectionnées (contrôlé)
  onChange: (communesSlugs: string[], zones?: string[]) => void;
  computeZonesFromSlugs?: (slugs: string[]) => string[]; // optionnel
  label?: string;
  height?: number;
  className?: string;
  alwaysMultiSelect?: boolean;
  hideSelectionSummary?: boolean;
};

// Compare deux listes (ordre ignoré)
function sameIds(a: string[], b: string[]) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  for (let i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) return false;
  return true;
}

export default function CommuneZoneSelector({
  value,
  onChange,
  computeZonesFromSlugs,
  label,
  height = 420,
  className,
  alwaysMultiSelect = true,
  hideSelectionSummary = false,
}: Props) {
  const handleSelection = useCallback(
    (ids: string[]) => {
      const slugs = Array.isArray(ids) ? ids.filter(Boolean) : [];
      if (sameIds(slugs, value)) return;
      const zones = computeZonesFromSlugs ? computeZonesFromSlugs(slugs) : undefined;
      onChange(slugs, zones);
    },
    [value, onChange, computeZonesFromSlugs]
  );

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium mb-2">{label}</label>}
      <MapReunionLeaflet
        defaultSelected={value}
  selected={value}
        onSelectionChange={handleSelection}
        height={height}
        className="w-full"
  alwaysMultiSelect={alwaysMultiSelect}
  hideSelectionSummary={hideSelectionSummary}
      />
    </div>
  );
}
