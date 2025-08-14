'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

type CommuneFeature = GeoJSON.Feature<GeoJSON.MultiPolygon | GeoJSON.Polygon, {
  code?: string;
  nom?: string;
  NOM?: string;
  INSEE?: string;
}>;

type Props = {
  onZoneClick?: (zoneId: string, zoneName: string) => void;
  onSelectionChange?: (zoneIds: string[]) => void;
  defaultSelected?: string[];
  alwaysMultiSelect?: boolean;
  className?: string;
  height?: number;
};

const RAW_URL = 'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/communes-avec-outre-mer.geojson';

function slugify(str: string) {
  return String(str || '')
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function MapReunion({
  onZoneClick,
  onSelectionChange,
  defaultSelected = [],
  alwaysMultiSelect = false,
  className,
  height = 520,
}: Props) {
  const [features, setFeatures] = useState<CommuneFeature[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultSelected));
  const svgRef = useRef<SVGSVGElement | null>(null);

  const { path, viewBox } = useMemo(() => {
    const projection = d3.geoMercator();
    const p = d3.geoPath(projection as any);
    return { path: p, viewBox: '0 0 800 800' };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await fetch(RAW_URL, { cache: 'no-cache' });
      const gj = await res.json() as GeoJSON.FeatureCollection;
      const feats = (gj.features as CommuneFeature[]).filter(f =>
        String(f.properties?.code || f.properties?.INSEE || '').startsWith('974')
      );
      if (!mounted) return;

      const projection = d3.geoMercator();
      const p = d3.geoPath(projection as any);
      projection.fitSize([800, 800], { type: 'FeatureCollection', features: feats } as any);
      (path as any).projection(projection);
      setFeatures(feats);

      if (svgRef.current) svgRef.current.setAttribute('viewBox', '0 0 800 800');
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onSelectionChange?.(Array.from(selected));
  }, [selected, onSelectionChange]);

  const zoomToFeature = (f: CommuneFeature) => {
    if (!svgRef.current) return;
    const b = (path as any).bounds(f) as [[number, number], [number, number]];
    const x = b[0][0], y = b[0][1];
    const w = b[1][0] - b[0][0];
    const h = b[1][1] - b[0][1];
    const pad = Math.max(w, h) * 0.15;
    svgRef.current.setAttribute('viewBox', `${x - pad} ${y - pad} ${w + pad * 2} ${h + pad * 2}`);
  };

  const resetZoom = () => {
    svgRef.current?.setAttribute('viewBox', viewBox);
  };

  const zoomToSelection = () => {
    if (!svgRef.current || selected.size === 0) return;
    const selectedFeats = features.filter(f => {
      const name = (f.properties?.nom || f.properties?.NOM || '') as string;
      return selected.has(slugify(name));
    });
    if (selectedFeats.length === 0) return;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    selectedFeats.forEach(f => {
      const b = (path as any).bounds(f) as [[number, number], [number, number]];
      x0 = Math.min(x0, b[0][0]); y0 = Math.min(y0, b[0][1]);
      x1 = Math.max(x1, b[1][0]); y1 = Math.max(y1, b[1][1]);
    });
    const w = x1 - x0, h = y1 - y0;
    const pad = Math.max(w, h) * 0.15;
    svgRef.current.setAttribute('viewBox', `${x0 - pad} ${y0 - pad} ${w + pad * 2} ${h + pad * 2}`);
  };

  const handleZoneClick = (f: CommuneFeature, ev: React.MouseEvent<SVGPathElement>) => {
    const name = String(f.properties?.nom || f.properties?.NOM || '');
    const id = slugify(name);
    const multi = alwaysMultiSelect || ev.ctrlKey || ev.metaKey;

    setSelected(prev => {
      const next = new Set(prev);
      if (!multi) next.clear();
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

    onZoneClick?.(id, name);
  };

  return (
    <div className={className} style={{ width: '100%' }}>
      <div className="flex flex-wrap items-center gap-2 mb-2 text-sm">
        <button className="border rounded px-2 py-1 hover:bg-slate-50" onClick={resetZoom}>Réinitialiser</button>
        <button
          className="border rounded px-2 py-1 hover:bg-slate-50 disabled:opacity-50"
          onClick={zoomToSelection}
          disabled={selected.size === 0}
        >
          Zoom sélection
        </button>
        <span className="text-slate-600">
          Astuce: Ctrl/Cmd pour multi-sélection • Double‑clic pour zoomer une commune
        </span>
      </div>

      <svg
        ref={svgRef}
        viewBox={viewBox}
        role="img"
        aria-label="Carte des communes de La Réunion"
        style={{ width: '100%', height }}
      >
        <defs>
          <style>
            {`.zone{fill:#dbeafe;stroke:#1e3a8a;stroke-width:1;vector-effect:non-scaling-stroke;cursor:pointer;transition:fill .2s, opacity .2s}
              .zone:hover{fill:#f59e0b}
              .selected{fill:#22c55e;opacity:.95}`}
          </style>
        </defs>
        <g>
          {features.map((f, i) => {
            const name = String(f.properties?.nom || f.properties?.NOM || '');
            const id = slugify(name);
            const d = (path as any)(f) as string;
            const isSelected = selected.has(id);
            return (
              <path
                key={id || i}
                d={d}
                id={id}
                data-name={name}
                className={`zone ${isSelected ? 'selected' : ''}`}
                onClick={(ev) => handleZoneClick(f, ev)}
                onDoubleClick={() => zoomToFeature(f)}
              />
            );
          })}
        </g>
      </svg>

      <div className="mt-2 text-sm">
        <strong>Sélection :</strong>{' '}
        {Array.from(selected).length ? Array.from(selected).join(', ') : '—'}
      </div>
    </div>
  );
}
