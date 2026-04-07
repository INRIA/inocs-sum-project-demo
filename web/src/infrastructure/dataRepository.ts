/**
 * Infrastructure: generic GeoJSON / JSON repository.
 *
 * Provides typed fetch helpers with a simple in-memory cache so that
 * repeated component renders don't re-fetch the same file.
 */

import { assetUrl } from "./assetUrl";
import type {
  StopsFeatureCollection,
  ItinerariesFeatureCollection,
  BikeStationsFeatureCollection,
  GridFeatureCollection,
  RidershipFeatureCollection,
  DatasetVariant,
} from "../domain/transit";
import { DATASET_FOLDER as _FOLDER } from "../domain/transit";
import type {
  DynamicPricingVariant,
  DynamicPricingData,
} from "../domain/dynamicPricing";
import type {
  HubsFeatureCollection,
  HubPolygonsFeatureCollection,
  StationsHubFeatureCollection,
  ODRouteData,
  ArcGeometry,
} from "../domain/simulator";
import { DYNAMIC_PRICING_FOLDER as _DYNAMIC_FOLDER } from "../domain/dynamicPricing";

// ── simple module-level cache ─────────────────────────────────────────────────
const _cache = new Map<string, unknown>();

async function fetchJson<T>(url: string): Promise<T> {
  if (_cache.has(url)) return _cache.get(url) as T;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const data = (await res.json()) as T;
  _cache.set(url, data);
  return data;
}

// ── helpers ───────────────────────────────────────────────────────────────────
function geojsonUrl(variant: DatasetVariant, file: string): string {
  return assetUrl(`data/sum_gtfs_geojson/${_FOLDER[variant]}/${file}`);
}

function dynamicPricingUrl(
  variant: DynamicPricingVariant,
  file: string,
): string {
  return assetUrl(
    `data/nsm_pt_dynamic_pricing/${_DYNAMIC_FOLDER[variant]}/${file}`,
  );
}

// ── Transit repo ──────────────────────────────────────────────────────────────
export const transitRepository = {
  fetchStops: (variant: DatasetVariant) =>
    fetchJson<StopsFeatureCollection>(geojsonUrl(variant, "stops.geojson")),

  fetchItineraries: (variant: DatasetVariant) =>
    fetchJson<ItinerariesFeatureCollection>(
      geojsonUrl(variant, "itineraries.geojson"),
    ),

  fetchBikeStations: (variant: DatasetVariant) =>
    fetchJson<BikeStationsFeatureCollection>(
      geojsonUrl(variant, "bike_stations.geojson"),
    ),

  fetchGrid: (variant: DatasetVariant) =>
    fetchJson<GridFeatureCollection>(geojsonUrl(variant, "grid.geojson")),

  fetchRidership: (variant: DatasetVariant) =>
    fetchJson<RidershipFeatureCollection>(
      geojsonUrl(variant, "ridership.geojson"),
    ),
};

// ── Dynamic pricing optimization repo ────────────────────────────────────────
export const dynamicPricingOptimizationRepository = {
  fetchMetrics: (variant: DynamicPricingVariant) =>
    fetchJson<DynamicPricingData>(
      dynamicPricingUrl(variant, "optimization_metrics.json"),
    ),
};

// ── Simulator repo ───────────────────────────────────────────────────────────
export const simulatorRepository = {
  fetchHubs: (variant: DynamicPricingVariant) =>
    fetchJson<HubsFeatureCollection>(
      dynamicPricingUrl(variant, "hubs.geojson"),
    ),

  fetchHubPolygons: (variant: DynamicPricingVariant) =>
    fetchJson<HubPolygonsFeatureCollection>(
      dynamicPricingUrl(variant, "hub_polygons.geojson"),
    ),

  fetchStationsHub: (variant: DynamicPricingVariant) =>
    fetchJson<StationsHubFeatureCollection>(
      dynamicPricingUrl(variant, "stations_hub.geojson"),
    ),

  fetchODRoutes: (variant: DynamicPricingVariant, originId: number, destId: number) =>
    fetchJson<ODRouteData>(
      dynamicPricingUrl(variant, `cluster_arcs/${originId}/${destId}/routes.json`),
    ),

  fetchArcGeometry: (
    variant: DynamicPricingVariant,
    originId: number,
    destId: number,
    arcId: string,
  ) =>
    fetchJson<ArcGeometry>(
      dynamicPricingUrl(variant, `cluster_arcs/${originId}/${destId}/arcs/${arcId}.json`),
    ),
};
