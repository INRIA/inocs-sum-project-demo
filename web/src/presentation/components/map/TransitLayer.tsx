/**
 * Presentation: TransitLayer
 * Renders GTFS stops (emoji pins) and itineraries (coloured polylines)
 * on the Leaflet map. Must be mounted inside a <MapContainer>.
 */
import { useEffect, useMemo } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { DatasetVariant } from '../../../domain/transit';
import { transitRepository } from '../../../infrastructure/dataRepository';
import { COLORS } from '../../lib/colors';
import { assignRouteColors } from '../../lib/geoUtils';
import { transitTypeLabel } from '../../lib/transitTypes';

interface Props {
  variant: DatasetVariant;
}

function emojiPin(color: string, emoji: string, sizePx = 30): L.DivIcon {
  const d = sizePx;
  return L.divIcon({
    className: 'sum-emoji-pin',
    iconAnchor: [0, d * 0.9],
    html: `<span style="background:${color};width:${d}px;height:${d}px;display:block;position:relative;
      left:-${d / 2}px;top:-${d / 2}px;border-radius:${d}px ${d}px 0 ${d}px;transform:rotate(45deg);
      border:1px solid #fff;text-align:center;line-height:${d}px;font-size:${Math.round(d * 0.65)}px;
      box-shadow:0 1px 3px rgba(0,0,0,.35);">
      <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);pointer-events:none;">${emoji}</span>
    </span>`,
  });
}

export default function TransitLayer({ variant }: Props) {
  const map = useMap();

  useEffect(() => {
    const stopsLayer = L.layerGroup();
    const itiLayer = L.layerGroup();
    let cancelled = false;

    async function load() {
      const [stops, itineraries] = await Promise.all([
        transitRepository.fetchStops(variant),
        transitRepository.fetchItineraries(variant),
      ]);
      if (cancelled) return;

      // ── Stops ──────────────────────────────────────────────────────────────
      for (const f of stops.features) {
        const [lng, lat] = f.geometry.coordinates as [number, number];
        L.marker([lat, lng], { icon: emojiPin(COLORS.BLUE_LIGHT, '🚌') })
          .bindPopup(`<strong>${f.properties.stop_name}</strong>`)
          .addTo(stopsLayer);
      }

      // ── Itineraries ────────────────────────────────────────────────────────
      const routeNames = [...new Set(itineraries.features.map((f) => f.properties.route_short_name))];
      const routeColors = assignRouteColors(routeNames);

      L.geoJSON(itineraries as unknown as GeoJSON.FeatureCollection, {
        coordsToLatLng: (c) => L.latLng(c[1], c[0]),
        style: (feature) => {
          const p = feature?.properties;
          const color = routeColors[p?.route_short_name] ?? (p?.color ? `#${p.color}` : COLORS.BLUE);
          return { color, weight: 4 };
        },
        onEachFeature: (feature, layer) => {
          const p = feature.properties;
          const color = routeColors[p?.route_short_name] ?? (p?.color ? `#${p.color}` : COLORS.BLUE);
          const coords: number[][] = (feature.geometry as GeoJSON.LineString).coordinates;
          const label = `${transitTypeLabel(p?.route_type)} Line ${p?.route_short_name}<br/>${decodeURIComponent(p?.headsign ?? '')}<br/>ID: ${p?.route_id}`;
          layer.bindPopup(label);

          const options: L.CircleMarkerOptions = { radius: 6, fillColor: color, color: '#fff', weight: 4, opacity: 1, fillOpacity: 0.8 };
          const first = coords[0]!;
          const last = coords[coords.length - 1]!;
          [first, last].forEach((c) => L.circleMarker([c[1], c[0]], options).bindPopup(label).addTo(itiLayer));
        },
      }).addTo(itiLayer);

      stopsLayer.addTo(map);
      itiLayer.addTo(map);

      L.control.layers(undefined, { Stops: stopsLayer, Itineraries: itiLayer }, { collapsed: false }).addTo(map);
    }

    load().catch(console.error);

    return () => {
      cancelled = true;
      map.removeLayer(stopsLayer);
      map.removeLayer(itiLayer);
    };
  }, [map, variant]);

  return null;
}
