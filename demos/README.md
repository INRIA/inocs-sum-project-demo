# Legacy demos

This folder contains earlier static demonstrators that predate the Astro-based website in `web/`.

They are kept in the repository for reference, reproducibility, and quick access to previous standalone visualizations. The active public website is now built from `web/`, but these legacy demos are still useful to inspect the original static artifacts associated with each research topic.

## Included demos

### `livinglab_gva_network/`

Static visualization assets for the Geneva living lab, focused on public transport and new shared mobility network exploration. This demo includes JavaScript files for network and ridership map rendering.

### `network_design_bike_stations/`

Legacy demo for bike-sharing station network design. It includes a standalone page, styling, and a GeoJSON file containing selected bike station results.

### `price_setting_demand_nudging/`

Legacy demo for price setting and demand nudging, with static JSON inputs describing origin-destination options, cluster nodes, and metadata used by the visualization.

### `legacy-index.html`

Archived entry page for browsing the legacy static demos.

## Run locally

From the repository root, start a simple static server:

```bash
python -m http.server 8080
```

Then open one of the following:

- Legacy index: `http://localhost:8080/demos/legacy-index.html`
- Geneva living lab demo: `http://localhost:8080/demos/livinglab_gva_network/`
- Bike-sharing network design demo: `http://localhost:8080/demos/network_design_bike_stations/`
- Price setting and demand nudging demo: `http://localhost:8080/demos/price_setting_demand_nudging/`

## Relationship with the main website

The GitHub Pages deployment is built from the Astro application in `web/`. During deployment, this `demos/` folder is copied into the final static output so the legacy pages remain accessible alongside the newer site.
