# Web application

This folder contains the static website of the repository: the SUM project presentation at the site root, and the public optimization demonstrators under `/demo/`.

The application is built with Astro and React and is deployed to GitHub Pages as a fully static site. It consumes committed JSON and GeoJSON files from `public/data/`, so the published demo does not depend on a live backend.

## Tech stack

- Astro 6
- React 19
- Tailwind CSS 4
- Leaflet and React Leaflet for map rendering
- Recharts for metrics visualizations
- Node.js 22+

## Main pages

- `src/pages/index.astro`: SUM project presentation ("Ville en mouvement" journey), rendered from the `sum-project` module
- `src/pages/demo/index.astro`: landing page for the demonstrators
- `src/pages/demo/city-map.astro`: map-based view for Geneva public transport and shared mobility layers
- `src/pages/demo/nsm-dynamic-pricing.astro`: dynamic pricing metrics and user simulation interface

The root page imports only the module stylesheet, so it does not load Tailwind or Leaflet. The demo pages use `DashboardLayout`, which loads the Tailwind-based global stylesheet.

## Project structure

- `src/modules/sum-project/`: self-contained project presentation module
  - `data/content.json`: all text, stops, resources, games and glossary (empty strings are placeholders)
  - `components/`: React components of the journey (Masthead, CityMap, Journey, StopPanel, ResourceDetail, Gallery, CardGame, PricingDemo)
  - `lib/types.ts`: content types
  - `styles/sum-project.css`: standalone stylesheet of the presentation
- `src/domain/`: domain models and core types for optimization, simulation, transit, and geographic entities
- `src/application/`: hooks and application services that orchestrate data access for the UI
- `src/infrastructure/`: data repository and asset URL helpers
- `src/presentation/`: Astro layout, React components, and UI utilities
- `public/assets/`: static media assets such as SVG icons
- `public/images/`: images of the project presentation, referenced from `content.json` as `/images/...` and resolved through `assetUrl()`
- `public/data/`: static datasets used by the demonstrators

## Static datasets

The current application reads committed files from `public/data/`.

### `public/data/sum_gtfs_geojson/`

GeoJSON layers derived from GTFS and geographic preprocessing for multiple Geneva configurations, including stops, itineraries, bike stations, ridership layers, and analysis grids.

### `public/data/nsm_pt_dynamic_pricing/`

Optimization outputs for the dynamic pricing demonstrator, including metrics, hub geometries, and cluster-level data used by the pricing dashboard and simulator.

## Development

Run from this `web/` directory:

```bash
npm install
npm run dev
```

Open:

`http://localhost:4321/inocs-sum-project-demo`

## Production build

```bash
npm run build
npm run preview
```

The static build output is generated in `dist/`.

## GitHub Pages configuration

The site is configured for a GitHub Pages project URL.

- `site`: `https://inria.github.io`
- `base`: `/inocs-sum-project-demo`

These values are defined in `astro.config.mjs`.

## Deployment workflow

Deployment is handled by the GitHub Actions workflow in `.github/workflows/pages.yml`.

The workflow:

- installs dependencies from `web/package-lock.json`
- builds the Astro site from `web/`
- copies the repository-level `demos/` folder into `web/dist/demos/`
- publishes `web/dist/` to GitHub Pages

This keeps the new Astro website and the legacy static demos available from the same published site.
