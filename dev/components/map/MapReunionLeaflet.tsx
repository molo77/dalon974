'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import L from 'leaflet';
import { loadReunionFeatures } from '@/lib/reunionGeo';

// Correction pour les icônes Leaflet (problème avec les images par défaut)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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
  hideSelectionSummary?: boolean;
};

// RAW_URL supprimé: les données sont chargées via loadReunionFeatures

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
  hideSelectionSummary = false,
}: Props) {
  const [features, setFeatures] = useState<CommuneFeature[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultSelected));
  const mapRef = useRef<LeafletMap | null>(null);
  // groupRef supprimé (inutilisé)
  // const groupRef = useRef<FeatureGroup | null>(null);
  const layerById = useRef<Record<string, L.Path>>({});
  const centerById = useRef<Record<string, L.LatLng>>({});
  const onChangeRef = useRef(onSelectionChange);
  useEffect(() => { onChangeRef.current = onSelectionChange; }, [onSelectionChange]);

  // Mapping alt -> canon basé sur les features chargées (gère les articles le/la/les/l-)
  const altToCanonical = useMemo(() => {
    const map: Record<string, string> = {};
    features.forEach((f) => {
      const raw = String(f.properties?.nom || f.properties?.NOM || '');
      const id = slugify(raw);
      if (!id) return;
      map[id] = id;
      const base = id.replace(/^(l|le|la|les)-/, '');
      if (base && !map[base]) map[base] = id; // ex: etang-sale -> l-etang-sale
      // Ajouter aussi des variantes préfixées (sécurité si les slugs côté app incluent l'article)
      ['l', 'le', 'la', 'les'].forEach((art) => {
        const withArt = `${art}-${base}`;
        if (withArt && !map[withArt]) map[withArt] = id; // ex: le-tampon -> tampon (si dataset sans article) ou inverse
      });
    });
    return map;
  }, [features]);

  const canon = useCallback((s: string) => (altToCanonical[s] || s), [altToCanonical]);

  // Charger uniquement les communes 974
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const feats = await loadReunionFeatures();
        if (!mounted) return;
        setFeatures(feats as any);
      } catch {
        // Fallback: pas bloquant, mais on peut laisser features vide
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Notifier sélection (seulement si elle change réellement et vient d'une interaction utilisateur)
  const lastSentRef = useRef<string[] | null>(null);
  const isUpdatingFromParentRef = useRef(false);
  
  useEffect(() => {
    const arr = Array.from(selected);
    const prev = lastSentRef.current;
    const same = prev && prev.length === arr.length && prev.every((v, i) => v === arr[i]);
    if (same) return;
    
    // Ne pas notifier si la mise à jour vient du parent
    if (isUpdatingFromParentRef.current) {
      isUpdatingFromParentRef.current = false;
      lastSentRef.current = arr;
      return;
    }
    
    lastSentRef.current = arr;
    onChangeRef.current?.(arr);
  }, [selected]);

  // Sync contrôlé: si le parent fournit selected, on aligne l'état interne
  useEffect(() => {
    if (!selectedProp) return;
    // Normalise via le mapping alt->canon (aligne avec les IDs des polygones)
    const incoming = new Set<string>(
      (selectedProp as (string | null | undefined)[])
        .filter((x): x is string => typeof x === 'string' && !!x)
        .map(canon)
    );
    // évite les setState inutiles
    const same = incoming.size === selected.size && Array.from(incoming).every((s) => selected.has(s));
    if (!same) {
      isUpdatingFromParentRef.current = true; // Marquer que la mise à jour vient du parent
      setSelected(incoming);
    }
  }, [selectedProp, canon, selected]);

  // Quand les features arrivent (ou changent), re-normaliser la sélection existante
  useEffect(() => {
    if (features.length === 0) return;
    setSelected((prev) => {
      if (prev.size === 0) return prev;
      const next: Set<string> = new Set<string>(Array.from(prev).map(canon));
      const same = next.size === prev.size && Array.from(next).every((s) => prev.has(s));
      return same ? prev : next;
    });
  }, [features, canon]);

  const baseCenter = useMemo(() => ({ lat: -21.115, lng: 55.536 }), []);

  const styleFn = useCallback((f: CommuneFeature): L.PathOptions => {
    const name = String(f.properties?.nom || f.properties?.NOM || '');
  const id = canon(slugify(name));
    const isSel = selected.has(id);
    return {
      color: isSel ? '#16a34a' : '#0ea5e9',
      weight: isSel ? 2 : 1,
      fillColor: isSel ? '#22c55e' : '#60a5fa',
      fillOpacity: isSel ? 0.45 : 0.25,
    };
  }, [canon, selected]);

  const onEachFeature = useCallback((feature: CommuneFeature, layer: L.Layer) => {
    if (!(layer as any).bindTooltip) return;
    const name = String(feature.properties?.nom || feature.properties?.NOM || '');
  const id = canon(slugify(name));
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
  }, [alwaysMultiSelect, canon, onZoneClick]);

  const resetView = () => {
  mapRef.current?.setView(baseCenter as any, 9);
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
    <div className={className} style={{ width: '100%', position: 'relative', zIndex: 0 }}>
      <div className="flex flex-wrap items-center gap-2 mb-2 text-sm">
        <button
          type="button"
          className="border rounded px-2 py-1 hover:bg-slate-50"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); resetView(); }}
        >
          Réinitialiser
        </button>
        <button
          type="button"
          className="border rounded px-2 py-1 hover:bg-slate-50 disabled:opacity-50"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); zoomSelection(); }}
          disabled={selected.size === 0}
        >
          Zoom sélection
        </button>
      </div>

      <MapContainer
        center={baseCenter as any}
        zoom={9}
        style={{ width: '100%', height, borderRadius: '12px', overflow: 'hidden', zIndex: 0 }}
        ref={mapRef}
        attributionControl={false}
        className="rounded-xl overflow-hidden"
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

      </MapContainer>

      

      {!hideSelectionSummary && (
        <div className="mt-2 text-sm">
          <strong>Sélection :</strong>{' '}
          {Array.from(selected).length ? Array.from(selected).join(', ') : '—'}
        </div>
      )}
    </div>
  );
}
