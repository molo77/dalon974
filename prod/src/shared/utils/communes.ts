// Listes partagées des communes de La Réunion et sous-communes utiles
// à la génération d'exemples et à la normalisation des localisations.

export const COMMUNES = [
  "Saint-Denis","Sainte-Marie","Sainte-Suzanne",
  "Saint-André","Bras-Panon","Salazie",
  "Saint-Benoît","La Plaine-des-Palmistes","Sainte-Rose","Saint-Philippe",
  "Le Port","La Possession","Saint-Paul","Trois-Bassins","Saint-Leu","Les Avirons","L'Étang-Salé",
  "Saint-Louis","Cilaos","Le Tampon","Entre-Deux","Saint-Pierre","Petite-Île","Saint-Joseph"
];

export type SubCommune = { name: string; cp: string; parent: string };

export const SUB_COMMUNES: SubCommune[] = [
  { name: "Sainte-Clotilde", cp: "97490", parent: "Saint-Denis" },
  { name: "La Montagne", cp: "97417", parent: "Saint-Denis" },

  { name: "Saint-Gilles-les-Bains", cp: "97434", parent: "Saint-Paul" },
  { name: "L'Hermitage-les-Bains", cp: "97434", parent: "Saint-Paul" },
  { name: "Saint-Gilles-les-Hauts", cp: "97435", parent: "Saint-Paul" },
  { name: "La Saline", cp: "97422", parent: "Saint-Paul" },
  { name: "La Saline-les-Hauts", cp: "97423", parent: "Saint-Paul" },
  { name: "Bois-de-Nèfles Saint-Paul", cp: "97411", parent: "Saint-Paul" },
  { name: "Plateau-Caillou", cp: "97460", parent: "Saint-Paul" },

  { name: "La Chaloupe", cp: "97416", parent: "Saint-Leu" },
  { name: "Piton Saint-Leu", cp: "97424", parent: "Saint-Leu" },

  { name: "L'Étang-Salé-les-Bains", cp: "97427", parent: "L'Étang-Salé" },

  { name: "La Rivière", cp: "97421", parent: "Saint-Louis" },

  { name: "La Plaine des Cafres", cp: "97418", parent: "Le Tampon" },

  { name: "Terre-Sainte", cp: "97432", parent: "Saint-Pierre" },

  { name: "Dos d'Âne", cp: "97419", parent: "La Possession" },
];

export const slugify = (s: string) =>
  (s || "")
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const SLUG_TO_NAME = COMMUNES.reduce<Record<string, string>>((acc, name) => {
  acc[slugify(name)] = name;
  return acc;
}, {});

export function computeZonesFromSlugs(slugs: string[]): string[] {
  // Groupes simples Nord/Est/Ouest/Sud/Intérieur
  const GROUPES: Record<string, string[]> = {
    "Nord": ["Saint-Denis","Sainte-Marie","Sainte-Suzanne"],
    "Est": ["Saint-André","Bras-Panon","Salazie","Saint-Benoît","La Plaine-des-Palmistes","Sainte-Rose","Saint-Philippe"],
    "Ouest": ["Le Port","La Possession","Saint-Paul","Trois-Bassins","Saint-Leu","Les Avirons","L'Étang-Salé"],
    "Sud": ["Saint-Louis","Saint-Pierre","Le Tampon","Entre-Deux","Petite-Île","Saint-Joseph","Cilaos"],
    "Intérieur": ["Cilaos","Salazie","La Plaine-des-Palmistes"],
  };
  const names = slugs.map((s) => SLUG_TO_NAME[s]).filter(Boolean);
  const zones: string[] = [];
  Object.entries(GROUPES).forEach(([zone, list]) => {
    if (names.some((n) => list.includes(n))) zones.push(zone);
  });
  return zones;
}

export function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
