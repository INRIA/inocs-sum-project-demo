/**
 * Geometry utilities — ported from V1 utils.js, fully typed.
 */
import type { LatLng } from '../../domain/geo';

// ── Color interpolation ────────────────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace(/^#/, '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

export function interpolateColor(color1: string, color2: string, factor: number): string {
  const [r1, g1, b1] = hexToRgb(color1);
  const [r2, g2, b2] = hexToRgb(color2);
  return rgbToHex(
    Math.round(r1 + (r2 - r1) * factor),
    Math.round(g1 + (g2 - g1) * factor),
    Math.round(b1 + (b2 - b1) * factor),
  );
}

// ── Bézier curved path (for Leaflet.Curve / polyline approximation) ───────────
export type CurvePath = ['M', LatLng, 'Q', LatLng, LatLng];

export function getCurvedPath(
  from: LatLng,
  to: LatLng,
  side: 'left' | 'right' = 'left',
  bend = 0.2,
): CurvePath {
  const [lat1, lng1] = from;
  const [lat2, lng2] = to;
  const midLat = (lat1 + lat2) / 2;
  const midLng = (lng1 + lng2) / 2;

  const dx = lng2 - lng1;
  const dy = lat2 - lat1;
  const length = Math.sqrt(dx * dx + dy * dy) || 1;
  const offsetLat = (-dy / length) * bend;
  const offsetLng = (dx / length) * bend;
  const dir = side === 'left' ? 1 : -1;

  return ['M', from, 'Q', [midLat + dir * offsetLat, midLng + dir * offsetLng], to];
}

/** Point ~t% along the Bézier path from origin toward control point. */
export function getPositionNearOrigin(
  from: LatLng,
  to: LatLng,
  side: 'left' | 'right' = 'left',
  bend = 0.02,
  t = 0.15,
): LatLng {
  const path = getCurvedPath(from, to, side, bend);
  const origin = path[1];
  const control = path[3];
  return [
    origin[0] + (control[0] - origin[0]) * t,
    origin[1] + (control[1] - origin[1]) * t,
  ];
}

// ── Hex geometry ──────────────────────────────────────────────────────────────
/** Returns 7 [lng, lat] points forming a closed hexagon centred at [cx, cy]. */
export function createHexagon(center: [number, number], size = 0.01): [number, number][] {
  const [cx, cy] = center;
  const coords = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i;
    return [cx + size * Math.cos(angle), cy + size * Math.sin(angle)] as [number, number];
  });
  coords.push(coords[0]!);
  return coords;
}

// ── Radius scaling ─────────────────────────────────────────────────────────────
const MAX_RADIUS = 0.05 * 8;
export function scaledRadius(capacity: number, maxCapacity: number): number {
  return (capacity / maxCapacity) * MAX_RADIUS;
}

// ── Route colour assignment ────────────────────────────────────────────────────
import { COLORS } from './colors';

export function assignRouteColors(routeNames: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  routeNames.forEach((name, idx) => {
    const factor = routeNames.length === 1 ? 0 : idx / (routeNames.length - 1);
    result[name] = interpolateColor(COLORS.BLUE, COLORS.BLUE_LIGHT, factor);
  });
  return result;
}
