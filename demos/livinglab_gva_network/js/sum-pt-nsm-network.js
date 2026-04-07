const TransitTypeMap = {
  0: "Tram/Light rail",
  1: "Subway/Metro",
  2: "Rail",
  3: "Bus",
  4: "Ferry",
  5: "Cable tram",
  6: "Aerial lift",
  7: "Funicular",
  11: "Trolleybus",
  12: "Monorail",
};
//Constants
const COLORS = {
  GREEN: "#98C33A",
  BLUE: "#004494",
  ORANGE: "#FF632F",
  RED: "#FF3030",
  BLUE_LIGHT: "#75BDFB",
  GRAY: "#606060",
  GRAY_LIGHT: "#DADADA",
  WHITE: "#FFFFFF",
};
const MAX_RADIUS = 0.05 * 8; // Maximum radius for circle markers

class SumPublicTransportNewSharedModesNetwork extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Container setup
    const wrapper = document.createElement("div");
    wrapper.style.height = "100%";
    wrapper.innerHTML = `<div id="map" tabindex="0" aria-label="Map showing network" style="height:100%"></div>`;
    this.shadowRoot.append(wrapper);
    this.initStyles();

    // Leaflet map instance (shared externally once initialized)
    this.map = null;
    // Internal promise to signal when map is ready (tile layer added)
    this._mapReadyResolve = null;
    this.mapReady = new Promise((resolve) => (this._mapReadyResolve = resolve));
    this.datasetPath = null;
    this.periodLayers = {};
    this.layers = {
      stops: null,
      bikeStations: null,
      grid: null,
      itineraries: null,
      trips: null,
      ridership: null,
      mobilityHeatmap: null,
      mobilityHeatmapMarkers: null,
    };
  }

  // Build lightweight emoji-based map pin
  // color: HEX background, emoji: character (🚲, 🚌, 🔀), sizePx: diameter
  getEmojiPin(color, emoji, sizePx = 30) {
    const d = sizePx;
    const html = `
      <span style="background:${color};width:${d}px;height:${d}px;display:block;position:relative;left:-${
        d / 2
      }px;top:-${
        d / 2
      }px;border-radius:${d}px ${d}px 0 ${d}px;transform:rotate(45deg);border:1px solid #FFFFFF;text-align:center;line-height:${d}px;font-size:${Math.round(
        d * 0.65,
      )}px;color:#fff;font-weight:600;box-shadow:0 1px 3px rgba(0,0,0,0.35);">
        <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);pointer-events:none;">${emoji}</span>
      </span>`;
    return L.divIcon({
      className: "sum-emoji-pin",
      iconAnchor: [0, d * 0.9],
      html,
    });
  }

  static get observedAttributes() {
    return ["datasetpath"];
  }

  connectedCallback() {
    this.initializeMap();
    this.datasetPath = this.getAttribute("datasetpath");
    if (this.datasetPath) {
      this.loadData(this.datasetPath);
    }
  }

  initStyles() {
    // Add styles to shadow DOM
    const style = document.createElement("style");
    style.textContent = `
      .station-label {
        text-align: center;
        font-size: 12px;
        line-height: 12px;
        align-items: center;
        justify-content: center;
        width: 100%;
        display: flex;
        flex-direction: column;
      }
      .quantity-label {
        font-size: 12px;
        color: black;
        text-align: center;
        width: "100%";
        height: "100%";
      }
      .parameters-box {
        background-color: white;
        padding: 10px;
        border-radius: 5px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
      }
      .station-icon {
        background-color: ${COLORS.BLUE_LIGHT};
        border-radius: 50%;
        padding: 5px;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
      }
      .bikestation-icon {
        background-color: ${COLORS.ORANGE};
        border-radius: 50%;
        padding: 5px;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
      }
      .transfer-icon {
        background-color: ${COLORS.BLUE};
        border-radius: 50%;
        padding: 5px;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
      }
    `;
    this.shadowRoot.appendChild(style);

    const link = document.createElement("link");
    link.setAttribute("rel", "stylesheet");
    link.setAttribute(
      "href",
      "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
    );

    this.shadowRoot.appendChild(link);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "datasetpath" && newValue !== oldValue) {
      this.datasetPath = newValue;
      if (this.map) {
        this.resetMap();
        this.loadData(this.datasetPath);
      }
    }
  }

  initializeMap() {
    this.map = L.map(this.shadowRoot.getElementById("map")).setView(
      [46.202778, 6.15],
      15,
    );
    // add the OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      //maxZoom: 2,
      attribution:
        '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    }).addTo(this.map);

    // Expose globally & emit event once ready
    window.__SUM_SHARED_MAP = this.map;
    if (this._mapReadyResolve) this._mapReadyResolve(this.map);
    const evt = new CustomEvent("sum-map-ready", {
      detail: { map: this.map, element: this },
    });
    window.dispatchEvent(evt);
  }

  initLayers() {
    this.layers.stops?.addTo(this.map);
    this.layers.itineraries?.addTo(this.map);
    //this.layers.grid?.addTo(this.map);
    this.layers.bikeStations?.addTo(this.map);
    this.layers.trips?.addTo(this.map);
    //this.layers.ridership?.addTo(this.map);
    //this.layers.mobilityHeatmap?.addTo(this.map);
    //this.layers.mobilityHeatmapMarkers?.addTo(this.map);
  }

  addControls() {
    const validLayers = Object.keys(this.layers).filter(
      (layer) => this.layers[layer] !== null,
    );
    if (validLayers.length === 0) {
      console.warn("No layers available");
      return;
    }
    const layerControl = validLayers.reduce((acc, layer) => {
      acc[layer] = this.layers[layer];
      return acc;
    }, {});
    if (Object.keys(this.periodLayers).length === 0) {
      console.warn("No period layers available");
      L.control
        .layers(undefined, layerControl, { collapsed: false })
        .addTo(this.map);
      return;
    }
    const periodLayersControl = Object.keys(this.periodLayers).reduce(
      (acc, period) => {
        acc[`Period ${period}`] = this.periodLayers[period].staticLayer;
        return acc;
      },
      {},
    );
    L.control
      .layers(periodLayersControl, layerControl, { collapsed: false })
      .addTo(this.map);
  }

  addParametersBox(path) {
    return fetch(path + "tunable_parameters.json")
      .then((res) => res.json())
      .then((data) => {
        const infoBox = L.control({ position: "bottomright" });
        infoBox.onAdd = function () {
          const div = L.DomUtil.create("div", "parameters-box");
          div.innerHTML =
            "<h4>Simulation Parameters</h4>" +
            "<ul style='padding-left: 10px; font-size: 10px;'>" +
            Object.entries(data)
              .map(
                ([key, value]) =>
                  `<li style="white-space: wrap;max-width: 200px;"><strong>${key}:</strong> ${
                    Array.isArray(value) || typeof value === "object"
                      ? JSON.stringify(value)
                      : value
                  }</li>`,
              )
              .join("") +
            "</ul>";
          return div;
        };
        infoBox.addTo(this.map);
      })
      .catch((err) => {
        console.error("Failed to load tunable parameters:", err);
      });
  }

  resetMap() {
    Object.values(this.layers).forEach((layer) => layer.clearLayers());
    Object.values(this.periodLayers).forEach((period) => {
      this.map.removeLayer(period.staticLayer);
    });
    this.periodLayers = {};
  }

  loadData(path) {
    const fetchPromises = [
      this._loadStops(path),
      this._loadItineraries(path),
      this._loadBikeStations(path),
      this._loadTrips(path),
      this._loadHexGrid(path),
      this.addParametersBox(path),
    ];

    return Promise.all(fetchPromises).then(() => {
      this.addControls();
      this.initLayers();
    });
  }

  // =========================================================================
  // PRIVATE DATA LOADING METHODS
  // =========================================================================

  _loadStops(path) {
    let gridBounds = [];

    return fetch(path + "stops.geojson")
      .then((res) => res.json())
      .then((data) => {
        if (!this.layers.stops) {
          this.layers.stops = L.layerGroup();
        }

        data.features.forEach((feature) => {
          const [x, y] = feature.geometry.coordinates;
          const { stop_name } = feature.properties;

          const label = L.marker([y, x], {
            icon: this.getEmojiPin(COLORS.BLUE_LIGHT, "🚌"),
          });
          const popup = `<strong>${stop_name}</strong><br/>`;
          label.bindPopup(popup);
          label.addTo(this.layers.stops);
        });

        if (gridBounds.length) {
          this.map.fitBounds(gridBounds);
        }
      })
      .catch((err) => {
        console.error("Failed to load stops:", err);
      });
  }

  _loadItineraries(path) {
    return fetch(path + "itineraries.geojson")
      .then((res) => res.json())
      .then((data) => {
        if (!this.layers.itineraries) {
          this.layers.itineraries = L.layerGroup();
        }

        const routeNames = [
          ...new Set(data.features.map((f) => f.properties.route_short_name)),
        ];

        const routeColors = this._assignRouteColors(routeNames);

        L.geoJSON(data, {
          coordsToLatLng: (coords) => L.latLng(coords[1], coords[0]),
          style: (feature) => this._getItineraryStyle(feature, routeColors),
          onEachFeature: (feature, layer) =>
            this._configureItineraryFeature(feature, layer, routeColors),
        }).addTo(this.layers.itineraries);
      })
      .catch((err) => {
        console.error("Failed to load itineraries:", err);
      });
  }

  _assignRouteColors(routeNames) {
    const routeColors = {};
    routeNames.forEach((name, idx) => {
      const factor =
        routeNames.length === 1 ? 0 : idx / (routeNames.length - 1);
      routeColors[name] = interpolateColor(
        COLORS.BLUE,
        COLORS.BLUE_LIGHT,
        factor,
      );
    });
    return routeColors;
  }

  _getItineraryStyle(feature, routeColors) {
    const { route_short_name, color: fColor } = feature.properties;
    const color =
      (routeColors[route_short_name] ?? fColor) ? `#${fColor}` : COLORS.BLUE;
    return { color, weight: 4 };
  }

  _configureItineraryFeature(feature, layer, routeColors) {
    const {
      route_id,
      route_short_name,
      route_type,
      headsign,
      color: fColor,
    } = feature.properties;
    const coords = feature.geometry.coordinates;

    const fillColor =
      (routeColors[route_short_name] ?? fColor) ? `#${fColor}` : COLORS.BLUE;

    const label = `${TransitTypeMap[route_type]} Line ${route_short_name}</br>
      ${decodeURI(headsign)}</br>
      Id: ${route_id}</br>`;

    layer.bindPopup(label);

    const options = {
      radius: 6,
      fillColor,
      color: "#FFFFFF",
      weight: 4,
      opacity: 1,
      fillOpacity: 0.8,
    };

    // Start marker
    const firstCoord = coords[0];
    const circleMarkerStart = L.circleMarker(
      [firstCoord[1], firstCoord[0]],
      options,
    );
    circleMarkerStart.bindPopup(label);
    circleMarkerStart.addTo(this.layers.itineraries);

    // End marker
    const lastCoord = coords[coords.length - 1];
    const circleMarkerEnd = L.circleMarker(
      [lastCoord[1], lastCoord[0]],
      options,
    );
    circleMarkerEnd.bindPopup(label);
    circleMarkerEnd.addTo(this.layers.itineraries);
  }

  _loadBikeStations(path) {
    return fetch(path + "bike_stations.geojson")
      .then((res) => res.json())
      .then((data) => {
        const periods = data.metadata?.periods;
        const features = data.features;

        if (!periods) {
          const bikeStationsLayer = this.initializeBikesStationsLayer(
            features.filter((f) => f.geometry.type === "Point"),
          );
          this.layers.bikeStations = bikeStationsLayer;
          return;
        }

        periods.forEach((period) => {
          this.initializePeriod(
            period,
            features.filter((f) => f.geometry.type === "Point"),
            features.filter(
              (f) =>
                f.properties.type === "flow" &&
                f.geometry.type === "LineString",
            ),
          );
        });

        if (this.periodLayers[0]) {
          this.periodLayers[0].staticLayer.addTo(this.map);
        }
      })
      .catch((err) => {
        console.error("Failed to load bike stations:", err);
      });
  }

  _loadTrips(path) {
    return fetch(path + "od_trips.json")
      .then((res) => res.json())
      .then((trips) => {
        if (!this.layers.trips) {
          this.layers.trips = L.layerGroup();
        }

        trips.forEach((trip) => {
          const start = trip.coordinates[0];
          const end = trip.coordinates[1];
          L.polyline(
            [
              [start[1], start[0]],
              [end[1], end[0]],
            ],
            {
              color: COLORS.GRAY,
              weight: Math.max(1, trip.demand / 10),
              opacity: 0.6,
            },
          ).addTo(this.layers.trips);
        });
      })
      .catch((err) => {
        console.error("Failed to load trips:", err);
      });
  }

  _loadHexGrid(path) {
    return fetch(path + "grid.geojson")
      .then((res) => res.json())
      .then((data) => {
        if (!this.layers.grid) {
          this.layers.grid = L.layerGroup();
        }

        L.geoJSON(data, {
          style: function (feature) {
            return {
              color: "#333",
              weight: 1,
              fillColor: "#66ccff",
              fillOpacity: 0.4,
            };
          },
          onEachFeature: function (feature, layer) {
            layer.bindPopup("Hex ID: " + (feature.properties.id || "N/A"));
          },
        }).addTo(this.layers.grid);
      })
      .catch((err) => {
        console.error("Failed to load hex grid:", err);
      });
  }

  // ==========================================================================
  // MAP HELPER FUNCTIONS
  // =========================================================================
  initializePeriod(period, stationFeatures, flowFeatures) {
    const stationsLayer = this.initializeBikesStationsLayer(
      stationFeatures,
      period,
    );
    const periodStations = this.initializeFlowsByPeriod(flowFeatures, period);

    this.periodLayers[period] = {
      staticLayer: stationsLayer,
      layersPerStation: periodStations,
      initialized: true,
      display: false,
    };
  }

  initializeFlowsByPeriod(flowFeatures, period) {
    const periodStations = {};

    flowFeatures
      .filter((f) => f.properties.period === period)
      .forEach((f) => {
        const coords = f.geometry.coordinates;
        const from = f.properties.from;
        const to = f.properties.to;
        const quantity = f.properties.quantity;
        const latlngs = coords.map(([x, y]) => [y, x]);

        const originCoords = latlngs[0];
        const destinationCoords = latlngs[latlngs.length - 1];

        const fromFlowsLayer = periodStations[from] ?? L.layerGroup();
        const toFlowsLayer = periodStations[to] ?? L.layerGroup();

        // FROM → TO (curve left)
        const fromPath = getCurvedPath(
          originCoords,
          destinationCoords,
          "left",
          0.3,
        );
        const fromLine = L.curve(fromPath, {
          color: COLORS.ORANGE,
          weight: 2,
          opacity: 0.9,
        });

        // TO → FROM (curve right)
        const toPath = getCurvedPath(
          destinationCoords,
          originCoords,
          "right",
          0.3,
        );
        const toLine = L.curve(toPath, {
          color: COLORS.GREEN,
          weight: 2,
          opacity: 0.9,
        });

        const popup = `P${period}: ${from} → ${to}<br/>
                                  Qty: ${quantity}<br/> `;

        // Add quantity label slightly below the arrow
        const fromQuantityMarker = L.marker(
          getPositionNearOrigin(
            originCoords,
            destinationCoords,
            "left",
            0.3,
            0.3,
          ),
          {
            icon: L.divIcon({
              className: "quantity-label",
              html: "-" + quantity,
            }),
            interactive: false,
          },
        );

        const toQuantityMarker = L.marker(
          getPositionNearOrigin(
            destinationCoords,
            originCoords,
            "right",
            0.3,
            0.3,
          ),
          {
            icon: L.divIcon({
              className: "quantity-label",
              html: "+" + quantity,
            }),
            interactive: false,
          },
        );

        fromLine.bindPopup(popup);
        fromQuantityMarker.bindPopup(popup);
        fromLine.addTo(fromFlowsLayer);
        fromQuantityMarker.addTo(fromFlowsLayer);

        toLine.bindPopup(popup);
        toQuantityMarker.bindPopup(popup);
        toLine.addTo(toFlowsLayer);
        toQuantityMarker.addTo(toFlowsLayer);

        periodStations[from] = fromFlowsLayer;
        periodStations[to] = toFlowsLayer;
      });
    return periodStations;
  }
  initializeBikesStationsLayer(stationFeatures, period) {
    const stationsLayer = L.layerGroup();
    const maxCapacity = Math.max(
      ...stationFeatures.map((s) => s.properties.capacity),
    );

    stationFeatures.forEach((f) => {
      const { station_id, name, capacity, inventory } = f.properties;
      const coords = f.geometry.coordinates;
      const inv = inventory ? inventory[period] : 0;

      let popup = `<strong>Station ${station_id} - ${name}</strong><br/>`;

      if (capacity && inv > 0) {
        popup += `Capacity: ${capacity}<br/>
                  Inventory: ${inv}<br/>`;
        popup += `<strong>Period ${period}</strong><br/>`;
        const radius = getRadius(capacity, maxCapacity);

        const base = L.circle([coords[1], coords[0]], {
          radius,
          color: COLORS.GREEN,
          fillColor: COLORS.GREEN,
          fillOpacity: 1,
        });

        base.bindPopup(popup);
        base.addTo(stationsLayer);
        base.on("click", () => {
          this.togglePeriodStationLayers(period, station_id);
        });
        const angle = (inv / capacity) * 360;
        const arc = L.semiCircle([coords[1], coords[0]], {
          radius,
          startAngle: 0,
          stopAngle: angle,
          color: COLORS.WHITE,
          fillColor: COLORS.WHITE,
          fillOpacity: 0.9,
          weight: 0,
        });
        arc.bindPopup(popup);
        arc.addTo(stationsLayer);
        arc.on("click", () => {
          this.togglePeriodStationLayers(period, station_id);
        });
      }

      const label = L.marker([coords[1], coords[0]], {
        icon: this.getEmojiPin(COLORS.ORANGE, "🚲"),
      });

      label.bindPopup(popup);
      label.addTo(stationsLayer);
      label.on("click", () => {
        this.togglePeriodStationLayers(period, station_id);
      });
    });
    return stationsLayer;
  }

  togglePeriodStationLayers(p, stationId) {
    const period = this.periodLayers[p];
    if (!period) {
      console.warn(`Period ${p} not found`);
      return;
    }
    const display = !period.display;
    if (period && period.initialized && stationId) {
      const stationLayer = period.layersPerStation[stationId];
      if (stationLayer) {
        display
          ? stationLayer.addTo(this.map)
          : this.map.removeLayer(stationLayer);
      }

      period.display = display;
    }
  }
}

// Static helper to await shared map from outside scripts
SumPublicTransportNewSharedModesNetwork.waitForSharedMap = function (
  timeoutMs = 8000,
) {
  return new Promise((resolve, reject) => {
    if (window.__SUM_SHARED_MAP) return resolve(window.__SUM_SHARED_MAP);
    const onReady = (e) => {
      window.removeEventListener("sum-map-ready", onReady);
      resolve(e.detail.map);
    };
    window.addEventListener("sum-map-ready", onReady, { once: true });
    if (timeoutMs) {
      setTimeout(() => {
        if (!window.__SUM_SHARED_MAP) {
          window.removeEventListener("sum-map-ready", onReady);
          reject(new Error("Timed out waiting for shared map"));
        }
      }, timeoutMs);
    }
  });
};

customElements.define(
  "sum-pt-nsm-network",
  SumPublicTransportNewSharedModesNetwork,
);
