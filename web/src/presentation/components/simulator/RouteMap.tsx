/**
 * Presentation: Leaflet map for the simulator showing hub polygons,
 * hub markers, and route leg polylines.
 */

import { useEffect, useMemo } from "react";
import {
  GeoJSON,
  CircleMarker,
  Polyline,
  Tooltip,
  useMap,
} from "react-leaflet";
import type { PathOptions } from "leaflet";
import L from "leaflet";
import BaseMap from "../map/BaseMap";
import type {
  HubsFeatureCollection,
  HubPolygonsFeatureCollection,
  ODRoute,
  HubProperties,
  ArcGeometry,
} from "../../../domain/simulator";
import type { GeoJsonFeature, PointGeometry } from "../../../domain/geo";
import { COLORS } from "../../lib/colors";
import { MODE_COLOR } from "../../lib/simulatorUtils";

/** Extract [lat, lng] from a Point geometry feature. */
function pointLatLng(feature: GeoJsonFeature<unknown>): [number, number] {
  const coords = (feature.geometry as PointGeometry).coordinates;
  return [coords[1], coords[0]];
}

interface Props {
  hubs: HubsFeatureCollection | null;
  hubPolygons: HubPolygonsFeatureCollection | null;
  originHubId: number | null;
  destHubId: number | null;
  selectedRoute: ODRoute | null;
  arcGeometry: ArcGeometry | null;
}

/** Auto-fit map bounds when origin and destination are set. */
function FitBoundsHelper({
  hubs,
  originHubId,
  destHubId,
}: {
  hubs: HubsFeatureCollection | null;
  originHubId: number | null;
  destHubId: number | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!hubs) return;

    if (originHubId !== null && destHubId !== null) {
      const originHub = hubs.features.find(
        (f) => f.properties.hub_id === originHubId,
      );
      const destHub = hubs.features.find(
        (f) => f.properties.hub_id === destHubId,
      );
      if (originHub && destHub) {
        const bounds = L.latLngBounds(
          pointLatLng(originHub),
          pointLatLng(destHub),
        );
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
      }
    } else if (hubs.features.length > 0) {
      // Fit to all hubs on initial load
      const points = hubs.features.map((f) => pointLatLng(f));
      map.fitBounds(L.latLngBounds(points), { padding: [30, 30] });
    }
  }, [map, hubs, originHubId, destHubId]);

  return null;
}

/** Polylines for each leg of the selected route, using detailed geometry when available. */
function RouteLegsLayer({
  route,
  arcGeometry,
}: {
  route: ODRoute;
  arcGeometry: ArcGeometry | null;
}) {
  return (
    <>
      {route.legs.map((leg, i) => {
        const arcLeg = arcGeometry?.legs.find((l) => l.leg_idx === leg.leg_idx);
        const positions: [number, number][] =
          arcLeg && arcLeg.geometry.length > 0
            ? arcLeg.geometry
            : [[leg.from_lat, leg.from_lon], [leg.to_lat, leg.to_lon]];

        return (
          <Polyline
            key={i}
            positions={positions}
            pathOptions={{
              color: MODE_COLOR[leg.mode],
              weight: leg.mode === "FOOT" ? 3 : 5,
              dashArray: leg.mode === "FOOT" ? "5,10" : undefined,
              opacity: 0.85,
            }}
          />
        );
      })}
    </>
  );
}

export default function RouteMap({
  hubs,
  hubPolygons,
  originHubId,
  destHubId,
  selectedRoute,
  arcGeometry,
}: Props) {
  // Style function for hub polygons
  const polygonStyle = useMemo(() => {
    return (feature: GeoJSON.Feature | undefined): PathOptions => {
      const cluster = feature?.properties?.cluster as number | undefined;
      if (cluster === originHubId) {
        return {
          fillColor: COLORS.BLUE,
          fillOpacity: 0.25,
          color: COLORS.BLUE,
          weight: 2,
        };
      }
      if (cluster === destHubId) {
        return {
          fillColor: COLORS.ORANGE,
          fillOpacity: 0.25,
          color: COLORS.ORANGE,
          weight: 2,
        };
      }
      return {
        fillColor: COLORS.GRAY_LIGHT,
        fillOpacity: 0.15,
        color: COLORS.GRAY_LIGHT,
        weight: 1,
      };
    };
  }, [originHubId, destHubId]);

  const hubMarkerColor = (hub: GeoJsonFeature<HubProperties>) => {
    if (hub.properties.hub_id === originHubId) return COLORS.BLUE;
    if (hub.properties.hub_id === destHubId) return COLORS.ORANGE;
    return COLORS.GRAY_LIGHT;
  };

  const hubMarkerRadius = (hub: GeoJsonFeature<HubProperties>) => {
    if (
      hub.properties.hub_id === originHubId ||
      hub.properties.hub_id === destHubId
    )
      return 8;
    return 5;
  };

  return (
    <BaseMap className="h-full min-h-100 w-full rounded-xl">
      <FitBoundsHelper
        hubs={hubs}
        originHubId={originHubId}
        destHubId={destHubId}
      />

      {/* Hub polygons */}
      {hubPolygons && (
        <GeoJSON
          key={`polygons-${originHubId}-${destHubId}`}
          data={hubPolygons as unknown as GeoJSON.GeoJsonObject}
          style={polygonStyle}
        />
      )}

      {/* Hub centroid markers */}
      {hubs?.features.map((hub) => (
        <CircleMarker
          key={hub.properties.hub_id}
          center={pointLatLng(hub)}
          radius={hubMarkerRadius(hub)}
          pathOptions={{
            fillColor: hubMarkerColor(hub),
            fillOpacity: 0.9,
            color: "#fff",
            weight: 2,
          }}
        >
          <Tooltip direction="top" offset={[0, -8]}>
            Hub {hub.properties.hub_id}
          </Tooltip>
        </CircleMarker>
      ))}

      {/* Selected route legs */}
      {selectedRoute && <RouteLegsLayer route={selectedRoute} arcGeometry={arcGeometry} />}
    </BaseMap>
  );
}
