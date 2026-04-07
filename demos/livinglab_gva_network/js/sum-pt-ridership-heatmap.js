/**
 * Ridership Heatmap Timeline Visualization
 *
 * Interactive ridership visualization with timeline controls for day-of-week,
 * hour-of-day, and metric selection (boardings/alightings/total).
 *
 * Architecture:
 * - RidershipDataManager: Data loading and indexing
 * - RidershipTimelineControl: UI controls (day/hour/metric selectors)
 * - RidershipHeatmapRenderer: Heatmap layer rendering
 * - RidershipMarkerRenderer: Stop marker layer with popups
 * - RidershipVisualization: Main orchestrator
 */

// ============================================================================
// DATA MANAGER - Single Responsibility: Data Loading & Indexing
// ============================================================================
class RidershipDataManager {
  constructor() {
    this.rawData = null;
    this.dataIndex = new Map(); // Key: "dayIndex_timeslot" -> Value: features array
    this.globalStats = {
      minBoardings: Infinity,
      maxBoardings: -Infinity,
      minAlightings: Infinity,
      maxAlightings: -Infinity,
      minTotal: Infinity,
      maxTotal: -Infinity,
    };
  }

  /**
   * Load ridership GeoJSON and build index
   * @param {string} path - Path to ridership.geojson
   */
  async load(path) {
    try {
      const response = await fetch(path + "ridership.geojson");
      this.rawData = await response.json();
      this._buildIndex();
      this._computeGlobalStats();
    } catch (error) {
      console.error("Failed to load ridership data:", error);
      throw error;
    }
  }

  /**
   * Build index for fast lookup by (day_index, timeslot)
   */
  _buildIndex() {
    this.rawData.features.forEach((feature) => {
      const { day_index, timeslot } = feature.properties;
      // Convert timeslot to float to handle both "8.0" and 8
      const timeslotNum = parseFloat(timeslot);
      const key = this._makeKey(day_index, timeslotNum);

      if (!this.dataIndex.has(key)) {
        this.dataIndex.set(key, []);
      }
      this.dataIndex.get(key).push(feature);
    });
    console.log(
      "Data index built. Sample keys:",
      Array.from(this.dataIndex.keys()).slice(0, 10),
    );
  }

  /**
   * Compute global min/max for normalization using percentile-based approach
   */
  _computeGlobalStats() {
    const boardingsValues = [];
    const alightingsValues = [];
    const totalValues = [];

    this.rawData.features.forEach((feature) => {
      const { boardings, alightings } = feature.properties;
      const total = boardings + alightings;

      boardingsValues.push(boardings);
      alightingsValues.push(alightings);
      totalValues.push(total);

      // Keep absolute min for reference
      this.globalStats.minBoardings = Math.min(
        this.globalStats.minBoardings,
        boardings,
      );
      this.globalStats.minAlightings = Math.min(
        this.globalStats.minAlightings,
        alightings,
      );
      this.globalStats.minTotal = Math.min(this.globalStats.minTotal, total);
    });

    // Use 95th percentile as max to ignore outliers (better heatmap distribution)
    this.globalStats.maxBoardings = this._percentile(boardingsValues, 95);
    this.globalStats.maxAlightings = this._percentile(alightingsValues, 95);
    this.globalStats.maxTotal = this._percentile(totalValues, 95);
  }

  _percentile(values, p) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Get features for specific day and timeslot
   * @param {number} dayIndex - 1=Monday, 7=Sunday
   * @param {number} timeslot - 0-23
   */
  getFeaturesForTime(dayIndex, timeslot) {
    const key = this._makeKey(dayIndex, timeslot);
    return this.dataIndex.get(key) || [];
  }

  /**
   * Normalize value to 0-1 range based on global stats
   */
  normalize(value, metric) {
    const min = this.globalStats[`min${this._capitalize(metric)}`];
    const max = this.globalStats[`max${this._capitalize(metric)}`];

    if (max === min) return 0.5;
    return (value - min) / (max - min);
  }

  _makeKey(dayIndex, timeslot) {
    return `${dayIndex}_${timeslot}`;
  }

  _capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// ============================================================================
// TIMELINE CONTROL - Single Responsibility: User Interface Controls
// ============================================================================
class RidershipTimelineControl extends L.Control {
  constructor(options = {}) {
    super({ position: "topright", ...options });
    this.state = {
      dayIndex: 1, // Monday
      timeslot: 8, // 8 AM
      metric: "total", // boardings | alightings | total
      showHeatmap: true, // heatmap visibility toggle
      showMarkers: true, // markers visibility toggle
    };
    this.callbacks = [];
    this.statsElement = null;
  }

  onAdd(map) {
    const container = L.DomUtil.create("div", "ridership-timeline-control");
    container.style.cssText = `
      background: white;
      padding: 12px;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      min-width: 280px;
      font-family: Arial, sans-serif;
    `;

    // Prevent map interactions when using controls
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);

    container.innerHTML = this._buildHTML();

    // Attach event listeners after DOM insertion
    // Use a slightly longer delay to ensure DOM is fully ready
    setTimeout(() => {
      console.log("Attaching event listeners to timeline control...");
      this._attachEventListeners(container);
    }, 100);

    return container;
  }

  _buildHTML() {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return `
      <div style="margin-bottom: 10px;">
        <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">
          📊 Ridership Timeline
        </h4>
      </div>

      <!-- Day Selector -->
      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 12px; margin-bottom: 4px; font-weight: 500;">
          Day of Week
        </label>
        <div class="day-buttons" style="display: flex; gap: 4px;">
          ${days
            .map(
              (day, idx) => `
            <button 
              class="day-btn" 
              data-day="${idx + 1}"
              style="
                flex: 1;
                padding: 6px 4px;
                font-size: 11px;
                border: 1px solid #ccc;
                background: ${idx + 1 === this.state.dayIndex ? "#004494" : "white"};
                color: ${idx + 1 === this.state.dayIndex ? "white" : "#333"};
                cursor: pointer;
                border-radius: 4px;
                font-weight: ${idx + 1 === this.state.dayIndex ? "600" : "400"};
              "
            >
              ${day}
            </button>
          `,
            )
            .join("")}
        </div>
      </div>

      <!-- Hour Slider -->
      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 12px; margin-bottom: 4px; font-weight: 500;">
          Hour: <span id="hour-label" style="font-weight: 600; color: #004494;">${this.state.timeslot}:00</span>
        </label>
        <input 
          type="range" 
          id="hour-slider" 
          min="0" 
          max="23" 
          value="${this.state.timeslot}"
          style="width: 100%; cursor: pointer;"
        />
        <div style="display: flex; justify-content: space-between; font-size: 10px; color: #666; margin-top: 2px;">
          <span>0:00</span>
          <span>12:00</span>
          <span>23:00</span>
        </div>
      </div>

      <!-- Metric Selector -->
      <div style="margin-bottom: 12px;">
        <label style="display: block; font-size: 12px; margin-bottom: 6px; font-weight: 500;">
          Metric
        </label>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          ${["boardings", "alightings", "total"]
            .map(
              (metric) => `
            <label style="display: flex; align-items: center; cursor: pointer; font-size: 12px;">
              <input 
                type="radio" 
                name="metric" 
                value="${metric}"
                ${metric === this.state.metric ? "checked" : ""}
                style="margin-right: 6px; cursor: pointer;"
              />
              <span style="text-transform: capitalize;">${metric}</span>
            </label>
          `,
            )
            .join("")}
        </div>
      </div>

      <!-- Heatmap Toggle -->
      <div style="margin-bottom: 8px; padding-top: 12px; border-top: 1px solid #ddd;">
        <label style="display: flex; align-items: center; cursor: pointer; font-size: 12px;">
          <input 
            type="checkbox" 
            id="show-heatmap" 
            ${this.state.showHeatmap ? "checked" : ""}
            style="margin-right: 6px; cursor: pointer;"
          />
          <span style="font-weight: 500;">🔥 Show Heatmap Overlay</span>
        </label>
      </div>

      <!-- Markers Toggle -->
      <div style="margin-bottom: 12px;">
        <label style="display: flex; align-items: center; cursor: pointer; font-size: 12px;">
          <input 
            type="checkbox" 
            id="show-markers" 
            ${this.state.showMarkers ? "checked" : ""}
            style="margin-right: 6px; cursor: pointer;"
          />
          <span style="font-weight: 500;">📍 Show Stop Markers</span>
        </label>
      </div>

      <!-- Color Legend -->
      <div style="margin-bottom: 12px; padding: 8px; background: #f9f9f9; border-radius: 4px;">
        <div style="font-size: 10px; color: #666; margin-bottom: 4px; font-weight: 500;">
          Intensity Scale
        </div>
        <div style="display: flex; height: 15px; border-radius: 3px; overflow: hidden; border: 1px solid #ddd;">
          <div style="flex: 1; background: #75BDFB;"></div>
          <div style="flex: 1; background: #98C33A;"></div>
          <div style="flex: 1; background: #FF632F;"></div>
          <div style="flex: 1; background: #FF3030;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 9px; color: #999; margin-top: 2px;">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>

      <!-- Current Stats -->
      <div id="ridership-stats" style="font-size: 10px; color: #666; padding: 8px; background: #f0f7ff; border-radius: 4px; border: 1px solid #cce5ff;">
        <div style="font-weight: 600; margin-bottom: 4px;">Current View:</div>
        <div>Stops: <span id="stats-stops">-</span></div>
        <div>Range: <span id="stats-range">-</span></div>
        <div>Average: <span id="stats-avg">-</span></div>
      </div>
    `;
  }

  _attachEventListeners(container) {
    // Day buttons
    const dayButtons = container.querySelectorAll(".day-btn");
    dayButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const dayIndex = parseInt(e.target.dataset.day);
        this._updateState({ dayIndex });
        this._updateDayButtons(container, dayIndex);
      });
    });

    // Hour slider
    const slider = container.querySelector("#hour-slider");
    const label = container.querySelector("#hour-label");
    if (slider && label) {
      slider.addEventListener("input", (e) => {
        const timeslot = parseInt(e.target.value);
        label.textContent = `${timeslot}:00`;
        this._updateState({ timeslot });
      });
    }

    // Metric radios
    const metricRadios = container.querySelectorAll('input[name="metric"]');
    metricRadios.forEach((radio) => {
      radio.addEventListener("change", (e) => {
        this._updateState({ metric: e.target.value });
      });
    });

    // Heatmap toggle
    const heatmapToggle = container.querySelector("#show-heatmap");
    if (heatmapToggle) {
      heatmapToggle.addEventListener("change", (e) => {
        this._updateState({ showHeatmap: e.target.checked });
      });
    }

    // Markers toggle
    const markersToggle = container.querySelector("#show-markers");
    if (markersToggle) {
      markersToggle.addEventListener("change", (e) => {
        this._updateState({ showMarkers: e.target.checked });
      });
    }

    // Store reference to stats element for updates
    this.statsElement = {
      stops: container.querySelector("#stats-stops"),
      range: container.querySelector("#stats-range"),
      avg: container.querySelector("#stats-avg"),
    };
  }

  updateStats(features, metric) {
    if (!this.statsElement || !this.statsElement.stops) return;

    if (features.length === 0) {
      this.statsElement.stops.textContent = "0";
      this.statsElement.range.textContent = "N/A";
      this.statsElement.avg.textContent = "N/A";
      return;
    }

    const values = features.map((f) => {
      const { boardings, alightings } = f.properties;
      if (metric === "boardings") return boardings;
      if (metric === "alightings") return alightings;
      return boardings + alightings;
    });

    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

    this.statsElement.stops.textContent = features.length;
    this.statsElement.range.textContent = `${min.toLocaleString()} - ${max.toLocaleString()}`;
    this.statsElement.avg.textContent = avg.toLocaleString();
  }

  _updateDayButtons(container, activeDayIndex) {
    container.querySelectorAll(".day-btn").forEach((btn) => {
      const dayIndex = parseInt(btn.dataset.day);
      const isActive = dayIndex === activeDayIndex;
      btn.style.background = isActive ? "#004494" : "white";
      btn.style.color = isActive ? "white" : "#333";
      btn.style.fontWeight = isActive ? "600" : "400";
    });
  }

  _updateState(changes) {
    this.state = { ...this.state, ...changes };
    this._notifyChange();
  }

  _notifyChange() {
    console.log(
      "Notifying",
      this.callbacks.length,
      "callbacks of state change",
    );
    this.callbacks.forEach((cb) => cb(this.state));
  }

  onChange(callback) {
    this.callbacks.push(callback);
  }

  getState() {
    return { ...this.state };
  }
}

// ============================================================================
// HEATMAP RENDERER - Single Responsibility: Heatmap Layer Management
// ============================================================================
class RidershipHeatmapRenderer {
  constructor(map, dataManager) {
    this.map = map;
    this.dataManager = dataManager;
    this.heatLayer = null;
  }

  /**
   * Update heatmap for given timeline state
   */
  update(state) {
    const { dayIndex, timeslot, metric, showHeatmap } = state;
    const features = this.dataManager.getFeaturesForTime(dayIndex, timeslot);

    // Remove existing layer
    if (this.heatLayer) {
      this.map.removeLayer(this.heatLayer);
    }

    // Skip creating heatmap if toggle is off
    if (!showHeatmap) {
      return;
    }

    // Build heat data array with exponential scaling for better visibility
    const heatData = features
      .map((feature) => {
        const { boardings, alightings } = feature.properties;
        const coords = feature.geometry.coordinates;

        let value;
        if (metric === "boardings") value = boardings;
        else if (metric === "alightings") value = alightings;
        else value = boardings + alightings;

        // Normalize to 0-1 using percentile-based bounds
        const intensity = this.dataManager.normalize(value, metric);

        // Apply exponential scaling to emphasize differences
        const scaledIntensity = Math.pow(intensity, 0.6);

        return [coords[1], coords[0], scaledIntensity]; // [lat, lon, intensity]
      })
      .filter(([lat, lon, intensity]) => intensity > 0);

    // Create new heatmap layer with enhanced configuration
    if (heatData.length > 0) {
      this.heatLayer = L.heatLayer(heatData, {
        radius: 45, // Increased from 25 for better visibility
        blur: 30, // Increased from 20 for smoother gradient
        maxZoom: 13, // Lowered from 17 to keep heatmap visible at city-wide zoom
        minOpacity: 0.3, // Minimum opacity to ensure visibility
        max: 1.0,
        gradient: {
          0.0: "#75BDFB", // Blue light
          0.4: "#98C33A", // Green
          0.7: "#FF632F", // Orange
          1.0: "#FF3030", // Red
        },
      });
      this.heatLayer.addTo(this.map);
    } else {
      console.warn("No heat data to display for this time period");
    }
  }

  remove() {
    if (this.heatLayer) {
      this.map.removeLayer(this.heatLayer);
      this.heatLayer = null;
    }
  }
}

// ============================================================================
// MARKER RENDERER - Single Responsibility: Stop Marker Layer Management
// ============================================================================
class RidershipMarkerRenderer {
  constructor(map, dataManager) {
    this.map = map;
    this.dataManager = dataManager;
    this.markerLayer = L.layerGroup();
    this.markerCache = new Map(); // Key: stop_code -> marker
  }

  /**
   * Initialize marker layer (call once)
   */
  initialize() {
    this.markerLayer.addTo(this.map);
  }

  /**
   * Update markers for given timeline state
   */
  update(state) {
    const { dayIndex, timeslot, metric, showMarkers } = state;
    const features = this.dataManager.getFeaturesForTime(dayIndex, timeslot);

    // Clear existing markers
    this.markerLayer.clearLayers();

    // Skip creating markers if toggle is off
    if (!showMarkers) {
      return;
    }

    // Create/update markers
    features.forEach((feature) => {
      const { stop_code, stop_name, boardings, alightings } =
        feature.properties;
      const coords = feature.geometry.coordinates;
      const total = boardings + alightings;

      // Create marker with custom icon
      const marker = L.marker([coords[1], coords[0]], {
        icon: this._createIcon(metric, boardings, alightings, total),
      });

      // Build popup content
      const popupContent = this._buildPopup(
        stop_name,
        stop_code,
        boardings,
        alightings,
        total,
        metric,
      );
      marker.bindPopup(popupContent);

      // Add to layer
      marker.addTo(this.markerLayer);
    });

    console.log("Added", features.length, "markers to map");
  }

  _createIcon(metric, boardings, alightings, total) {
    // Use color intensity based on selected metric
    let value;
    if (metric === "boardings") value = boardings;
    else if (metric === "alightings") value = alightings;
    else value = total;

    const intensity = this.dataManager.normalize(value, metric);
    const color = this._getColorForIntensity(intensity);

    const size = 24;
    const html = `
      <div style="
        background: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: ${size}px ${size}px 0 ${size}px;
        transform: rotate(45deg);
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          transform: rotate(-45deg);
          font-size: 14px;
        ">🔀</span>
      </div>
    `;

    return L.divIcon({
      className: "ridership-marker",
      html,
      iconSize: [size, size],
      iconAnchor: [size / 2, size * 0.9],
    });
  }

  _getColorForIntensity(intensity) {
    if (intensity < 0.25) return "#75BDFB"; // Blue light
    if (intensity < 0.5) return "#98C33A"; // Green
    if (intensity < 0.75) return "#FF632F"; // Orange
    return "#FF3030"; // Red
  }

  _buildPopup(
    stopName,
    stopCode,
    boardings,
    alightings,
    total,
    selectedMetric,
  ) {
    const highlightStyle = (metric) =>
      metric === selectedMetric ? "background: #fffacd; font-weight: 600;" : "";

    return `
      <div style="font-family: Arial, sans-serif; font-size: 12px; min-width: 200px;">
        <h4 style="margin: 0 0 8px 0; font-size: 14px; border-bottom: 2px solid #004494; padding-bottom: 4px;">
          ${stopName}
        </h4>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; color: #666;">Stop Code:</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 600;">${stopCode}</td>
          </tr>
          <tr style="${highlightStyle("boardings")}">
            <td style="padding: 4px 0;">🟢 Boardings:</td>
            <td style="padding: 4px 0; text-align: right;">${boardings.toLocaleString()}</td>
          </tr>
          <tr style="${highlightStyle("alightings")}">
            <td style="padding: 4px 0;">🔴 Alightings:</td>
            <td style="padding: 4px 0; text-align: right;">${alightings.toLocaleString()}</td>
          </tr>
          <tr style="border-top: 1px solid #ddd; ${highlightStyle("total")}">
            <td style="padding: 4px 0; font-weight: 600;">Total:</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 600;">${total.toLocaleString()}</td>
          </tr>
        </table>
      </div>
    `;
  }

  remove() {
    this.markerLayer.clearLayers();
    this.map.removeLayer(this.markerLayer);
  }
}

// ============================================================================
// MAIN ORCHESTRATOR - Coordinates all components
// ============================================================================
class RidershipVisualization {
  constructor() {
    this.map = null;
    this.dataManager = new RidershipDataManager();
    this.control = null;
    this.heatmapRenderer = null;
    this.markerRenderer = null;
    this.layerGroup = L.layerGroup();
  }

  /**
   * Initialize visualization
   * @param {string} datasetPath - Path to dataset directory
   */
  async initialize(datasetPath) {
    try {
      // Wait for shared map
      this.map =
        await SumPublicTransportNewSharedModesNetwork.waitForSharedMap();

      // Load ridership data
      await this.dataManager.load(datasetPath);

      // Initialize renderers
      this.heatmapRenderer = new RidershipHeatmapRenderer(
        this.map,
        this.dataManager,
      );
      this.markerRenderer = new RidershipMarkerRenderer(
        this.map,
        this.dataManager,
      );
      this.markerRenderer.initialize();

      // Create timeline control
      this.control = new RidershipTimelineControl();
      this.control.addTo(this.map);

      // Wire up event handlers
      this.control.onChange((state) => {
        this._onTimelineChange(state);
      });

      // Initial render
      this._onTimelineChange(this.control.getState());
    } catch (error) {
      console.error("Failed to initialize ridership visualization:", error);
      throw error;
    }
  }

  _onTimelineChange(state) {
    // Get features for current state to update stats
    const features = this.dataManager.getFeaturesForTime(
      state.dayIndex,
      state.timeslot,
    );

    // Update stats in control panel
    if (this.control && this.control.updateStats) {
      this.control.updateStats(features, state.metric);
    }

    // Update renderers
    this.heatmapRenderer.update(state);
    this.markerRenderer.update(state);
  }

  /**
   * Remove visualization from map
   */
  remove() {
    if (this.control) this.map.removeControl(this.control);
    if (this.heatmapRenderer) this.heatmapRenderer.remove();
    if (this.markerRenderer) this.markerRenderer.remove();
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Initialize ridership heatmap visualization
 * @param {string} datasetPath - Path to dataset directory
 * @returns {Promise<RidershipVisualization>}
 */
async function initializeRidershipHeatmap(datasetPath) {
  const viz = new RidershipVisualization();
  await viz.initialize(datasetPath);
  return viz;
}

// Export for use in other scripts
// Expose global API
if (typeof window !== "undefined") {
  window.RidershipVisualization = RidershipVisualization;
  window.initializeRidershipHeatmap = initializeRidershipHeatmap;
}
