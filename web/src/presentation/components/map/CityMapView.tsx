/**
 * Presentation: CityMapView
 *
 * Client-side React island that composes all city-map layers.
 * Provides the DatasetSelector to switch radius variants and toggles for each layer.
 */
import { useState } from "react";
import type { DatasetVariant } from "../../../domain/transit";
import DatasetSelector from "../shared/DatasetSelector";
import BaseMap from "./BaseMap";
import TransitLayer from "./TransitLayer";
import BikeStationsLayer from "./BikeStationsLayer";
import GridLayer from "./GridLayer";
import HeatmapLayer from "./HeatmapLayer";

export default function CityMapView() {
  const [variant, setVariant] = useState<DatasetVariant>("1km");
  const [showBikes, setShowBikes] = useState(true);
  const [showGrid, setShowGrid] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-2 bg-foreground/90 border-b border-border">
        <DatasetSelector value={variant} onChange={setVariant} />
        <div className="flex items-center gap-3 text-xs text-text ml-auto">
          <label className="flex items-center gap-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showBikes}
              onChange={(e) => setShowBikes(e.target.checked)}
              className="accent-accent"
            />
            🚲 Bike stations
          </label>
          <label className="flex items-center gap-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="accent-primary"
            />
            ⬡ Hex grid
          </label>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative min-h-0">
        <BaseMap className="absolute inset-0  min-h-[800px]">
          <TransitLayer variant={variant} />
          {showBikes && <BikeStationsLayer variant={variant} />}
          {showGrid && <GridLayer variant={variant} />}
          <HeatmapLayer variant={variant} />
        </BaseMap>
      </div>
    </div>
  );
}
