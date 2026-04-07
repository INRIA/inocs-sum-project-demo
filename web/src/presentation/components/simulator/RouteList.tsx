/**
 * Presentation: scrollable list of route alternatives for an OD pair.
 */

import { useMemo } from "react";
import type { ODRoute } from "../../../domain/simulator";
import RouteCard from "./RouteCard";

interface Props {
  routes: ODRoute[];
  demand: number;
  currency: string;
  selectedRouteIdx: number | null;
  onSelectRoute: (idx: number) => void;
}

export default function RouteList({
  routes,
  demand,
  currency,
  selectedRouteIdx,
  onSelectRoute,
}: Props) {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-baseline justify-between pb-3">
        <h3 className="text-lg font-bold text-text">Available Routes</h3>
        <span className="text-xs text-muted">
          Sorted by Utility · {demand} travelers
        </span>
      </div>

      {/* Route cards */}
      <div className="flex flex-col gap-3 overflow-y-auto max-h-[600px] pr-1">
        {routes.map((route, idx) => (
          <RouteCard
            key={route.arc_id}
            route={route}
            currency={currency}
            isSelected={selectedRouteIdx === idx}
            onClick={() => onSelectRoute(idx)}
          />
        ))}
      </div>
    </div>
  );
}
