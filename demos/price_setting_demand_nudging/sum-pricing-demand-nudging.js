/* Custom Element: <sum-pricing-demand-nudging datapath="/data"> */

class SumPricingDemandNudging extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.state = {
      dataPath: this.getAttribute("datapath") || "/data",
      clusters: [],
      stations: [],
      odOptions: new Map(),
      destinationsByOrigin: new Map(),
      meta: null,
      selected: { origin: null, destination: null, odKey: null, option: null },
      map: null,
      mapLayers: [],
    };
  }

  static get observedAttributes() {
    return ["datapath"];
  }
  attributeChangedCallback(name, oldV, newV) {
    if (name === "datapath" && oldV !== newV) {
      this.state.dataPath = newV || "/data";
      // re-load data if attribute changes
      this._initialised && this._reload();
    }
  }

  connectedCallback() {
    this.render();
    this.cacheEls();
    this.bindEvents();
    this.init();
  }

  render() {
    const style = /* css */ `
      * { box-sizing: border-box; font-family: system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; }
      :host { display:block; position:relative; color:#133; }
      header { display:flex; align-items:center; gap:1rem; padding:0.6rem 1rem; background:#004494; color:#fff; }
      header h1 { flex:1; font-size:1.05rem; margin:0; font-weight:600; }
      header button { background:#fff; color:#004494; border:0; padding:0.4rem .9rem; border-radius:4px; cursor:pointer; font-weight:600; }
      header button:disabled { opacity:.5; cursor:default; }
      #layout { display:grid; grid-template-columns:320px 1fr; min-height:480px; background:#f6f8fa; }
      #selectors { padding:1rem; overflow:auto; background:#fff; border-right:1px solid #d0dad8; }
      #selectors h2 { margin:.6rem 0 .4rem; font-size:1rem; color:#144; }
      label { display:flex; flex-direction:column; font-size:.8rem; margin-bottom:.55rem; font-weight:600; color:#155; }
      select { padding:.45rem .5rem; border:1px solid #8bb5ae; border-radius:4px; background:#fff; }
      select:disabled, button:disabled { background:#e3e9e8; }
      #swapRow { text-align:right; margin-bottom:.5rem; }
      #swapBtn { background:#75BDFB; color:#fff; border:0; padding:.35rem .7rem; border-radius:4px; cursor:pointer; }
      #swapBtn:disabled { opacity:.5; cursor:default; }
      #statusMsg { font-size:.72rem; color:#555; min-height:1.1rem; margin-bottom:.4rem; }
      #optionsList { display:flex; flex-direction:column; gap:.55rem; }
      .optionCard { border:2px solid #d9e5e2; padding:.5rem .6rem; border-radius:8px; background:#fff; display:flex; flex-direction:column; gap:.25rem; outline:none; position:relative; transition:background .2s,border .2s; }
      .optionCard:hover, .optionCard:focus { border-color:#004494; cursor:pointer; }
      .optionCard.chosen { background:#98c33a84; box-shadow:0 0 0 2px #ffb74d40; }
      .optionCard .selected-badge { position:absolute; bottom:4px; right:6px; background:#98C33A; color:#103013; padding:.15rem .45rem; font-size:.55rem; font-weight:700; border-radius:6px; letter-spacing:.5px; text-transform:uppercase; box-shadow:0 1px 2px #0002; pointer-events:none; }
      .opt-line1 { display:flex; align-items:center; justify-content:space-between; font-size:.9rem; font-weight:600; }
      .opt-line2 { display:flex; gap:.7rem; font-size:.65rem; text-transform:uppercase; letter-spacing:.05em; color:#335; }
      .price { font-size:1.05rem; font-weight:700; color:#0d473f; }
  #mapPanel { position:relative; display:flex; flex-direction:column; min-height:0; height:100vh; }
      #tripDetails { padding:.5rem .75rem; background:#fff; border-bottom:1px solid #d0dad8; min-height:58px; font-size:.8rem; line-height:1.2; }
  #mapArea { position:relative; flex:1; min-height:360px; overflow:hidden; }
  /* Fallback map layer sits below; slotted network (if present) floats above */
  #mapFallback { position:absolute; inset:0; z-index:0; }
  ::slotted(sum-pt-nsm-network) { position:absolute; inset:0; display:block; height:100%; width:100%; z-index:1; }
      dialog { max-width:640px; width:90%; }
      pre { max-height:60vh; overflow:auto; background:#0c27302b; padding:.6rem; border-radius:4px; }
      .loading-overlay { position:absolute; inset:0; background:rgba(0,0,0,.4); display:flex; align-items:center; justify-content:center; z-index:50; backdrop-filter:blur(2px); }
      .loading-overlay.hidden { display:none; }
      .loading-box { background:#ffffffeb; padding:1rem 1.4rem; border-radius:10px; box-shadow:0 4px 16px -2px #0005; font-size:.95rem; font-weight:600; color:#123; display:flex; gap:.6rem; align-items:center; }
      .loading-box:before { content:""; width:14px; height:14px; border-radius:50%; border:3px solid #98C33A; border-right-color:transparent; animation:spin .8s linear infinite; }
      @keyframes spin { to { transform:rotate(360deg); } }
      @media (max-width:900px){ #layout { grid-template-columns:100%; } #map { min-height:300px; } }
    `;
    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
      <header>
        <h1>Dynamic Mobility Pricing – Demo</h1>
        <button id="btnMeta" class="secondary">Info</button>
      </header>
      <div id="layout" part="layout">
        <section id="selectors">
          <h2>Select Trip</h2>
          <label>Origin Station
            <select id="originSelect"><option value="">-- choose --</option></select>
          </label>
            <label>Destination Station
            <select id="destinationSelect"><option value="">-- choose --</option></select>
          </label>
          <div id="swapRow"><button id="swapBtn" title="Swap">⇄ Swap</button></div>
          <div id="statusMsg" class="status"></div>
          <hr />
          <h2>Options</h2>
          <div id="optionsList" aria-live="polite"></div>
        </section>
        <section id="mapPanel">
          <div id="tripDetails"></div>
          <div id="mapArea" aria-label="Map showing selected trip">
            <!-- Fallback first so slotted network overlays it when present -->
            <div id="mapFallback"></div>
            <slot id="mapSlot"></slot>
          </div>
        </section>
      </div>
      <dialog id="metaDialog">
        <h2>Simulation Metadata</h2>
        <pre id="metaContent"></pre>
        <form method="dialog"><button>Close</button></form>
      </dialog>
      <template id="optionTemplate">
        <div class="optionCard" role="button" tabindex="0">
          <div class="opt-line1"><span class="modes"></span><span class="price"></span></div>
          <div class="opt-line2"><span class="duration"></span><span class="transfers"></span><span class="flow"></span></div>
        </div>
      </template>
      <div class="loading-overlay" id="loadingOverlay"><div class="loading-box">Loading data in map…</div></div>
    `;
  }

  cacheEls() {
    const r = this.shadowRoot;
    this.$origin = r.getElementById("originSelect");
    this.$dest = r.getElementById("destinationSelect");
    this.$options = r.getElementById("optionsList");
    this.$status = r.getElementById("statusMsg");
    this.$tripDetails = r.getElementById("tripDetails");
    this.$metaDialog = r.getElementById("metaDialog");
    this.$metaContent = r.getElementById("metaContent");
    this.$loading = r.getElementById("loadingOverlay");
    this.$swap = r.getElementById("swapBtn");
    this.$btnMeta = r.getElementById("btnMeta");
    this.$tpl = r.getElementById("optionTemplate");
  }

  bindEvents() {
    this.$btnMeta.addEventListener("click", () => this.$metaDialog.showModal());
    this.$swap.addEventListener("click", () => {
      const o = this.$origin.value,
        d = this.$dest.value;
      this.$origin.value = d;
      this.$dest.value = o;
      this.onStationChange();
    });
    this.$origin.addEventListener("change", () => this.onOriginChange());
    this.$dest.addEventListener("change", () => this.onDestinationChange());
  }

  async init() {
    this.setUIEnabled(false);
    try {
      await Promise.all([this.loadAll(), this.initMap()]);
      this.setUIEnabled(true);
      this.$loading.classList.add("hidden");
      this._initialised = true;
    } catch (e) {
      console.error(e);
      this.$status.textContent = "Failed initializing";
      this.$loading.querySelector(".loading-box").textContent =
        "Failed loading map/data";
    }
  }

  setUIEnabled(enabled) {
    const disable = !enabled;
    [this.$origin, this.$dest, this.$swap, this.$btnMeta].forEach(
      (el) => (el.disabled = disable)
    );
  }

  async fetchJSON(name) {
    const res = await fetch(`${this.state.dataPath}/${name}`);
    if (!res.ok) throw new Error("Failed loading " + name);
    return res.json();
  }

  async loadAll() {
    const [clusters, meta] = await Promise.all([
      this.fetchJSON("cluster_nodes.json"),
      this.fetchJSON("meta.json").catch(() => null),
    ]);
    this.state.clusters = clusters;
    this.state.meta = meta;
    const arcs = await this.fetchJSON("arcs_od_options.json");
    arcs.forEach((b) => this.state.odOptions.set(b.OD, b.options));
    this.buildDestinationMapping();
    this.buildStations();
    this.populateOriginSelect();
    if (meta) this.$metaContent.textContent = JSON.stringify(meta, null, 2);
  }

  buildDestinationMapping() {
    const m = this.state.destinationsByOrigin;
    m.clear();
    for (const odKey of this.state.odOptions.keys()) {
      const [o, d] = odKey.split("->").map((x) => parseInt(x, 10));
      if (!m.has(o)) m.set(o, new Set());
      m.get(o).add(d);
    }
  }

  buildStations() {
    const seen = new Set();
    const stations = [];
    const clusters = this.state.clusters;
    for (const hub of clusters) {
      for (const s of hub.bike_stations)
        if (!seen.has("b" + s.id)) {
          stations.push({
            id: s.id,
            cluster_id: hub.cluster_id,
            type: "bike",
            lat: s.lat,
            lon: s.lon,
          });
          seen.add("b" + s.id);
        }
      for (const s of hub.pt_stations)
        if (!seen.has("p" + s.id)) {
          stations.push({
            id: s.id,
            cluster_id: hub.cluster_id,
            type: "pt",
            lat: s.lat,
            lon: s.lon,
          });
          seen.add("p" + s.id);
        }
    }
    stations.sort((a, b) => a.id.localeCompare(b.id));
    this.state.stations = stations;
  }

  getClusterById(id) {
    return this.state.clusters.find((c) => c.cluster_id === id);
  }

  populateOriginSelect() {
    for (const st of this.state.stations) {
      const opt = document.createElement("option");
      opt.value = st.id;
      opt.textContent = `${st.type === "bike" ? "🚲" : "🚍"} ${st.id}`;
      this.$origin.appendChild(opt);
    }
  }

  populateDestinationsForOrigin(originStation) {
    const first = this.$dest.firstElementChild;
    this.$dest.innerHTML = "";
    if (first) this.$dest.appendChild(first);
    if (!originStation) return;
    const allowed = this.state.destinationsByOrigin.get(
      originStation.cluster_id
    );
    if (!allowed) return;
    for (const st of this.state.stations)
      if (
        allowed.has(st.cluster_id) &&
        st.cluster_id !== originStation.cluster_id
      ) {
        const opt = document.createElement("option");
        opt.value = st.id;
        opt.textContent = `${st.type === "bike" ? "🚲" : "🚍"} ${st.id}`;
        this.$dest.appendChild(opt);
      }
  }

  stationById(id) {
    return this.state.stations.find((s) => s.id === id);
  }

  onStationChange() {
    this.state.selected.origin = this.stationById(this.$origin.value) || null;
    this.state.selected.destination =
      this.stationById(this.$dest.value) || null;
    this.state.selected.option = null;
    this.renderOptions();
    this.renderMap();
  }
  onOriginChange() {
    this.state.selected.origin = this.stationById(this.$origin.value) || null;
    this.state.selected.destination = null;
    this.state.selected.option = null;
    this.populateDestinationsForOrigin(this.state.selected.origin);
    this.renderOptions();
    this.renderMap();
  }
  onDestinationChange() {
    this.state.selected.destination =
      this.stationById(this.$dest.value) || null;
    this.state.selected.option = null;
    this.renderOptions();
    this.renderMap();
  }

  makeODKey(o, d) {
    return `${o.cluster_id}->${d.cluster_id}`;
  }

  renderOptions() {
    this.$options.innerHTML = "";
    this.$status.textContent = "";
    const { origin, destination } = this.state.selected;
    if (!origin || !destination) {
      this.$status.textContent = "Select both stations";
      return;
    }
    const odKey = this.makeODKey(origin, destination);
    this.state.selected.odKey = odKey;
    const options = this.state.odOptions.get(odKey);
    if (!options) {
      this.$status.textContent =
        "No trips found for the origin-destination selected";
      return;
    }
    options.forEach((o) => this.addOptionCard(o));
  }

  addOptionCard(opt) {
    const mile_type = opt.mile_type ? `-${opt.mile_type}` : "";
    const node = this.$tpl.content.firstElementChild.cloneNode(true);
    node.dataset.arcId = opt.arc_id;
    node.querySelector(".modes").textContent =
      { "PT+Bike-first": "🚲🚍", "PT+Bike-last": "🚍🚲", PT: "🚍", Car: "🚗" }[
        `${opt.mode}${mile_type}`
      ] || opt.mode;
    node.querySelector(".price").textContent =
      opt.price != null ? `€${opt.price}` : "–";
    node.querySelector(".duration").textContent = `${opt.duration || "?"} min`;
    node.querySelector(".transfers").textContent = `${
      opt.transfers || 0
    } transfers`;
    node.querySelector(".flow").textContent =
      opt.flow != null ? `${opt.flow.toFixed(1)} flow` : "";
    if (opt.chosen) {
      node.classList.add("chosen");
      const badge = document.createElement("span");
      badge.className = "selected-badge";
      badge.textContent = "prefered";
      node.appendChild(badge);
    }
    node.addEventListener("click", () => this.selectOption(opt, node));
    node.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.selectOption(opt, node);
      }
    });
    this.$options.appendChild(node);
  }

  selectOption(opt, card) {
    this.state.selected.option = opt;
    [...this.$options.children].forEach((c) =>
      c.classList.toggle("active", c === card)
    );
    this.renderMap();
    this.renderDetails();
  }

  renderDetails() {
    const opt = this.state.selected.option;
    if (!opt) {
      this.$tripDetails.textContent = "";
      return;
    }
    const lines = [];
    const mileType = opt.mile_type ? ` ${opt.mile_type} mile` : "";
    lines.push(
      `${opt.mode} ${mileType} • ${opt.duration} min • Price €${opt.price}`
    );
    if (opt.pt_time || opt.bike_time) {
      lines.push(
        `PT ${Math.round(opt.pt_time || 0)} min • Bike ${Math.round(
          opt.bike_time || 0
        )} min • Wait ${Math.round(opt.waiting_time || 0)} min`
      );
    }
    lines.push(
      `Transfers: ${opt.transfers || 0} | Flow: ${opt.flow?.toFixed(2) || 0}`
    );
    this.$tripDetails.innerHTML = lines.map((l) => `<div>${l}</div>`).join("");
  }

  async initMap() {
    if (this.state.map) return this.state.map;
    // Check for slotted network component
    const networkEl = this.querySelector("sum-pt-nsm-network");
    if (networkEl) {
      // If its map already exists, reuse
      if (networkEl.map) {
        this.state.map = networkEl.map;
        // Hide fallback layer
        const fb = this.shadowRoot.getElementById("mapFallback");
        if (fb) fb.style.display = "none";
        // Allow some time for layout then invalidate
        requestAnimationFrame(() => this.state.map.invalidateSize());
        return this.state.map;
      }
      // Wait for custom event specific to that element
      this.state.map = await new Promise((resolve, reject) => {
        const to = setTimeout(
          () => reject(new Error("Timed out waiting for slotted network map")),
          2000
        );
        const handler = (e) => {
          if (e.detail && e.detail.element === networkEl) {
            window.removeEventListener("sum-map-ready", handler);
            clearTimeout(to);
            resolve(e.detail.map);
          }
        };
        window.addEventListener("sum-map-ready", handler);
      }).catch((err) => {
        console.warn("Falling back to internal map due to:", err.message);
        return null;
      });
      if (this.state.map) {
        const fb = this.shadowRoot.getElementById("mapFallback");
        if (fb) fb.style.display = "none";
        requestAnimationFrame(() => this.state.map.invalidateSize());
        return this.state.map;
      }
    }
    // Fallback: create internal map
    const fallback = this.shadowRoot.getElementById("mapFallback");
    this.state.map = L.map(fallback).setView([46.2, 6.14], 12);
    if (L.tileLayer) {
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(this.state.map);
    }
    requestAnimationFrame(() => this.state.map.invalidateSize());
    return this.state.map;
  }

  clearMapLayers() {
    this.state.mapLayers.forEach((l) => l.remove && l.remove());
    this.state.mapLayers = [];
  }

  getCustomIconHtml(color, label = "") {
    return L.divIcon({
      className: "my-custom-pin",
      iconAnchor: [0, 24],
      html: `<span style="background-color:${color};width:3rem;height:3rem;display:block;left:-1.5rem;top:-1.5rem;position:relative;border-radius:3rem 3rem 0;transform:rotate(45deg);border:1px solid #FFFFFF;text-align:center;line-height:3rem;font-size:1.2rem;color:#fff;font-weight:bold;"><span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);pointer-events:none;">${label}</span></span>`,
    });
  }

  /* ---- Cluster region helpers ---- */
  _clusterHull(cluster) {
    if (!cluster) return null;
    if (cluster.__hull) return cluster.__hull; // cached
    const pts = [];
    const push = (s) => {
      if (typeof s.lat === "number" && typeof s.lon === "number")
        pts.push([s.lat, s.lon]);
    };
    (cluster.bike_stations || []).forEach(push);
    (cluster.pt_stations || []).forEach(push);
    // Ensure center included (avoids degenerate hull when <3 stations)
    if (
      cluster.center &&
      typeof cluster.center.lat === "number" &&
      typeof cluster.center.lon === "number"
    ) {
      pts.push([cluster.center.lat, cluster.center.lon]);
    }
    // Remove duplicates
    const key = (p) => p[0].toFixed(6) + "," + p[1].toFixed(6);
    const uniqMap = new Map();
    pts.forEach((p) => uniqMap.set(key(p), p));
    const uniq = Array.from(uniqMap.values());
    if (uniq.length < 3) {
      cluster.__hull = uniq;
      return uniq;
    }
    // Monotonic chain convex hull (lat ~ y, lon ~ x) using lon as x
    const ptsSorted = uniq
      .slice()
      .sort((a, b) => (a[1] === b[1] ? a[0] - b[0] : a[1] - b[1]));
    const cross = (o, a, b) =>
      (a[1] - o[1]) * (b[0] - o[0]) - (a[0] - o[0]) * (b[1] - o[1]);
    const lower = [];
    for (const p of ptsSorted) {
      while (
        lower.length >= 2 &&
        cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
      )
        lower.pop();
      lower.push(p);
    }
    const upper = [];
    for (let i = ptsSorted.length - 1; i >= 0; i--) {
      const p = ptsSorted[i];
      while (
        upper.length >= 2 &&
        cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
      )
        upper.pop();
      upper.push(p);
    }
    upper.pop();
    lower.pop();
    const hull = lower.concat(upper);
    cluster.__hull = hull;
    return hull;
  }

  _addClusterRegion(cluster, color, labelChar) {
    if (!cluster || !this.state.map) return;
    const hull = this._clusterHull(cluster);
    const info = `
          <b>Cluster ${cluster.cluster_id}</b><br>
          Stations: ${[
            ...(cluster.bike_stations || []),
            ...(cluster.pt_stations || []),
          ]
            .map((s) => s.id)
            .join(", ")}<br>
          Center: (${cluster.center.lat.toFixed(
            5
          )}, ${cluster.center.lon.toFixed(5)})
        `;
    if (hull && hull.length >= 3) {
      const poly = L.polygon(
        hull.map((p) => [p[0], p[1]]),
        {
          color: color,
          weight: 1,
          fillColor: color,
          fillOpacity: 0.18,
          interactive: false,
        }
      ).addTo(this.state.map);
      if (poly.bringToBack) poly.bringToBack();
      poly.on("click", () => {
        poly.bindPopup(info).openPopup();
      });
      this.state.mapLayers.push(poly);
    }
    // center dot
    if (cluster.center) {
      const dot = L.circleMarker([cluster.center.lat, cluster.center.lon], {
        radius: 5,
        weight: 2,
        color: color,
        fillColor: color,
        fillOpacity: 1,
        interactive: true,
      }).addTo(this.state.map);
      dot.on("click", () => {
        dot.bindPopup(info).openPopup();
      });
      this.state.mapLayers.push(dot);
    }
  }

  getTripLineOptions(color = "#98C33A") {
    return {
      color,
      weight: 8,
      dashArray: "10,10", // dotted style
      lineCap: "round",
    };
  }

  async renderMap() {
    if (!this.state.map) await this.initMap();
    this.clearMapLayers();
    const { origin, destination, option } = this.state.selected;
    if (!origin || !destination) return;
    // Draw cluster regions first (origin & destination)
    const originCluster = this.getClusterById(origin.cluster_id);
    const destCluster = this.getClusterById(destination.cluster_id);
    this._addClusterRegion(originCluster, "#1976d2", "O");
    this._addClusterRegion(destCluster, "#d32f2f", "D");

    const om = L.marker([origin.lat, origin.lon], {
      title: origin.id,
      icon: this.getCustomIconHtml("#1976d2", "O"),
    }).addTo(this.state.map);
    this._setMarkerInfo(om, {
      title: `Origin: ${origin.id}`,
      subtitle: `Cluster ${origin.cluster_id}`,
      lat: origin.lat.toFixed(5),
      lon: origin.lon.toFixed(5),
    });

    const dm = L.marker([destination.lat, destination.lon], {
      title: destination.id,
      icon: this.getCustomIconHtml("#d32f2f", "D"),
    }).addTo(this.state.map);
    this._setMarkerInfo(dm, {
      title: `Destination: ${destination.id}`,
      subtitle: `Cluster ${destination.cluster_id}`,
      lat: destination.lat.toFixed(5),
      lon: destination.lon.toFixed(5),
    });
    this.state.mapLayers.push(om, dm);

    if (option) {
      let transfer_cluster;
      if (
        option?.transfers > 0 &&
        option?.transfers_cluster_nodes?.length > 0
      ) {
        transfer_cluster = this.getClusterById(
          option.transfers_cluster_nodes[0]
        );
      }
      if (transfer_cluster && transfer_cluster.center) {
        this._renderTransferPath(
          origin,
          destination,
          transfer_cluster,
          option,
          this._setMarkerInfo
        );
      } else {
        this._renderDirectPath(origin, destination, option);
      }
    }
  }

  /* ---------------- Path Rendering Helpers ---------------- */
  _setMarkerInfo(marker, { title, subtitle, lat, lon }) {
    let info = "";
    title && (info += `<strong>${title}</strong><br>`);
    subtitle && (info += `${subtitle}<br>`);
    lat && lon && (info += `(${lat}, ${lon})`);

    marker.on("click", () => {
      marker.bindPopup(info).openPopup();
    });
  }
  _getModeColor(option) {
    return option && option.mode === "Car" ? "#444" : "#98C33A";
  }

  _renderDirectPath(origin, destination, option) {
    const pl = L.polyline(
      [
        [origin.lat, origin.lon],
        [destination.lat, destination.lon],
      ],
      this.getTripLineOptions(this._getModeColor(option))
    ).addTo(this.state.map);
    this.state.mapLayers.push(pl);
  }

  _renderTransferPath(origin, destination, transfer_cluster, option) {
    this._addClusterRegion(transfer_cluster, "#888", "T");
    const tLat = transfer_cluster.center.lat;
    const tLon = transfer_cluster.center.lon;
    const tm = L.marker([tLat, tLon], {
      title: `Cluster ${transfer_cluster.cluster_id}`,
      icon: this.getCustomIconHtml("#888", "T"),
    }).addTo(this.state.map);
    this._setMarkerInfo(tm, {
      title: `Transfer cluster: ${transfer_cluster.cluster_id}`,
      lat: tLat,
      lon: tLon,
    });

    this.state.mapLayers.push(tm);
    const seg1 = L.polyline(
      [
        [origin.lat, origin.lon],
        [tLat, tLon],
      ],
      this.getTripLineOptions(this._getModeColor(option))
    ).addTo(this.state.map);
    const seg2 = L.polyline(
      [
        [tLat, tLon],
        [destination.lat, destination.lon],
      ],
      this.getTripLineOptions(this._getModeColor(option))
    ).addTo(this.state.map);
    this.state.mapLayers.push(seg1, seg2);
  }

  async _reload() {
    this.setUIEnabled(false);
    this.$loading.classList.remove("hidden");
    this.state.odOptions.clear();
    try {
      await this.loadAll();
      this.setUIEnabled(true);
      this.$loading.classList.add("hidden");
      this.renderOptions();
      this.renderMap();
    } catch (e) {
      console.error(e);
      this.$status.textContent = "Failed reload";
      this.$loading.querySelector(".loading-box").textContent =
        "Failed reloading";
    }
  }
}

customElements.define("sum-pricing-demand-nudging", SumPricingDemandNudging);

export { SumPricingDemandNudging };
