# INOCS SUM PT-NSM Optimization Demo

Static demonstrators for optimization models developed by the INOCS team at INRIA in the context of EU SUM project for shared mobility integrated with public transport.

This repository contains a static web application built with Astro and React, static JSON and GeoJSON datasets used by the demo pages, and a reference OpenTripPlanner setup that was used during data generation.

Live demo: https://inria.github.io/inocs-sum-pt-nsm-optimization-demo

## What this repository contains

- `web/`: the main static website, built with Astro and React, and deployed to GitHub Pages
- `web/public/data/`: static JSON and GeoJSON files consumed by the demo pages
- `demos/`: legacy static demonstrators kept for reference
- `otp/`: reference OpenTripPlanner setup and local runtime data directory

At this stage, the repository is focused on publishing the demonstrators and their static inputs. In future iterations, the Python packages used to generate these datasets for each optimization study will also be published here with their own documentation.

## Demonstration topics

The current demonstrators cover three complementary research directions.

### 1. Public transport and new shared mobility network visualization

The city map demo visualizes transit and shared mobility data for the Geneva living lab. It is used to explore spatial structures such as stops, bike stations, itineraries, grids, and ridership layers derived from GTFS and related geographic processing.

### 2. Bike-sharing station network design

The legacy bike-sharing demonstrator illustrates optimization outputs related to station placement and bike-sharing system design. This demo will be enhanced with latest model updates with results for Geneva living lab.

### 3. Price setting and demand nudging

The dynamic pricing demonstrator exposes optimization outputs related to pricing policies and user behavior simulation for integrated public transport and new shared mobility systems.

## Repository structure

```text
.
├── README.md
├── demos/                  # Legacy static demonstrators kept for reference
├── otp/                    # OpenTripPlanner reference setup and local data
│   └── docker-compose.yml
└── web/                    # Main Astro + React static demo website
	├── public/
	│   └── data/           # Static JSON and GeoJSON assets used by the site
	└── src/
```

More detailed documentation is available in:

- `demos/README.md`
- `web/README.md`

## Static data included in the repository

The website consumes versioned static datasets stored under `web/public/data/`.

- `sum_gtfs_geojson/`: GeoJSON layers derived from GTFS and geographic preprocessing for several spatial configurations in Geneva
- `nsm_pt_dynamic_pricing/`: optimization outputs and derived metrics used by the dynamic pricing demonstrator

These files are committed so the GitHub Pages deployment remains fully static and reproducible.

## Run the web demo locally

From the repository root:

```bash
cd web
npm install
npm run dev
```

Then open:

`http://localhost:4321/inocs-sum-pt-nsm-optimization-demo`

To build the production version locally:

```bash
cd web
npm run build
npm run preview
```

## Legacy static demos

Earlier static demonstrators are preserved in `demos/` for reference and comparison with the new Astro-based site.

See `demos/README.md` for details and local usage.

## OpenTripPlanner reference setup

The repository includes an OpenTripPlanner reference setup in `otp/docker-compose.yml`.

This setup is provided as documentation and reproducibility support: it was used during the preparation of demo inputs, but it is not required to run the published static website.

### Expected input data

The Compose services mount `otp/data/` into OTP at `/var/opentripplanner`.

Before building the graph, place the following files in `otp/data/`:

- `geneva-gtfs.zip`: GTFS archive containing the `.txt` files
- `geneva-osm.pbf`: OSM extract for the target area

Useful sources for Switzerland include:

- https://download.geofabrik.de/europe/switzerland.html
- https://data.opentransportdata.swiss/de/dataset/timetable-2025-gtfs2020

GBFS feeds can be obtained from mobility providers supported by OpenTripPlanner. The MobilityData systems list is available at https://github.com/MobilityData/gbfs/blob/master/systems.csv

### Build the OTP graph

Run from the `otp/` directory:

```bash
cd otp
docker compose --profile build up
```

This runs OTP with `--build --save` and writes the graph into `otp/data/`.

### Serve OTP locally

Run from the `otp/` directory:

```bash
cd otp
docker compose --profile serve up
```

OTP is then available at `http://localhost:8080`.

### Optional cleanup

```bash
cd otp
docker compose --profile build down
docker compose --profile serve down
```

The runtime data under `otp/data/` should remain local and is not intended for publication.

## Deployment

The website is deployed to GitHub Pages from the `web/` Astro build output. The GitHub Actions workflow also copies the legacy `demos/` folder into the published static site.

## Team and publications

This repository is maintained in the context of the INOCS team at INRIA.

Publications: https://team.inria.fr/inocs/publications/

## Roadmap

Planned future additions include:

- Python packages used to generate the demo datasets
- Package-specific documentation for each optimization workflow
- Clearer linkage between demo datasets, code, and related publications