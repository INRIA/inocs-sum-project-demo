import { useEffect, useRef, useState } from "react";

export type StopLite = { id: string; order: number; place: string; title: string };

type Props = { stops: StopLite[]; activeId: string | null; onSelect: (id: string) => void };

// Route du vélo : une courbe qui traverse la ville de gauche à droite (viewBox 1400 × 620).
const ROAD = "M 40 500 C 200 500, 240 300, 380 290 S 560 400, 700 330 S 860 150, 1000 190 S 1180 360, 1330 250";
// Position de chaque arrêt le long de la route (fraction de la longueur).
const fractionsFor = (n: number) => Array.from({ length: n }, (_, i) => 0.09 + (0.96 - 0.09) * (i / Math.max(1, n - 1)));
const PARK_BEFORE = 52; // le vélo s'arrête juste avant le disque de l'arrêt
// Étiquette au-dessus ou en dessous de la route, pour ne pas se chevaucher.


function Icon({ id }: { id: string }) {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 3.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (id) {
    case "hotel-de-ville":
      return <g {...s}><path d="M-13 9 V-2 H13 V9 Z M-16 -2 H16 M-9 9 V2 M0 9 V2 M9 9 V2 M0 -2 V-13 M0 -13 H8 V-8 H0" /></g>;
    case "carrefour":
      return <g {...s}><path d="M-14 -4 H-4 V-14 H4 V-4 H14 V4 H4 V14 H-4 V4 H-14 Z" /></g>;
    case "station":
      return <g {...s}><circle cx="-9" cy="6" r="6.5" /><circle cx="10" cy="6" r="6.5" /><path d="M-9 6 L-2 -6 H7 L10 6 M-2 -6 L2 6 L-9 6 M2 6 L7 -6 M-5 -9 H1" /></g>;
    case "tarif": // téléphone / prix
      return <g {...s}><rect x="-8" y="-14" width="16" height="28" rx="3" /><path d="M-3 -10 H3 M0 10 H0.01" /><path d="M-4 -2 H4 M-4 2 H2" strokeWidth="2.4" /></g>;
    case "arret-de-tram":
      return <g {...s}><rect x="-11" y="-9" width="22" height="17" rx="3" /><path d="M-11 -1 H11 M-6 8 L-9 13 M6 8 L9 13 M-4 -13 H4 M0 -13 V-9" /><circle cx="-5" cy="4" r="1.2" fill="currentColor" /><circle cx="5" cy="4" r="1.2" fill="currentColor" /></g>;
    default:
      return <g {...s}><path d="M-8 13 V-13 M-8 -13 H10 L5 -6 L10 1 H-8" /></g>;
  }
}

export default function CityMap({ stops, activeId, onSelect }: Props) {
  const pathRef = useRef<SVGPathElement>(null);
  const bikeRef = useRef<SVGGElement>(null);
  const [pts, setPts] = useState<{ x: number; y: number }[]>([]);
  const lenRef = useRef(0); // position actuelle du vélo (longueur sur la route)
  const rafRef = useRef(0);

  // positions des arrêts sur la route
  useEffect(() => {
    const p = pathRef.current; if (!p) return;
    const L = p.getTotalLength();
    const FR = fractionsFor(stops.length);
    setPts(FR.map((f) => { const q = p.getPointAtLength(L * f); return { x: q.x, y: q.y }; }));
    lenRef.current = 0;
    placeBike(0);
  }, [stops.length]);

  function placeBike(len: number) {
    const p = pathRef.current, g = bikeRef.current; if (!p || !g) return;
    const L = p.getTotalLength();
    const a = p.getPointAtLength(Math.max(0, len - 4)), b = p.getPointAtLength(Math.min(L, len + 4));
    const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    const q = p.getPointAtLength(len);
    g.setAttribute("transform", `translate(${q.x} ${q.y - 26}) rotate(${ang * 0.6})`);
  }

  // le vélo roule jusqu'à l'arrêt sélectionné
  useEffect(() => {
    const p = pathRef.current; if (!p || !activeId) return;
    const idx = stops.findIndex((s) => s.id === activeId); if (idx < 0) return;
    const L = p.getTotalLength();
    const from = lenRef.current, to = Math.max(0, L * fractionsFor(stops.length)[idx] - PARK_BEFORE);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dist = Math.abs(to - from);
    const dur = reduce ? 0 : Math.min(2200, Math.max(700, dist * 1.6));
    cancelAnimationFrame(rafRef.current);
    const t0 = performance.now();
    const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const step = (now: number) => {
      const t = dur === 0 ? 1 : Math.min(1, (now - t0) / dur);
      const len = from + (to - from) * ease(t);
      lenRef.current = len; placeBike(len);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [activeId, stops]);

  return (
    <svg className="map" viewBox="0 0 1400 620" preserveAspectRatio="xMidYMid meet" role="group" aria-label="Carte de la ville : cinq arrêts">
      <defs>
        <pattern id="win" width="14" height="14" patternUnits="userSpaceOnUse">
          <rect x="3" y="3" width="5" height="6" fill="#FFFFFF" opacity=".55" />
        </pattern>
        <filter id="soft" x="-10%" y="-10%" width="120%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#1B3467" floodOpacity=".18" /></filter>
      </defs>

      {/* ---- Ville : rivière, parcs, îlots ---- */}
      <path d="M 900 -10 C 880 120, 1020 200, 960 330 S 1080 560, 1040 640" fill="none" stroke="var(--water)" strokeWidth="46" strokeLinecap="round" />
      <ellipse cx="330" cy="150" rx="150" ry="70" fill="var(--park)" />
      <ellipse cx="1190" cy="500" rx="120" ry="55" fill="var(--park)" />
      <circle cx="1230" cy="110" r="52" fill="var(--park)" />
      {[
        [40, 60, 140, 90], [200, 40, 90, 60], [70, 230, 120, 100], [470, 60, 170, 90], [660, 50, 120, 120], [820, 40, 60, 80],
        [180, 560, 150, 50], [420, 470, 140, 110], [620, 480, 120, 90], [780, 520, 120, 70], [1100, 40, 100, 60], [1290, 380, 90, 90],
        [560, 200, 90, 70], [1140, 200, 120, 80], [1290, 20, 90, 70],
      ].map(([x, y, w, h], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} rx="8" fill={i % 3 === 0 ? "var(--block-2)" : "var(--block)"} />
          <rect x={x} y={y} width={w} height={h} rx="8" fill="url(#win)" />
        </g>
      ))}
      {/* ligne de tram */}
      <path d="M 1000 -10 L 1000 640" stroke="#FFFFFF" strokeWidth="14" />
      <path d="M 1000 -10 L 1000 640" stroke="var(--sum-blue)" strokeWidth="4" strokeDasharray="18 12" opacity=".7" />

      {/* ---- Route ---- */}
      <path d={ROAD} fill="none" stroke="var(--road)" strokeWidth="34" strokeLinecap="round" />
      <path ref={pathRef} d={ROAD} fill="none" stroke="var(--road-line)" strokeWidth="3" strokeDasharray="22 16" strokeLinecap="round" />

      {/* ---- Arrêts ---- */}
      {pts.map((p, i) => {
        const s = stops[i]; if (!s) return null;
        const active = s.id === activeId;
        const ly = i % 2 === 1 ? -62 : 70;
        return (
          <g key={s.id} className={"stop" + (active ? " active" : "")} transform={`translate(${p.x} ${p.y})`}
             onClick={() => onSelect(s.id)} role="button" tabIndex={0} aria-label={`Arrêt ${s.order} : ${s.place}`} aria-pressed={active}
             onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(s.id); } }}>
            <circle className="ring" r="30" />
            <circle className="disc" r="30" filter="url(#soft)" />
            <g color={active ? "#17230A" : "var(--sum-blue)"}><Icon id={s.id} /></g>
            <g transform="translate(24 -24)"><circle r="12" fill="var(--sum-blue-deep)" /><text className="num" style={{ fontSize: 14, fill: "#fff" }}>{s.order}</text></g>
            <text className="lbl" y={ly}>{s.place}</text>
            <text className="lbl2" y={ly + 20}>{s.title}</text>
          </g>
        );
      })}

      {/* ---- Vélo ---- */}
      <g ref={bikeRef} aria-hidden="true">
        <g transform="scale(1.35)">
          <circle cx="-13" cy="18" r="11" fill="none" stroke="var(--sum-blue-deep)" strokeWidth="3.5" />
          <circle cx="17" cy="18" r="11" fill="none" stroke="var(--sum-blue-deep)" strokeWidth="3.5" />
          <path d="M-13 18 L-3 2 H11 L17 18 M-3 2 L4 18 L-13 18 M4 18 L11 2 M-8 -2 H-1 M14 -1 L11 2" fill="none" stroke="var(--sum-green)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M-1 2 L2 -8 L10 -10 M2 -8 L1 -1" fill="none" stroke="var(--sum-blue-deep)" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="4" cy="-14" r="4.5" fill="var(--sum-blue-deep)" />
        </g>
      </g>
    </svg>
  );
}
