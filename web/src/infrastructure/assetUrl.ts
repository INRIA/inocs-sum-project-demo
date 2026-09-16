/**
 * Infrastructure: base URL helper.
 *
 * Astro's import.meta.env.BASE_URL returns the configured `base` path
 * (e.g. "/inocs-sum-project-demo/") defined in astro.config.mjs.
 * All data fetches must be prefixed with this value to work on GitHub Pages.
 */

/** Normalised base: always ends with "/" */
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/?$/, '/');

/**
 * Resolve a repo-relative asset path to an absolute URL compatible
 * with the current deployment (localhost dev or GitHub Pages).
 *
 * @example
 *   assetUrl('data/sum_gtfs_geojson/geneva_1km-radius/stops.geojson')
 *   // → "/inocs-sum-project-demo/data/sum_gtfs_geojson/geneva_1km-radius/stops.geojson"
 */
export function assetUrl(path: string): string {
  return `${BASE}${path.replace(/^\//, '')}`;
}
