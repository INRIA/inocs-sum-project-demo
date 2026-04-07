/**
 * Domain: GTFS and shared mobility data types.
 * Typed only for fields used by map layer components.
 */

import type { GeoJsonFeatureCollection, PointGeometry, LineStringGeometry } from './geo';

// ---- Stops ----
export interface StopProperties {
  stop_id: string;
  stop_name: string;
  stop_code: string | null;
  stop_lat: number;
  stop_lon: number;
  location_type: number | null;
  parent_station: string | null;
}
export type StopsFeatureCollection = GeoJsonFeatureCollection<StopProperties>;

// ---- Itineraries ----
export interface ItineraryProperties {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_type: number;
  headsign: string;
  direction_id: number;
  trip_id: string;
  /** hex color without # (e.g. "F5A300") */
  color: string;
  text_color: string;
}
export type ItinerariesFeatureCollection = GeoJsonFeatureCollection<ItineraryProperties>;

// ---- Bike Stations ----
export interface BikeStationProperties {
  station_id: string;
  name: string;
  short_name: string;
  lat: number;
  lon: number;
  capacity: number | null;
  /** inventory per period index */
  inventory?: Record<number, number>;
  history?: unknown[];
}
export type BikeStationsFeatureCollection = GeoJsonFeatureCollection<BikeStationProperties> & {
  /** optional metadata produced by the optimization pipeline */
  metadata?: { periods?: number[] };
};

// ---- Grid ----
export interface GridProperties {
  id?: string | number;
  [key: string]: unknown;
}
export type GridFeatureCollection = GeoJsonFeatureCollection<GridProperties>;

// ---- Ridership ----
export interface RidershipProperties {
  stop_code: string;
  stop_name: string;
  /** 1=Monday … 7=Sunday */
  day_index: number;
  /** 0–23 */
  timeslot: number;
  boardings: number;
  alightings: number;
}
export type RidershipFeatureCollection = GeoJsonFeatureCollection<RidershipProperties>;

// ---- Dataset radius variant ----
export type DatasetVariant = '1km' | '5km' | '10km';
export const DATASET_VARIANTS: DatasetVariant[] = ['1km', '5km', '10km'];

export const DATASET_FOLDER: Record<DatasetVariant, string> = {
  '1km': 'geneva_1km-radius',
  '5km': 'geneva_5km-radius',
  '10km': 'geneva_10km-radius',
};
