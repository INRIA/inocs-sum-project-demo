/**
 * Presentation: container component for the dynamic pricing user simulator.
 *
 * Orchestrates OD selection, route fetching, route list, and map display.
 */

import { useState, useCallback, useEffect } from "react";
import type { DynamicPricingVariant } from "../../../domain/dynamicPricing";
import {
  useHubs,
  useHubPolygons,
  useStationsHub,
  useHubOptions,
  useODRoutes,
  useCurrency,
  useArcGeometry,
} from "../../../application/hooks/useSimulatorData";
import LoadingSpinner from "../shared/LoadingSpinner";
import ODSelector from "./ODSelector";
import RouteMap from "./RouteMap";
import RouteList from "./RouteList";

interface Props {
  variant: DynamicPricingVariant;
}

export default function DynamicPricingUserSimulator({ variant }: Props) {
  const { data: hubs, loading: hubsLoading } = useHubs(variant);
  const { data: hubPolygons } = useHubPolygons(variant);
  const { data: stationsHub } = useStationsHub(variant);
  const { data: currency } = useCurrency(variant);
  const hubOptions = useHubOptions(hubs, stationsHub);

  const [originHubId, setOriginHubId] = useState<number | null>(null);
  const [destHubId, setDestHubId] = useState<number | null>(null);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState<number | null>(null);

  const {
    data: odData,
    loading: routesLoading,
    error: routesError,
    search,
  } = useODRoutes(variant);

  // Reset state when variant changes
  useEffect(() => {
    setOriginHubId(null);
    setDestHubId(null);
    setSelectedRouteIdx(null);
  }, [variant]);

  // Reset selected route when new OD data loads
  useEffect(() => {
    setSelectedRouteIdx(null);
  }, [odData]);

  const handleSearch = useCallback(() => {
    if (originHubId !== null && destHubId !== null) {
      search(originHubId, destHubId);
    }
  }, [originHubId, destHubId, search]);

  const selectedRoute =
    odData && selectedRouteIdx !== null
      ? (odData.routes[selectedRouteIdx] ?? null)
      : null;

  const { data: arcGeometry } = useArcGeometry(
    variant,
    originHubId,
    destHubId,
    selectedRoute?.arc_id ?? null,
  );

  if (hubsLoading) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8">
        <LoadingSpinner message="Loading hub data..." />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface">
      {/* Title bar */}
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-base font-bold text-text">User Simulator</h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 p-4">
        {/* Left: Map */}
        <div className="lg:w-1/3 grid grid-cols-1 gap-y-4 content-start">
          <ODSelector
            hubOptions={hubOptions}
            originHubId={originHubId}
            destHubId={destHubId}
            onOriginChange={setOriginHubId}
            onDestChange={setDestHubId}
            onSearch={handleSearch}
            loading={routesLoading}
          />
          {/* Routes results */}
          {routesLoading && <LoadingSpinner message="Loading routes..." />}

          {routesError && (
            <div className="rounded-lg border border-border bg-white p-4 text-center text-sm text-muted">
              No routes available for this origin-destination pair.
            </div>
          )}

          {odData && !routesLoading && (
            <RouteList
              routes={odData.routes}
              demand={odData.demand}
              currency={currency ?? "CHF"}
              selectedRouteIdx={selectedRouteIdx}
              onSelectRoute={setSelectedRouteIdx}
            />
          )}
        </div>

        {/* Right: Controls + Routes */}
        <div className="lg:w-2/3 flex flex-col gap-4">
          <div className="min-h-[400px] lg:min-h-[600px]">
            <RouteMap
              hubs={hubs}
              hubPolygons={hubPolygons}
              originHubId={originHubId}
              destHubId={destHubId}
              selectedRoute={selectedRoute}
              arcGeometry={arcGeometry ?? null}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
