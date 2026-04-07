/**
 * Presentation: HeatmapLayer
 *
 * Interactive ridership heatmap with timeline controls.
 * Ported and restructured from V1 RidershipVisualization + RidershipTimelineControl.
 *
 * Lazy-loads ridership data only when the user enables the layer toggle,
 * to keep initial page load fast for large datasets.
 */
import { useEffect, useState, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import type { DatasetVariant } from '../../../domain/transit';
import { transitRepository } from '../../../infrastructure/dataRepository';
import { RidershipService, type RidershipMetric } from '../../../application/services/RidershipService';
import { COLORS } from '../../lib/colors';

interface Props {
  variant: DatasetVariant;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const HEAT_GRADIENT = {
  0.0: COLORS.BLUE_LIGHT,
  0.4: COLORS.GREEN,
  0.7: COLORS.ORANGE,
  1.0: COLORS.RED,
};

function intensityColor(intensity: number): string {
  if (intensity < 0.25) return COLORS.BLUE_LIGHT;
  if (intensity < 0.5) return COLORS.GREEN;
  if (intensity < 0.75) return COLORS.ORANGE;
  return COLORS.RED;
}

export default function HeatmapLayer({ variant }: Props) {
  const map = useMap();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const serviceRef = useRef<RidershipService | null>(null);

  const [dayIndex, setDayIndex] = useState(1);
  const [timeslot, setTimeslot] = useState(8);
  const [metric, setMetric] = useState<RidershipMetric>('total');
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);

  const heatLayerRef = useRef<L.HeatLayer | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);

  // Load data when user enables the layer
  useEffect(() => {
    if (!enabled || serviceRef.current) return;
    setLoading(true);
    transitRepository
      .fetchRidership(variant)
      .then((data) => {
        serviceRef.current = new RidershipService(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Ridership fetch failed', err);
        setLoading(false);
      });
  }, [enabled, variant]);

  // Reset service when variant changes
  useEffect(() => {
    serviceRef.current = null;
  }, [variant]);

  // Render heatmap + markers when state changes
  useEffect(() => {
    if (!enabled || !serviceRef.current) return;
    const svc = serviceRef.current;
    const features = svc.getFeatures(dayIndex, timeslot);

    // ── Heatmap ──────────────────────────────────────────────────────────────
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }
    if (showHeatmap && features.length > 0) {
      const heatData = features.flatMap((f) => {
        const { boardings, alightings } = f.properties;
        let val;
        if (metric === 'boardings') val = boardings;
        else if (metric === 'alightings') val = alightings;
        else val = boardings + alightings;
        const intensity = Math.pow(svc.normalize(val, metric), 0.6);
        const heatCoords = f.geometry.coordinates as [number, number];
        return intensity > 0 ? [[heatCoords[1], heatCoords[0], intensity] as [number, number, number]] : [];
      });
      heatLayerRef.current = L.heatLayer(heatData, {
        radius: 45,
        blur: 30,
        maxZoom: 13,
        minOpacity: 0.3,
        max: 1.0,
        gradient: HEAT_GRADIENT,
      });
      heatLayerRef.current.addTo(map);
    }

    // ── Markers ──────────────────────────────────────────────────────────────
    if (!markerLayerRef.current) {
      markerLayerRef.current = L.layerGroup().addTo(map);
    }
    markerLayerRef.current.clearLayers();
    if (showMarkers) {
      for (const f of features) {
        const { stop_name, stop_code, boardings, alightings } = f.properties;
        const total = boardings + alightings;
        const val = metric === 'boardings' ? boardings : metric === 'alightings' ? alightings : total;
        const intensity = svc.normalize(val, metric);
        const color = intensityColor(intensity);
        const size = 24;
        const icon = L.divIcon({
          className: 'ridership-marker',
          iconSize: [size, size],
          iconAnchor: [size / 2, size * 0.9],
          html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:${size}px ${size}px 0 ${size}px;transform:rotate(45deg);border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;">
            <span style="transform:rotate(-45deg);font-size:14px;">🔀</span></div>`,
        });
        const popup = `<div style="font-size:12px;min-width:180px">
          <h4 style="margin:0 0 6px;font-size:13px;border-bottom:2px solid ${COLORS.BLUE};padding-bottom:3px">${stop_name}</h4>
          <table><tr><td>Code:</td><td style="text-align:right;font-weight:600">${stop_code}</td></tr>
          <tr><td>🟢 Boardings:</td><td style="text-align:right">${boardings.toLocaleString()}</td></tr>
          <tr><td>🔴 Alightings:</td><td style="text-align:right">${alightings.toLocaleString()}</td></tr>
          <tr style="border-top:1px solid #ddd"><td><strong>Total:</strong></td><td style="text-align:right;font-weight:600">${total.toLocaleString()}</td></tr></table>
        </div>`;
        const coords = f.geometry.coordinates as [number, number];
        L.marker([coords[1], coords[0]], { icon })
          .bindPopup(popup)
          .addTo(markerLayerRef.current);
      }
    }

    return () => {};
  }, [map, enabled, dayIndex, timeslot, metric, showHeatmap, showMarkers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (heatLayerRef.current) map.removeLayer(heatLayerRef.current);
      if (markerLayerRef.current) map.removeLayer(markerLayerRef.current);
    };
  }, [map]);

  // ── Control panel (Leaflet custom control) ────────────────────────────────
  // We render a floating div outside the map for simplicity; position with CSS
  return (
    <div className="leaflet-top leaflet-right" style={{ pointerEvents: 'auto' }}>
      <div className="leaflet-control bg-white rounded-lg shadow-lg p-3 text-xs w-64 mt-2 mr-2 select-none">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-sm">📊 Ridership Timeline</span>
          <button
            onClick={() => setEnabled((v) => !v)}
            className={`text-xs px-2 py-0.5 rounded border transition-colors ${enabled ? 'bg-primary text-primary-foreground border-primary' : 'border-gray-400 text-gray-600 hover:border-primary'}`}
          >
            {enabled ? 'On' : 'Load'}
          </button>
        </div>

        {loading && <p className="text-gray-500 text-center py-2">Loading…</p>}

        {enabled && !loading && (
          <>
            {/* Day selector */}
            <div className="mb-2">
              <label className="block text-gray-500 mb-1">Day</label>
              <div className="flex gap-1">
                {DAYS.map((d, i) => (
                  <button
                    key={d}
                    onClick={() => setDayIndex(i + 1)}
                    className={`flex-1 py-1 rounded text-[10px] border transition-colors ${dayIndex === i + 1 ? 'bg-primary text-primary-foreground border-primary font-semibold' : 'border-gray-300 text-gray-600 hover:border-primary'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Hour slider */}
            <div className="mb-2">
              <label className="block text-gray-500 mb-1">
                Hour: <span className="font-semibold text-primary">{timeslot}:00</span>
              </label>
              <input type="range" min={0} max={23} value={timeslot} onChange={(e) => setTimeslot(+e.target.value)} className="w-full" />
              <div className="flex justify-between text-[9px] text-gray-400 mt-0.5"><span>0:00</span><span>12:00</span><span>23:00</span></div>
            </div>

            {/* Metric */}
            <div className="mb-2">
              <label className="block text-gray-500 mb-1">Metric</label>
              {(['boardings', 'alightings', 'total'] as RidershipMetric[]).map((m) => (
                <label key={m} className="flex items-center gap-1 cursor-pointer mb-1">
                  <input type="radio" name="ridershipMetric" checked={metric === m} onChange={() => setMetric(m)} />
                  <span className="capitalize">{m}</span>
                </label>
              ))}
            </div>

            {/* Toggles */}
            <div className="pt-2 border-t border-gray-200 space-y-1">
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={showHeatmap} onChange={(e) => setShowHeatmap(e.target.checked)} />
                <span>🔥 Heatmap</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={showMarkers} onChange={(e) => setShowMarkers(e.target.checked)} />
                <span>📍 Stop markers</span>
              </label>
            </div>

            {/* Colour legend */}
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex h-3 rounded overflow-hidden border border-gray-200">
                {[COLORS.BLUE_LIGHT, COLORS.GREEN, COLORS.ORANGE, COLORS.RED].map((c) => (
                  <div key={c} style={{ flex: 1, background: c }} />
                ))}
              </div>
              <div className="flex justify-between text-[9px] text-gray-400 mt-0.5"><span>Low</span><span>High</span></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
