/* Custom Element: <sum-network-bike-sharing-system datapath="/data"> */

class SumNetworkBikeSharingSystem extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.state = {
      dataPath: this.getAttribute("datapath") || "/data",
      bikeStations: [],
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
        <h1>Network Design Optimization for Bike Sharing Systems – Demo</h1>
        <button id="btnMeta" class="secondary">Info</button>
      </header>
        <section id="mapPanel">
          <div id="tripDetails"></div>
          <div id="mapArea" aria-label="Map showing selected trip">
            <!-- Fallback first so slotted network overlays it when present -->
            <div id="mapFallback"></div>
            <slot id="mapSlot"></slot>
          </div>
        </section>
      <div class="loading-overlay" id="loadingOverlay"><div class="loading-box">Loading data in map…</div></div>
    `;
  }

  cacheEls() {
    const r = this.shadowRoot;
    this.$status = r.getElementById("statusMsg");
    this.$loading = r.getElementById("loadingOverlay");
  }

  async init() {
    try {
      await Promise.all([this.loadAll(), this.initMap()]);
      await this.renderMap();
      this.$loading.classList.add("hidden");
      this._initialised = true;
    } catch (e) {
      console.error(e);
      this.$status.textContent = "Failed initializing";
      this.$loading.querySelector(".loading-box").textContent =
        "Failed loading map/data";
    }
  }

  async fetchJSON(name) {
    const res = await fetch(`${this.state.dataPath}/${name}`);
    if (!res.ok) throw new Error("Failed loading " + name);
    return res.json();
  }

  async loadAll() {
    const [bikeStations] = await Promise.all([
      this.fetchJSON("selected_bike_stations.geojson"),
    ]);
    this.state.bikeStations = bikeStations;
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
      html: `<span style="background-color:${color};width:3rem;height:3rem;display:block;left:-1.5rem;top:-1.5rem;position:relative;border-radius:3rem 3rem;transform:rotate(45deg);border:1px solid #FFFFFF;text-align:center;line-height:3rem;font-size:1rem;color:#fff;font-weight:bold;"><span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);pointer-events:none;">${label}</span></span>`,
    });
  }

  async renderMap() {
    if (!this.state.map) await this.initMap();
    this.clearMapLayers();
    const map = this.state.map;
    const stations = this.state.bikeStations.features || [];
    stations.forEach((feature) => {
      const { coordinates } = feature.geometry;
      const { inventory, capacity, id } = feature.properties;
      // Determine color based on inventory/capacity ratio
      const ratio = (inventory / capacity) * 100;
      let color;
      if (ratio > 90) {
        color = "#E53935"; // red
      } else if (ratio > 50) {
        color = "#FFB300"; // orange
      } else {
        color = "#98C33A"; // green
      }
      // Create a custom icon showing inventory/capacity
      const iconLabel = `${inventory}/${capacity}`;
      const marker = L.marker([coordinates[1], coordinates[0]], {
        icon: this.getCustomIconHtml(color, iconLabel),
        title: `Bike station ${id}`,
      }).bindPopup(
        `<b>Bike station ${id}</b><br>Inventory: ${inventory}<br>Capacity: ${capacity}`
      );
      marker.addTo(map);
      this.state.mapLayers.push(marker);
    });
  }
}

customElements.define(
  "sum-network-bike-sharing-system",
  SumNetworkBikeSharingSystem
);

export { SumNetworkBikeSharingSystem };
