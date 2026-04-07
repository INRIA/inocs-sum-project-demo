/**
 * Presentation: BikeStationsLayer
 * Renders bike stations as emoji pin markers with optional semicircle
 * capacity/inventory arcs (when data includes capacity + inventory fields).
 */
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { DatasetVariant } from '../../../domain/transit';
import { transitRepository } from '../../../infrastructure/dataRepository';
import { COLORS } from '../../lib/colors';
import { scaledRadius } from '../../lib/geoUtils';

interface Props {
  variant: DatasetVariant;
}

function bikePin(sizePx = 30): L.DivIcon {
  const d = sizePx;
  return L.divIcon({
    className: 'sum-emoji-pin',
    iconAnchor: [0, d * 0.9],
    html: `<span style="background:${COLORS.ORANGE};width:${d}px;height:${d}px;display:block;position:relative;
      left:-${d / 2}px;top:-${d / 2}px;border-radius:${d}px ${d}px 0 ${d}px;transform:rotate(45deg);
      border:1px solid #fff;text-align:center;line-height:${d}px;font-size:${Math.round(d * 0.65)}px;
      box-shadow:0 1px 3px rgba(0,0,0,.35);">
      <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);pointer-events:none;">🚲</span>
    </span>`,
  });
}

export default function BikeStationsLayer({ variant }: Props) {
  const map = useMap();

  useEffect(() => {
    const layer = L.layerGroup();
    let cancelled = false;

    async function load() {
      const data = await transitRepository.fetchBikeStations(variant);
      if (cancelled) return;

      const pointFeatures = data.features.filter((f) => f.geometry.type === 'Point');
      const capacities = pointFeatures.map((f) => f.properties.capacity ?? 0).filter(Boolean);
      const maxCap = capacities.length ? Math.max(...capacities) : 1;

      for (const f of pointFeatures) {
        const [lng, lat] = f.geometry.coordinates as [number, number];
        const { station_id, name, capacity, inventory } = f.properties;

        const popupBase = `<strong>${name}</strong><br/>Station: ${station_id}`;

        // Capacity arc: only available when capacity is known
        if (capacity) {
          const r = scaledRadius(capacity, maxCap);
          const period0inv = inventory?.[0] ?? 0;

          L.circle([lat, lng], { radius: r * 111320, color: COLORS.GREEN, fillColor: COLORS.GREEN, fillOpacity: 1 })
            .bindPopup(`${popupBase}<br/>Capacity: ${capacity}`)
            .addTo(layer);

          if (period0inv > 0) {
            // Approximate semicircle by drawing a filled arc as a circle marker overlay
            const angle = (period0inv / capacity) * 360;
            // react-leaflet doesn't ship SemiCircle; approximate with a lower-opacity overlay
            L.circle([lat, lng], {
              radius: r * 111320,
              color: COLORS.WHITE,
              fillColor: COLORS.WHITE,
              fillOpacity: 0.8,
              weight: 0,
              // clip to angle using CSS rotate not possible in Leaflet without the plugin,
              // so we render a proportional opacity circle as a visual approximation
              opacity: angle / 360,
            })
              .bindPopup(`${popupBase}<br/>Inventory: ${period0inv} / ${capacity}`)
              .addTo(layer);
          }
        }

        L.marker([lat, lng], { icon: bikePin() })
          .bindPopup(popupBase)
          .addTo(layer);
      }

      layer.addTo(map);
    }

    load().catch(console.error);
    return () => {
      cancelled = true;
      map.removeLayer(layer);
    };
  }, [map, variant]);

  return null;
}
