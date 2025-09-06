import { useMemo } from "react";

export type CommuneAlt = { name: string; cp: string };
export type CommuneEntry = { name: string; cps: string[]; alts?: CommuneAlt[] };

const COMMUNES_CP: CommuneEntry[] = [
  { name: "Saint-Denis", cps: ["97400", "97490", "97417"], alts: [
    { name: "Sainte-Clotilde", cp: "97490" },
    { name: "La Montagne", cp: "97417" },
  ]},
  { name: "Sainte-Marie", cps: ["97438"] },
  { name: "Sainte-Suzanne", cps: ["97441"] },
  { name: "Saint-André", cps: ["97440"] },
  { name: "Bras-Panon", cps: ["97412"] },
  { name: "Salazie", cps: ["97433"] },
  { name: "Saint-Benoît", cps: ["97470"] },
  { name: "La Plaine-des-Palmistes", cps: ["97431"] },
  { name: "Sainte-Rose", cps: ["97439"] },
  { name: "Saint-Philippe", cps: ["97442"] },
  { name: "Le Port", cps: ["97420"] },
  { name: "La Possession", cps: ["97419"], alts: [
    { name: "Dos d'Âne", cp: "97419" },
  ]},
  { name: "Saint-Paul", cps: ["97460", "97411", "97422", "97423", "97434", "97435"], alts: [
    { name: "Saint-Gilles-les-Bains", cp: "97434" },
    { name: "L'Hermitage-les-Bains", cp: "97434" },
    { name: "Saint-Gilles-les-Hauts", cp: "97435" },
    { name: "La Saline", cp: "97422" },
    { name: "La Saline-les-Hauts", cp: "97423" },
    { name: "Bois-de-Nèfles Saint-Paul", cp: "97411" },
    { name: "Plateau-Caillou", cp: "97460" },
  ]},
  { name: "Trois-Bassins", cps: ["97426"] },
  { name: "Saint-Leu", cps: ["97436", "97416", "97424"], alts: [
    { name: "La Chaloupe", cp: "97416" },
    { name: "Piton Saint-Leu", cp: "97424" },
  ]},
  { name: "Les Avirons", cps: ["97425"] },
  { name: "L'Étang-Salé", cps: ["97427"], alts: [
    { name: "L'Étang-Salé-les-Bains", cp: "97427" },
  ]},
  { name: "Saint-Louis", cps: ["97450", "97421"], alts: [
    { name: "La Rivière", cp: "97421" },
  ]},
  { name: "Cilaos", cps: ["97413"] },
  { name: "Le Tampon", cps: ["97430", "97418"], alts: [
    { name: "La Plaine des Cafres", cp: "97418" },
  ]},
  { name: "Entre-Deux", cps: ["97414"] },
  { name: "Saint-Pierre", cps: ["97410", "97432"], alts: [
    { name: "Terre-Sainte", cp: "97432" },
  ]},
  { name: "Petite-Île", cps: ["97429"] },
  { name: "Saint-Joseph", cps: ["97480"] },
];

const slugify = (s: string) =>
  (s || "")
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function useCommuneCp(setters: {
  setVille: (s: string) => void;
  setCodePostal: (s: string) => void;
}) {
  const { setVille, setCodePostal } = setters;

  const COMMUNES_CP_SORTED = useMemo(() => {
    const collator = new Intl.Collator("fr", { sensitivity: "base" });
    const byName = [...COMMUNES_CP].map(c => ({
      ...c,
      cps: [...new Set(c.cps)].sort((a, b) => a.localeCompare(b)),
      alts: (c.alts ? [...c.alts] : []).sort((a, b) => collator.compare(a.name, b.name)),
    }));
    byName.sort((a, b) => collator.compare(a.name, b.name));
    return byName;
  }, []);

  const findByCp = (cp: string) =>
    COMMUNES_CP.find(c => c.cps.includes(cp) || c.alts?.some(a => a.cp === cp))?.name || "";

  const findByName = (name: string) => {
    const norm = slugify(name);
    const byMain = COMMUNES_CP.find(c => slugify(c.name) === norm);
    if (byMain) return byMain.cps[0] || "";
    for (const c of COMMUNES_CP) {
      const hit = (c.alts || []).find(a => slugify(a.name) === norm);
      if (hit) return hit.cp;
    }
    return "";
  };

  const onVilleChange = (val: string) => {
    if (/^\d{5}$/.test(val)) {
      const name = findByCp(val);
      if (name) {
        setVille(name);
        setCodePostal(val);
      } else {
        setVille(val);
        setCodePostal("");
      }
    } else {
      setVille(val);
      const cp = findByName(val);
      setCodePostal(cp);
    }
  };

  const onCpChange = (val: string) => {
    setCodePostal(val);
    if (/^\d{5}$/.test(val)) {
      const name = findByCp(val);
      if (name) setVille(name);
    }
  };

  return { COMMUNES_CP_SORTED, onVilleChange, onCpChange };
}
