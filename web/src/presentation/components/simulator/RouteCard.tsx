/**
 * Presentation: a single route alternative card.
 *
 * Shows mode icons, price, duration, and walking time.
 * Highlighted with green border when it is the simulated choice.
 * Expands to show leg details when selected.
 */

import type { ODRoute } from "../../../domain/simulator";
import { assetUrl } from "../../../infrastructure/assetUrl";
import {
  MODE_ICON,
  MODE_LABEL,
  getRouteModes,
  getRouteLabel,
  getPriceLabel,
  getWalkingTime,
  formatDuration,
  formatPrice,
  isSimulatedChoice,
} from "../../lib/simulatorUtils";
import { COLORS } from "../../lib/colors";
import RouteLegDetails from "./RouteLegDetails";

interface Props {
  route: ODRoute;
  isSelected: boolean;
  currency: string;
  onClick: () => void;
}

export default function RouteCard({
  route,
  isSelected,
  currency,
  onClick,
}: Props) {
  const chosen = isSimulatedChoice(route);
  const modes = getRouteModes(route.legs);
  const walkSec = getWalkingTime(route.legs);

  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer rounded-xl border p-4 transition-shadow hover:shadow-md ${
        isSelected ? "ring-2 ring-primary/30" : ""
      }`}
      style={{
        borderColor: chosen ? COLORS.GREEN : "#e0e0e0",
        borderWidth: chosen ? 2 : 1,
      }}
    >
      {/* Simulated choice badge */}
      {chosen && (
        <span
          className="absolute -top-2.5 right-3 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
          style={{ backgroundColor: COLORS.GREEN }}
        >
          Simulated Choice
        </span>
      )}

      {/* Top row: mode icons + price */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1.5">
          {/* Show FOOT icon if route is walk-only, otherwise show transport modes */}
          {modes.length === 0 ? (
            <img
              src={assetUrl(`assets/svg/${MODE_ICON.FOOT}`)}
              alt="Walk"
              className="h-5 w-5"
            />
          ) : (
            modes.map((mode, i) => (
              <span key={mode} className="flex items-center gap-1">
                {i > 0 && (
                  <span className="text-xs text-muted">+</span>
                )}
                <img
                  src={assetUrl(`assets/svg/${MODE_ICON[mode]}`)}
                  alt={MODE_LABEL[mode]}
                  className="h-5 w-5"
                />
              </span>
            ))
          )}
        </div>

        <div className="text-right">
          <div className="text-lg font-bold text-text">
            {route.optimization && formatPrice(route.optimization?.["Total Price"], currency)}
          </div>
          <div className="text-[11px] text-muted">{getPriceLabel(route)}</div>
        </div>
      </div>

      {/* Route label + duration */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-medium text-text">
          {getRouteLabel(route)}
        </span>
        <span className="text-sm font-semibold text-text">
          {formatDuration(route.total_travel_time_s)}
        </span>
      </div>

      {/* Metrics row */}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        {(route.optimization?.Transfers ?? 0) > 0 && (
          <span>
            {route.optimization!.Transfers} transfer{route.optimization!.Transfers > 1 ? "s" : ""}
          </span>
        )}
        {walkSec > 0 && <span>{formatDuration(walkSec)} walk</span>}
        {route.type === "PT+Bike" && (route.optimization?.["Bike Time"] ?? 0) > 0 && (
          <span>{route.optimization!["Bike Time"]} min bike</span>
        )}
      </div>

      {/* Expanded leg details */}
      {isSelected && <RouteLegDetails legs={route.legs} />}
    </div>
  );
}
