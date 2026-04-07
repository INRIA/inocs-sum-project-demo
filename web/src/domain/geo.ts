/**
 * Domain: core GeoJSON geometry types used across the application.
 * Only the fields actually consumed by React components are typed here.
 */

export type LatLng = [lat: number, lng: number];
export type LngLat = [lng: number, lat: number];

export interface GeoJsonFeatureCollection<P> {
  type: 'FeatureCollection';
  features: GeoJsonFeature<P>[];
}

export interface GeoJsonFeature<P> {
  type: 'Feature';
  geometry: GeoJsonGeometry;
  properties: P;
}

export type GeoJsonGeometry = PointGeometry | LineStringGeometry | PolygonGeometry;

export interface PointGeometry {
  type: 'Point';
  coordinates: LngLat;
}

export interface LineStringGeometry {
  type: 'LineString';
  coordinates: LngLat[];
}

export interface PolygonGeometry {
  type: 'Polygon';
  coordinates: LngLat[][];
}
