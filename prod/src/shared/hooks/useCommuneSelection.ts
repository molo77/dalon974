import { useEffect, useMemo, useState } from "react";

export type SubCommune = { name: string; cp: string; parent: string };

export default function useCommuneSelection(params: {
  modalOpen: boolean;
  editAnnonce: any | null;
  CP_TO_COMMUNE: Record<string, string>;
  SUB_COMMUNES: SubCommune[];
  pickOfficialVilleFromInput: (raw: string) => { name: string; cp?: string } | null;
}) {
  const { modalOpen, editAnnonce, CP_TO_COMMUNE, SUB_COMMUNES, pickOfficialVilleFromInput } = params;

  const [overrideVille, setOverrideVille] = useState("");
  const [officialVillePreview, setOfficialVillePreview] = useState<{ name: string; cp?: string } | null>(null);

  const collator = useMemo(() => new Intl.Collator("fr", { sensitivity: "base" }), []);
  const COMMUNE_TO_CPS = useMemo(() => {
    const map: Record<string, string[]> = {};
    Object.entries(CP_TO_COMMUNE).forEach(([cp, name]) => {
      if (!map[name]) map[name] = [];
      map[name].push(cp);
    });
    Object.keys(map).forEach((k) => map[k].sort((a, b) => a.localeCompare(b)));
    return map;
  }, [CP_TO_COMMUNE]);

  const MAIN_COMMUNES_SORTED = useMemo(
    () =>
      Object.keys(COMMUNE_TO_CPS)
        .sort((a, b) => collator.compare(a, b))
        .map((name) => ({ name, cp: COMMUNE_TO_CPS[name][0] })),
    [COMMUNE_TO_CPS, collator]
  );

  const SUB_COMMUNES_SORTED = useMemo(
    () => [...SUB_COMMUNES].sort((a, b) => collator.compare(a.name, b.name)),
    [SUB_COMMUNES, collator]
  );

  useEffect(() => {
    if (modalOpen) {
      setOverrideVille(editAnnonce?.ville || "");
    } else {
      setOverrideVille("");
      setOfficialVillePreview(null);
    }
  }, [modalOpen, editAnnonce]);

  useEffect(() => {
    if (!modalOpen) return;
    const res = overrideVille?.trim() ? pickOfficialVilleFromInput(overrideVille) : null;
    setOfficialVillePreview(res ? { name: res.name, cp: res.cp } : null);
  }, [overrideVille, modalOpen, pickOfficialVilleFromInput]);

  return { overrideVille, setOverrideVille, officialVillePreview, MAIN_COMMUNES_SORTED, SUB_COMMUNES_SORTED };
}
