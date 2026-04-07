/**
 * Presentation: GridLayer
 * Renders the hex grid GeoJSON overlay on the Leaflet map.
 */
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { DatasetVariant } from '../../../domain/transit';
import { transitRepository } from '../../../infrastructure/dataRepository';

interface Props {
  variant: DatasetVariant;
}

export default function GridLayer({ variant }: Props) {
  const map = useMap();

  useEffect(() => {
    const layer = L.layerGroup();
    let cancelled = false;

    async function load() {
      const data = await transitRepository.fetchGrid(variant);
      if (cancelled) return;

      L.geoJSON(data as unknown as GeoJSON.FeatureCollection, {
        style: () => ({
          color: '#333',
          weight: 1,
          fillColor: '#66ccff',
          fillOpacity: 0.3,
        }),
        onEachFeature: (feature, featureLayer) => {
          featureLayer.bindPopup(`Hex: ${feature.properties?.id ?? 'N/A'}`);
        },
      }).addTo(layer);

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
