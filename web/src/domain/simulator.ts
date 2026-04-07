/**
 * Domain: types for the dynamic pricing user simulator.
 *
 * Covers hubs, stations, OD routes, route legs, and optimization data
 * used by the interactive simulator on the pricing page.
 */

import type { GeoJsonFeatureCollection } from "./geo";

// ── Hub & Station types ─────────────────────────────────────────────────────

export interface HubProperties {
  hub_id: number;
  bike_stations: string[];
  pt_stations: string[];
  lines: string[];
  label: string;
}

export interface HubPolygonProperties {
  cluster: number;
}

export interface StationHubProperties {
  station_id: string;
  station_type: "bike" | "pt";
  name: string;
  hub_id: number;
}

export type HubsFeatureCollection = GeoJsonFeatureCollection<HubProperties>;
export type HubPolygonsFeatureCollection =
  GeoJsonFeatureCollection<HubPolygonProperties>;
export type StationsHubFeatureCollection =
  GeoJsonFeatureCollection<StationHubProperties>;

// ── Route & Leg types ───────────────────────────────────────────────────────

export type LegMode = "FOOT" | "TRAM" | "BUS" | "BICYCLE" | "CAR";
export type RouteType = "PT-Only" | "PT+Bike" | "Car";

export interface RouteLeg {
  leg_idx: number;
  mode: LegMode;
  duration_s: number;
  distance_m: number;
  line_publicCode: { publicCode: string };
  from_place: string;
  from_lat: number;
  from_lon: number;
  to_place: string;
  to_lat: number;
  to_lon: number;
  rented_bike: boolean | null;
}

export interface RouteOptimization {
  Type: RouteType;
  "Flow (q)": number;
  "Bike Price": number;
  "Total Price": number;
  "PT Time": number;
  "Bike Time": number;
  Transfers: number;
  nu: number;
  "z value": number;
  "Relaxation Difference": number;
}

export interface ODRoute {
  arc_id: string;
  total_travel_time_s: number;
  total_transfer_time_s: number;
  total_distance_m: number;
  type: RouteType;
  legs: RouteLeg[];
  optimization?: RouteOptimization | null;
}

export interface ODRouteData {
  origin_hub_id: number;
  destination_hub_id: number;
  od_key: string;
  demand: number;
  gamma: number;
  routes: ODRoute[];
}

// ── Detailed arc geometry (per-arc JSON file) ───────────────────────────────

/** A single leg's detailed path geometry, from the per-arc JSON file. */
export interface ArcLeg {
  leg_idx: number;
  mode: LegMode;
  /** Array of [lat, lng] pairs (already in Leaflet order). */
  geometry: [number, number][];
}

/** Top-level shape of cluster_arcs/{origin}/{dest}/{arcId}.json */
export interface ArcGeometry {
  arc_id: string;
  origin_hub_id: number;
  destination_hub_id: number;
  legs: ArcLeg[];
}
