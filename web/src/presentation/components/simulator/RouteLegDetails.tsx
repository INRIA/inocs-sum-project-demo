/**
 * Presentation: expanded leg-by-leg details for a selected route.
 */

import type { RouteLeg } from "../../../domain/simulator";
import { assetUrl } from "../../../infrastructure/assetUrl";
import {
  MODE_ICON,
  MODE_LABEL,
  MODE_COLOR,
  formatDuration,
  formatDistance,
} from "../../lib/simulatorUtils";

interface Props {
  legs: RouteLeg[];
}

export default function RouteLegDetails({ legs }: Props) {
  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="relative pl-6">
        {/* Vertical connector line */}
        <div
          className="absolute left-[11px] top-2 bottom-2 w-0.5"
          style={{ backgroundColor: "#dadada" }}
        />

        {legs.map((leg, i) => (
          <div key={i} className="relative flex items-start gap-3 pb-3 last:pb-0">
            {/* Dot on the connector */}
            <div
              className="absolute -left-6 top-1 h-[10px] w-[10px] rounded-full border-2 border-white"
              style={{ backgroundColor: MODE_COLOR[leg.mode] }}
            />

            {/* Leg content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <img
                  src={assetUrl(`assets/svg/${MODE_ICON[leg.mode]}`)}
                  alt={MODE_LABEL[leg.mode]}
                  className="h-4 w-4 shrink-0"
                />
                <span className="text-sm font-medium text-text">
                  {MODE_LABEL[leg.mode]}
                </span>
                {leg.line_publicCode.publicCode && (
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                    Line {leg.line_publicCode.publicCode}
                  </span>
                )}
                <span className="ml-auto text-xs text-muted">
                  {formatDuration(leg.duration_s)} · {formatDistance(leg.distance_m)}
                </span>
              </div>

              <p className="mt-0.5 text-xs text-muted truncate">
                {leg.from_place} → {leg.to_place}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
