'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip } from 'react-leaflet';
import type { FeatureGroup, Map as LeafletMap } from 'leaflet';
import L from 'leaflet';

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
  selected?: string[]; // contrôlé par le parent
  alwaysMultiSelect?: boolean;
  className?: string;
  height?: number;
  // Marqueurs à afficher (ex: colocs qui recherchent), positionnés par slug de commune
  markers?: { id: string; slug?: string; label?: string }[];
};

const RAW_URL = 'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/communes-avec-outre-mer.geojson';

function slugify(str: string) {
  return String(str || '')
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function MapReunionLeaflet({
  onZoneClick,
  onSelectionChange,
  defaultSelected = [],
  selected: selectedProp,
  alwaysMultiSelect = true,
  className,
  height = 520,
  markers = [],
}: Props) {
  const [features, setFeatures] = useState<CommuneFeature[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultSelected));
  const mapRef = useRef<LeafletMap | null>(null);
  const groupRef = useRef<FeatureGroup | null>(null);
  const layerById = useRef<Record<string, L.Path>>({});
  const centerById = useRef<Record<string, L.LatLng>>({});
  // Centres calculés à partir des features (robuste pour le rendu des marqueurs)
  const centersById = useMemo(() => {
    const map: Record<string, L.LatLng> = {};
    try {
      for (const f of features) {
        const name = String((f.properties as any)?.nom || (f.properties as any)?.NOM || '');
        const id = slugify(name);
        try {
          const layer = L.geoJSON(f as any);
          const b = (layer as any).getBounds?.();
          const c = b?.getCenter?.();
          if (c) map[id] = c;
        } catch {}
      }
    } catch {}
    return map;
  }, [features]);
  const onChangeRef = useRef(onSelectionChange);
  useEffect(() => { onChangeRef.current = onSelectionChange; }, [onSelectionChange]);

  // Charger uniquement les communes 974
  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await fetch(RAW_URL, { cache: 'no-cache' });
      const gj = await res.json() as GeoJSON.FeatureCollection;
      const feats = (gj.features as CommuneFeature[]).filter(f =>
        String(f.properties?.code || f.properties?.INSEE || '').startsWith('974')
      );
      if (!mounted) return;
      setFeatures(feats);
    })();
    return () => { mounted = false; };
  }, []);

  // Notifier sélection (seulement si elle change réellement)
  const lastSentRef = useRef<string[] | null>(null);
  useEffect(() => {
    const arr = Array.from(selected);
    const prev = lastSentRef.current;
    const same = prev && prev.length === arr.length && prev.every((v, i) => v === arr[i]);
    if (same) return;
    lastSentRef.current = arr;
    onChangeRef.current?.(arr);
  }, [selected]);

  // Sync contrôlé: si le parent fournit selected, on aligne l’état interne
  useEffect(() => {
    if (!selectedProp) return;
    const incoming = new Set(selectedProp.filter(Boolean));
    // évite les setState inutiles
    const same = incoming.size === selected.size && Array.from(incoming).every((s) => selected.has(s));
    if (!same) setSelected(incoming);
  }, [selectedProp]);

  const baseCenter = useMemo(() => ({ lat: -21.115, lng: 55.536 }), []);

  const styleFn = (f: CommuneFeature): L.PathOptions => {
    const name = String(f.properties?.nom || f.properties?.NOM || '');
    const id = slugify(name);
    const isSel = selected.has(id);
    return {
      color: isSel ? '#16a34a' : '#0ea5e9',
      weight: isSel ? 2 : 1,
      fillColor: isSel ? '#22c55e' : '#60a5fa',
      fillOpacity: isSel ? 0.45 : 0.25,
    };
  };

  const onEachFeature = (feature: CommuneFeature, layer: L.Layer) => {
    if (!(layer as any).bindTooltip) return;
    const name = String(feature.properties?.nom || feature.properties?.NOM || '');
    const id = slugify(name);
    const path = layer as L.Path;
    layerById.current[id] = path;

    // Label permanent (au centroïde approx du polygone)
    const center = (layer as any).getBounds?.().getCenter?.();
    if (center) {
      centerById.current[id] = center;
      (layer as any).bindTooltip(name, {
        permanent: true,
        direction: 'center',
        className: 'leaflet-tooltip-own',
        opacity: 0.9,
      } as any);
      (layer as any).openTooltip(center);
    }

    layer.on('click', (ev: L.LeafletMouseEvent) => {
      const multi = alwaysMultiSelect || ev.originalEvent.ctrlKey || ev.originalEvent.metaKey;
      setSelected(prev => {
        const next = new Set(prev);
        if (!multi) next.clear();
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      onZoneClick?.(id, name);
    });

    layer.on('dblclick', () => {
      const m = mapRef.current;
      if (!m) return;
      const b = (layer as any).getBounds?.();
      if (b) m.fitBounds(b.pad(0.15));
    });
  };

  const resetView = () => {
    mapRef.current?.setView(baseCenter as any, 10);
  };

  const zoomSelection = () => {
    const m = mapRef.current;
    if (!m || selected.size === 0) return;
    let bounds: L.LatLngBounds | null = null;
    Array.from(selected).forEach((id) => {
      const lyr = layerById.current[id];
      if (!lyr || !(lyr as any).getBounds) return;
      const b = (lyr as any).getBounds() as L.LatLngBounds;
      bounds = bounds ? bounds.extend(b) : L.latLngBounds(b.getSouthWest(), b.getNorthEast());
    });
    if (bounds) {
      const size = m.getSize();
      const pad = L.point(size.x * 0.15, size.y * 0.15);
      m.fitBounds(bounds, { padding: pad });
    }
  };

  return (
    <div className={className} style={{ width: '100%' }}>
  <div className="flex flex-wrap items-center gap-2 mb-2 text-sm">
        <button className="border rounded px-2 py-1 hover:bg-slate-50" onClick={resetView}>Réinitialiser</button>
        <button
          className="border rounded px-2 py-1 hover:bg-slate-50 disabled:opacity-50"
          onClick={zoomSelection}
          disabled={selected.size === 0}
        >
          Zoom sélection
        </button>
      </div>

      <MapContainer
        center={baseCenter as any}
        zoom={10}
        style={{ width: '100%', height }}
        ref={mapRef}
        attributionControl={false}
      >
        {/* Fond satellite éclairci (classe CSS appliquée aux tuiles) */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          className="tile-bright"
        />
        {/* Overlay labels routes/villes (un peu plus visible) */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png"
          opacity={0.9}
        />

        <GeoJSON
          key={`gj-${features.length}-${Array.from(selected).join('|')}`}
          data={{
            type: 'FeatureCollection',
            features: features as any,
          } as any}
          style={styleFn as any}
          onEachFeature={onEachFeature as any}
        />

        {/* Marqueurs des profils (si fournis) */}
        {Array.isArray(markers) && markers.map((m) => {
          const slug = (m.slug || '').toString();
          if (!slug) return null;
          const center = centersById[slug] || centerById.current[slug];
          if (!center) return null;
          return (
            <CircleMarker
              key={`mk-${m.id}`}
              center={center as any}
              radius={5}
              pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.9, weight: 1 }}
            >
              {m.label ? (
                <Tooltip direction="top" offset={[0, -6]} opacity={0.9} permanent={false} className="leaflet-tooltip-own">
                  {m.label}
                </Tooltip>
              ) : null}
            </CircleMarker>
          );
        })}
      </MapContainer>

      <style jsx global>{`
        .leaflet-tooltip-own {
          background: rgba(15, 23, 42, 0.65);
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 2px 6px;
          font-size: 11px;
          text-shadow: 0 1px 2px rgba(0,0,0,.4);
        }
        /* Eclaircissement du fond satellite */
        .leaflet-tile.tile-bright {
          filter: brightness(1.18) saturate(1.12) contrast(1.04);
        }
      `}</style>

      <div className="mt-2 text-sm">
        <strong>Sélection :</strong>{' '}
        {Array.from(selected).length ? Array.from(selected).join(', ') : '—'}
      </div>
    </div>
  );
}
