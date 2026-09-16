# INOCS SUM Project Demo

Public website of the INOCS team at INRIA for the EU SUM project (Seamless Shared Urban Mobility), covering shared mobility integrated with public transport.

The site has two parts, published together as one static GitHub Pages deployment:

- the **SUM project presentation** at the site root: an interactive "Ville en mouvement" journey that presents the project, its living labs, resources and hands-on games, first prepared for the Nuit européenne des chercheurs 2026
- the **optimization demonstrators** under `/demo/`: interactive visualizations of the optimization models developed by INOCS (city map, bike-sharing network design, dynamic pricing)

The repository also contains the static JSON and GeoJSON datasets used by the demonstrators, and a reference OpenTripPlanner setup used during data generation.

Live site: https://inria.github.io/inocs-sum-project-demo

Demonstrators: https://inria.github.io/inocs-sum-project-demo/demo/

## What this repository contains

- `web/`: the static website, built with Astro and React, and deployed to GitHub Pages
- `web/src/modules/sum-project/`: the SUM project presentation module (content, components and styles of the site root)
- `web/public/data/`: static JSON and GeoJSON files consumed by the demo pages
- `demos/`: legacy static demonstrators kept for reference
- `otp/`: reference OpenTripPlanner setup and local runtime data directory

At this stage, the repository is focused on publishing the demonstrators and their static inputs. In future iterations, the Python packages used to generate these datasets for each optimization study will also be published here with their own documentation.

## SUM project presentation

The site root presents the SUM project as a journey through a city with several stops (city hall, crossroads, bike station, fare, tram stop). Each stop combines a question, a short reveal, resources drawn from the project reports, image galleries and, for some stops, a game. The pricing stop embeds a simplified "Fixez le prix" demo and links to the dynamic pricing demonstrator.

All text is driven by `web/src/modules/sum-project/data/content.json`. Images live in `web/public/images/`. Empty string fields in the content file are placeholders still to be filled.

## Demonstration topics

The demonstrators under `/demo/` cover three complementary research directions.

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
└── web/                    # Astro + React static website
	├── public/
	│   ├── data/           # Static JSON and GeoJSON assets used by the demonstrators
	│   └── images/         # Images of the SUM project presentation
	└── src/
	    ├── modules/sum-project/   # Project presentation module (content, components, styles)
	    ├── pages/index.astro      # Site root: SUM project presentation
	    ├── pages/demo/            # Optimization demonstrators
	    └── domain/ application/ infrastructure/ presentation/   # Demonstrator code
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

`http://localhost:4321/inocs-sum-project-demo` for the project presentation, or `http://localhost:4321/inocs-sum-project-demo/demo/` for the demonstrators.

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