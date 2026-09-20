// La route : ce que partagent la carte de la ville (CityMap) et la route de l'histoire (StoryRoad).
// Un chemin SVG, des arrêts répartis le long, et un vélo qui roule d'un arrêt à l'autre.

/** Position de chaque arrêt le long du chemin, en fraction de sa longueur (le premier à 9 %, le dernier à 96 %). */
export const fractionsFor = (n: number) =>
  Array.from({ length: n }, (_, i) => 0.09 + (0.96 - 0.09) * (i / Math.max(1, n - 1)));

/** Pose le vélo (un <g>) à `len` sur le chemin, tourné dans le sens de la route, décalé de `lift` vers le haut. */
export function placeMarker(p: SVGPathElement, g: SVGGElement, len: number, lift = 26, tilt = 0.6) {
  const L = p.getTotalLength();
  const a = p.getPointAtLength(Math.max(0, len - 4)), b = p.getPointAtLength(Math.min(L, len + 4));
  const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  const q = p.getPointAtLength(Math.max(0, Math.min(L, len)));
  g.setAttribute("transform", `translate(${q.x} ${q.y - lift}) rotate(${ang * tilt})`);
}

export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const linear = (t: number) => t;

export const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Anime une longueur de `from` à `to` en `dur` ms (0 = tout de suite). Renvoie la fonction d'annulation. */
export function drive(from: number, to: number, dur: number, onFrame: (len: number) => void, ease = easeInOut): () => void {
  let raf = 0;
  const t0 = performance.now();
  const step = (now: number) => {
    const t = dur <= 0 ? 1 : Math.min(1, (now - t0) / dur);
    onFrame(from + (to - from) * ease(t));
    if (t < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}
