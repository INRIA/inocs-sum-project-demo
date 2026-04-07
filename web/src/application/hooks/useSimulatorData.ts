/**
 * Application: hooks for the dynamic pricing simulator.
 */

import { useMemo, useState, useCallback } from "react";
import type { DynamicPricingVariant } from "../../domain/dynamicPricing";
import type {
  HubsFeatureCollection,
  StationsHubFeatureCollection,
  ODRouteData,
  ArcGeometry,
} from "../../domain/simulator";
import {
  simulatorRepository,
  dynamicPricingOptimizationRepository,
} from "../../infrastructure/dataRepository";
import { useData } from "./useData";

// ── Static data hooks (loaded once per variant) ─────────────────────────────

export function useHubs(variant: DynamicPricingVariant) {
  const loader = useMemo(
    () => () => simulatorRepository.fetchHubs(variant),
    [variant],
  );
  return useData(loader);
}

export function useHubPolygons(variant: DynamicPricingVariant) {
  const loader = useMemo(
    () => () => simulatorRepository.fetchHubPolygons(variant),
    [variant],
  );
  return useData(loader);
}

export function useStationsHub(variant: DynamicPricingVariant) {
  const loader = useMemo(
    () => () => simulatorRepository.fetchStationsHub(variant),
    [variant],
  );
  return useData(loader);
}

export function useCurrency(variant: DynamicPricingVariant) {
  const loader = useMemo(
    () => () =>
      dynamicPricingOptimizationRepository
        .fetchMetrics(variant)
        .then((d) => d.instance_config.currency ?? "CHF"),
    [variant],
  );
  return useData(loader);
}

// ── Hub labels: build hub_id → display label from station names ─────────────

export interface HubOption {
  hubId: number;
  label: string;
}

export function useHubOptions(
  hubs: HubsFeatureCollection | null,
  stationsHub: StationsHubFeatureCollection | null,
): HubOption[] {
  return useMemo(() => {
    if (!hubs || !stationsHub) return [];

    // Group station names by hub_id
    const namesByHub = new Map<number, string[]>();
    for (const f of stationsHub.features) {
      const { hub_id, name } = f.properties;
      if (!namesByHub.has(hub_id)) namesByHub.set(hub_id, []);
      namesByHub.get(hub_id)!.push(name);
    }

    // Build options: use unique sorted station names as label
    const options: HubOption[] = hubs.features.map((f) => {
      const hubId = f.properties.hub_id;
      const names = namesByHub.get(hubId) ?? [];
      const uniqueNames = [...new Set(names)].sort();
      const label =
        uniqueNames.length > 0
          ? uniqueNames.slice(0, 3).join(", ") +
            (uniqueNames.length > 3 ? "..." : "")
          : `Hub ${hubId}`;
      return { hubId, label };
    });

    // Sort alphabetically by label
    options.sort((a, b) => a.label.localeCompare(b.label));
    return options;
  }, [hubs, stationsHub]);
}

// ── OD Routes: fetched on demand ────────────────────────────────────────────

export interface UseODRoutesResult {
  data: ODRouteData | null;
  loading: boolean;
  error: Error | null;
  search: (originId: number, destId: number) => void;
}

export function useODRoutes(
  variant: DynamicPricingVariant,
): UseODRoutesResult {
  const [query, setQuery] = useState<{
    originId: number;
    destId: number;
  } | null>(null);

  const loader = useMemo(() => {
    if (!query) return () => Promise.resolve(null);
    return () =>
      simulatorRepository.fetchODRoutes(variant, query.originId, query.destId);
  }, [variant, query]);

  const { data, loading, error } = useData(loader);

  const search = useCallback(
    (originId: number, destId: number) => {
      setQuery({ originId, destId });
    },
    [],
  );

  return { data, loading: query !== null && loading, error, search };
}

// ── Arc geometry: fetched on demand ─────────────────────────────────────────

export function useArcGeometry(
  variant: DynamicPricingVariant,
  originHubId: number | null,
  destHubId: number | null,
  arcId: string | null,
) {
  const loader = useMemo(() => {
    if (originHubId === null || destHubId === null || arcId === null)
      return () => Promise.resolve(null);
    return () =>
      simulatorRepository
        .fetchArcGeometry(variant, originHubId, destHubId, arcId)
        .catch(() => null);
  }, [variant, originHubId, destHubId, arcId]);

  return useData<ArcGeometry | null>(loader);
}
