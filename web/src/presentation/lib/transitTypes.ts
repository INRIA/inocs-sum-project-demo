/** GTFS route_type → human-readable label (GTFS spec §route_type). */
export const TRANSIT_TYPE_LABELS: Record<number, string> = {
  0: 'Tram / Light rail',
  1: 'Subway / Metro',
  2: 'Rail',
  3: 'Bus',
  4: 'Ferry',
  5: 'Cable tram',
  6: 'Aerial lift',
  7: 'Funicular',
  11: 'Trolleybus',
  12: 'Monorail',
};

export function transitTypeLabel(routeType: number): string {
  return TRANSIT_TYPE_LABELS[routeType] ?? `Type ${routeType}`;
}
