import { useCallback, useEffect, useRef, useState } from "react";
import type { Content, Stop } from "../lib/types";
import CityMap from "./CityMap";
import StopPanel from "./StopPanel";
import Intro from "./Intro";
import Conseil from "./Conseil";

const VKEY = "sum-visited";      // arrêts déjà ouverts, par appareil (sessionStorage : remis à zéro d'un groupe à l'autre)
const LKEY = "sum-layout";       // affichage préféré de l'appareil (localStorage : gardé d'un groupe à l'autre)
const CONSEIL = "conseil";       // route de l'écran de clôture : #/conseil

// Trois affichages : la carte à droite, le panneau large, ou le plein écran avec la carte en vignette.
export type Layout = "carte" | "large" | "plein";
const LAYOUTS: Layout[] = ["carte", "large", "plein"];
const LAYOUT_LABEL: Record<Layout, string> = { carte: "carte", large: "large", plein: "plein écran" };
const isLayout = (v: unknown): v is Layout => LAYOUTS.includes(v as Layout);

function parseHash(): { stop: string | null; res: string | null } {
  const [, stop, res] = (typeof location !== "undefined" ? location.hash : "").split("/");
  return { stop: stop || null, res: res || null };
}

// Le bouton d'affichage : un seul contrôle qui tourne carte → large → plein écran → carte.
export function LayoutButton({ layout, onCycle }: { layout: Layout; onCycle: () => void }) {
  const next = LAYOUTS[(LAYOUTS.indexOf(layout) + 1) % LAYOUTS.length];
  return (
    <button type="button" className="iconbtn layoutbtn" onClick={onCycle}
            title={"Affichage : carte / large / plein écran"}
            aria-label={`Affichage : ${LAYOUT_LABEL[layout]}. Passer à : ${LAYOUT_LABEL[next]}`}>
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        {next === "carte"
          ? <><path d="M20 10h-6V4M14 10l7-7M4 14h6v6M10 14l-7 7" /></>
          : <><path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7" /></>}
      </svg>
    </button>
  );
}

// La ligne de brief sous le titre : table, animateur, durée, capacité, puis « Ici, vous… ».
function briefParts(stop: Stop): string[] {
  const p: string[] = [];
  if (stop.animator) p.push(`Animateur ${stop.animator}`);
  if (stop.durationMin) p.push(`${stop.durationMin} min`);
  if (stop.capacity) p.push(`≤ ${stop.capacity} pers.`);
  if (stop.brief) p.push(stop.brief);
  return p;
}

export default function Journey({ content }: { content: Content }) {
  const stops = content.stops;
  const [stopId, setStopId] = useState<string | null>(null);
  const [resId, setResId] = useState<string | null>(null);
  const [view, setView] = useState<"intro" | "stop" | "conseil">("intro");
  const [layout, setLayout] = useState<Layout>("carte");
  const [visited, setVisited] = useState<Set<string>>(() => new Set());
  const [noanim, setNoanim] = useState(true);  // arrivée directe (QR) : pas de glissement du tiroir
  const legendRef = useRef<HTMLElement | null>(null);

  // état « visité » relu au montage (avant la route, pour ne pas perdre l'arrêt qu'on vient d'ouvrir)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(VKEY);
      const a = raw ? JSON.parse(raw) : null;
      if (Array.isArray(a)) setVisited((prev) => new Set([...(a as string[]), ...prev]));
    } catch {}
  }, []);

  const markVisited = useCallback((id: string) => {
    setVisited((prev) => {
      if (prev.has(id)) return prev;
      const n = new Set(prev); n.add(id);
      try { sessionStorage.setItem(VKEY, JSON.stringify([...n])); } catch {}
      return n;
    });
  }, []);

  const chooseLayout = useCallback((l: Layout) => {
    setLayout(l);
    try { localStorage.setItem(LKEY, l); } catch {}
  }, []);
  const cycleLayout = useCallback(() => {
    setLayout((l) => {
      const n = LAYOUTS[(LAYOUTS.indexOf(l) + 1) % LAYOUTS.length];
      try { localStorage.setItem(LKEY, n); } catch {}
      return n;
    });
  }, []);

  // routes : #/<stop>, #/<stop>/<ressource> (QR-ables) et #/conseil ; sans hash, le hub montre l'intro
  const apply = useCallback(() => {
    const h = parseHash();
    if (h.stop === CONSEIL) { setStopId(null); setResId(null); setView("conseil"); return; }
    const s = stops.find((x) => x.id === h.stop);
    if (s) { setStopId(s.id); setResId(h.res); setView("stop"); markVisited(s.id); }
    else { setStopId(null); setResId(null); setView("intro"); }
  }, [stops, markVisited]);

  useEffect(() => {
    const direct = !!parseHash().stop;

    // Affichage : ?layout=carte|large|plein l'emporte (et devient la préférence de l'appareil),
    // sinon la préférence gardée, sinon « plein » quand on arrive droit sur un arrêt (QR à la table).
    let want: Layout = "carte";
    let stored: string | null = null;
    try { stored = localStorage.getItem(LKEY); } catch {}
    const q = new URLSearchParams(location.search).get("layout");
    if (isLayout(q)) { want = q; try { localStorage.setItem(LKEY, q); } catch {} }
    else if (isLayout(stored)) want = stored;
    else if (direct) want = "plein";
    if (want !== "carte") setLayout(want);

    setNoanim(direct || want !== "carte");
    apply();
    let r2 = 0;
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setNoanim(false)); });
    window.addEventListener("hashchange", apply);
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); window.removeEventListener("hashchange", apply); };
  }, [apply]);

  const go = useCallback((id: string | null, res: string | null = null) => {
    const h = id ? "#/" + id + (res ? "/" + res : "") : "#";
    if (location.hash !== h) location.hash = h; else apply();
  }, [apply]);

  const stop = view === "stop" ? stops.find((s) => s.id === stopId) || null : null;
  const idx = stop ? stops.indexOf(stop) : -1;
  const next = idx >= 0 && idx < stops.length - 1 ? stops[idx + 1] : null;
  const prev = idx > 0 ? stops[idx - 1] : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (resId) go(stopId, null); else if (view !== "intro") go(null);
        return;
      }
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      // pas de navigation quand une fiche est ouverte, ni depuis un champ de saisie
      if (resId || document.querySelector(".modal-backdrop")) return;
      const t = e.target as HTMLElement | null;
      const tag = (t?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || t?.isContentEditable) return;
      if (view !== "stop") return;
      if (e.key === "ArrowLeft" && prev) { e.preventDefault(); go(prev.id); }
      if (e.key === "ArrowRight") { e.preventDefault(); go(next ? next.id : CONSEIL); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [resId, stopId, view, go, prev, next]);

  // « Je suis à une table » : on amène les pastilles sous les yeux (et le clavier dessus).
  // En plein écran les pastilles sont cachées : on revient d'abord à l'affichage « carte ».
  const showLegend = useCallback(() => {
    const flash = () => {
      const el = legendRef.current; if (!el) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.classList.add("flash");
      // « nearest » : on ne fait défiler que si c'est nécessaire (la scène est un conteneur overflow:hidden)
      try { el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest", inline: "nearest" }); } catch {}
      (el.querySelector("button") as HTMLButtonElement | null)?.focus({ preventScroll: true });
      window.setTimeout(() => el.classList.remove("flash"), 2400);
    };
    if (layout === "plein") { chooseLayout("carte"); window.setTimeout(flash, 60); } else flash();
  }, [layout, chooseLayout]);

  // « Nouvelle partie » : on efface l'état de l'appareil pour le groupe suivant
  const reset = useCallback(() => {
    try {
      sessionStorage.removeItem(VKEY);
      const kill: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith("sum-sort:")) kill.push(k);
      }
      kill.forEach((k) => sessionStorage.removeItem(k));
    } catch {}
    setVisited(new Set());
    go(null);
  }, [go]);

  const mini = layout === "plein";
  const layoutBtn = <LayoutButton layout={layout} onCycle={cycleLayout} />;
  const parts = stop ? briefParts(stop) : [];

  return (
    <div className={"stage " + layout}>
      <div className={"mapwrap shrunk" + (noanim ? " noanim" : "")}>
        <CityMap stops={stops} activeId={stopId} visited={visited} atEnd={view === "conseil"} mini={mini} onSelect={(id) => go(id)} />
        {mini && (
          <button type="button" className="mapzoom" title="Agrandir la carte" aria-label="Agrandir la carte"
                  onClick={() => chooseLayout("carte")}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7" /></svg></button>
        )}
        <nav className="legend" aria-label="Arrêts" ref={legendRef}>
          {stops.map((s) => {
            const v = visited.has(s.id);
            return (
              <button key={s.id} type="button" className={v ? "visited" : undefined} aria-current={s.id === stopId}
                      aria-label={`Arrêt ${s.order} : ${s.place}${v ? ", visité" : ""}`} onClick={() => go(s.id)}>
                <span className="n">{s.order}</span>{s.place}
                {v && <span className="tick" aria-hidden="true">✓</span>}
              </button>
            );
          })}
          <button type="button" className="fin" aria-current={view === "conseil"}
                  aria-label="Le conseil municipal, fin du trajet" onClick={() => go(CONSEIL)}>
            <span className="n" aria-hidden="true">⚑</span>Le conseil
          </button>
        </nav>
      </div>

      <section className={"panel open" + (noanim ? " noanim" : "")} aria-label="Ressources de l'arrêt">
        {view === "intro" && <Intro content={content} actions={layoutBtn} onStart={() => stops[0] && go(stops[0].id)} onChoose={showLegend} />}
        {view === "conseil" && <Conseil content={content} visited={visited} actions={layoutBtn} onGo={go} onReset={reset} />}

        {stop && (
          <>
            <header className="sheet-head">
              <div className="eyebrow">Arrêt {stop.order} sur {stops.length} · {stop.place}</div>
              <div className="actions">
                {prev && <button className="iconbtn" type="button" onClick={() => go(prev.id)} title={prev.place} aria-label={`Arrêt précédent : ${prev.place}`}>← {prev.order}</button>}
                {next
                  ? <button className="iconbtn primary" type="button" onClick={() => go(next.id)} aria-label={`Arrêt suivant : ${next.place}`}>
                      <span>Suivant<span className="long">{"\u00a0: " + next.place}</span></span> →
                    </button>
                  : <button className="iconbtn primary" type="button" onClick={() => go(CONSEIL)} aria-label="Le conseil municipal">
                      <span className="long">Le conseil municipal</span><span className="short" aria-hidden="true">Le conseil</span> →
                    </button>}
                {layoutBtn}
                <button className="iconbtn close" type="button" aria-label="Fermer" onClick={() => go(null)}>×</button>
              </div>
              <h2>{stop.title.replace(/ ([?!:;])/g, " $1")}{stop.badge && <span className="titlebadge">{stop.badge}</span>}</h2>
              {parts.length > 0 && (
                <div className="brief"><b>Table {stop.order}</b>{parts.map((p) => " · " + p).join("")}</div>
              )}
            </header>
            <div className="sheet-body">
              <StopPanel stop={stop} content={content} resId={resId} onOpen={(r) => go(stop.id, r)} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
