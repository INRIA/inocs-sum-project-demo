/**
 * Presentation: origin/destination hub selector with Search button.
 */

import type { HubOption } from "../../../application/hooks/useSimulatorData";

interface Props {
  hubOptions: HubOption[];
  originHubId: number | null;
  destHubId: number | null;
  onOriginChange: (id: number | null) => void;
  onDestChange: (id: number | null) => void;
  onSearch: () => void;
  loading?: boolean;
}

export default function ODSelector({
  hubOptions,
  originHubId,
  destHubId,
  onOriginChange,
  onDestChange,
  onSearch,
  loading = false,
}: Props) {
  const canSearch =
    originHubId !== null &&
    destHubId !== null &&
    originHubId !== destHubId &&
    !loading;

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Origin */}
      <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
        <label className="text-xs font-medium text-muted" htmlFor="sim-origin">
          Origin
        </label>
        <select
          id="sim-origin"
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={originHubId ?? ""}
          onChange={(e) =>
            onOriginChange(e.target.value ? Number(e.target.value) : null)
          }
        >
          <option value="">Select origin...</option>
          {hubOptions.map((h) => (
            <option key={h.hubId} value={h.hubId}>
              {h.label} [{h.hubId}]
            </option>
          ))}
        </select>
      </div>

      {/* Destination */}
      <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
        <label className="text-xs font-medium text-muted" htmlFor="sim-dest">
          Destination
        </label>
        <select
          id="sim-dest"
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={destHubId ?? ""}
          onChange={(e) =>
            onDestChange(e.target.value ? Number(e.target.value) : null)
          }
        >
          <option value="">Select destination...</option>
          {hubOptions.map((h) => (
            <option key={h.hubId} value={h.hubId}>
              {h.label} [{h.hubId}]
            </option>
          ))}
        </select>
      </div>

      {/* Search button */}
      <button
        onClick={onSearch}
        disabled={!canSearch}
        className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "Searching..." : "Search"}
      </button>
    </div>
  );
}
