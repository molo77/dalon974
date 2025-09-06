"use client";

import EzoicBanner from "./EzoicBanner";

type EzoicUnit = {
  slot: string;
  name: string;
  description: string;
  size?: string;
};

// Configuration des zones Ezoic
const EZOIC_UNITS: Record<string, EzoicUnit> = {
  "home.initial.belowHero": {
    slot: "ezoic-pub-ad-placeholder-101",
    name: "Home - Below Hero",
    description: "Zone publicitaire sous l'image hero de la page d'accueil",
    size: "728x90"
  },
  "home.hero": {
    slot: "ezoic-pub-ad-placeholder-102", 
    name: "Home - Hero Section",
    description: "Zone publicitaire dans la section hero",
    size: "300x250"
  },
  "listing.inline.1": {
    slot: "ezoic-pub-ad-placeholder-103",
    name: "Listing - Inline 1",
    description: "Zone publicitaire entre les annonces (toutes les 8 annonces)",
    size: "300x250"
  },
  "home.list.rightSidebar": {
    slot: "ezoic-pub-ad-placeholder-104",
    name: "Home - Right Sidebar",
    description: "Zone publicitaire dans la barre latérale droite",
    size: "300x600"
  },
  "home.footer": {
    slot: "ezoic-pub-ad-placeholder-105",
    name: "Home - Footer",
    description: "Zone publicitaire dans le pied de page",
    size: "728x90"
  },
  "idees-pratiques.hero": {
    slot: "ezoic-pub-ad-placeholder-106",
    name: "Idées Pratiques - Hero",
    description: "Zone publicitaire dans la page des idées pratiques",
    size: "728x90"
  },
  "idees-pratiques.content": {
    slot: "ezoic-pub-ad-placeholder-107",
    name: "Idées Pratiques - Content",
    description: "Zone publicitaire dans le contenu des idées pratiques",
    size: "300x250"
  }
};

export default function EzoicSlot({ 
  placementKey, 
  className 
}: { 
  placementKey: string; 
  className?: string; 
}) {
  const unit = EZOIC_UNITS[placementKey];
  
  if (!unit) {
    console.warn(`Zone Ezoic inconnue: ${placementKey}`);
    return null;
  }

  return (
    <EzoicBanner
      slot={unit.slot}
      className={className}
    />
  );
}

export { EZOIC_UNITS };

