import { useCallback, useEffect, useRef, useState } from "react";
import type { Content } from "../lib/types";
import CityMap from "./CityMap";
import StopPanel from "./StopPanel";
import Intro from "./Intro";
import Conseil from "./Conseil";

const VKEY = "sum-visited";      // arrêts déjà ouverts, par appareil (sessionStorage : remis à zéro d'un groupe à l'autre)
const CONSEIL = "conseil";       // route de l'écran de clôture : #/conseil

function parseHash(): { stop: string | null; res: string | null } {
  const [, stop, res] = (typeof location !== "undefined" ? location.hash : "").split("/");
  return { stop: stop || null, res: res || null };
}

export default function Journey({ content }: { content: Content }) {
  const stops = content.stops;
  const [stopId, setStopId] = useState<string | null>(null);
  const [resId, setResId] = useState<string | null>(null);
  const [view, setView] = useState<"intro" | "stop" | "conseil">("intro");
  const [tall, setTall] = useState(false);
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
    setNoanim(direct);
    apply();
    let r2 = 0;
    const r1 = direct ? requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setNoanim(false)); }) : 0;
    window.addEventListener("hashchange", apply);
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); window.removeEventListener("hashchange", apply); };
  }, [apply]);

  const go = useCallback((id: string | null, res: string | null = null) => {
    const h = id ? "#/" + id + (res ? "/" + res : "") : "#";
    if (location.hash !== h) location.hash = h; else apply();
  }, [apply]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (resId) go(stopId, null); else if (view !== "intro") go(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [resId, stopId, view, go]);

  // « Je suis à une table » : on amène les pastilles sous les yeux (et le clavier dessus)
  const showLegend = useCallback(() => {
    const el = legendRef.current; if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.classList.add("flash");
    // « nearest » : on ne fait défiler que si c'est nécessaire (la scène est un conteneur overflow:hidden)
    try { el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest", inline: "nearest" }); } catch {}
    (el.querySelector("button") as HTMLButtonElement | null)?.focus({ preventScroll: true });
    window.setTimeout(() => el.classList.remove("flash"), 2400);
  }, []);

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

  const stop = view === "stop" ? stops.find((s) => s.id === stopId) || null : null;
  const idx = stop ? stops.indexOf(stop) : -1;
  const next = idx >= 0 && idx < stops.length - 1 ? stops[idx + 1] : null;
  const prev = idx > 0 ? stops[idx - 1] : null;

  return (
    <div className={"stage" + (tall ? " wide" : "")}>
      <div className={"mapwrap shrunk" + (noanim ? " noanim" : "")}>
        <CityMap stops={stops} activeId={stopId} visited={visited} atEnd={view === "conseil"} onSelect={(id) => go(id)} />
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
        <div className="grip"><button type="button" aria-label={tall ? "Réduire le panneau" : "Agrandir le panneau"} title={tall ? "Réduire" : "Agrandir"} onClick={() => setTall((t) => !t)}>{tall ? "›" : "‹"}</button></div>

        {view === "intro" && <Intro content={content} onStart={() => stops[0] && go(stops[0].id)} onChoose={showLegend} />}
        {view === "conseil" && <Conseil content={content} visited={visited} onGo={go} onReset={reset} />}

        {stop && (
          <>
            <header className="sheet-head">
              <div>
                <div className="eyebrow">Arrêt {stop.order} sur {stops.length} · {stop.place}</div>
                <h2>{stop.title.replace(/ ([?!:;])/g, " $1")}{stop.badge && <span className="titlebadge">{stop.badge}</span>}</h2>
                {stop.brief && (
                  <div className="brief">
                    <b>Table {stop.order}</b>{stop.durationMin ? ` · ${stop.durationMin} min` : ""} · {stop.brief}
                  </div>
                )}
                <div className="q">{stop.question}</div>
              </div>
              <div className="actions">
                {prev && <button className="iconbtn" type="button" onClick={() => go(prev.id)} title={prev.place}>← {prev.order}</button>}
                {next
                  ? <button className="iconbtn primary" type="button" onClick={() => go(next.id)}>Arrêt suivant{" "}: {next.place} →</button>
                  : <button className="iconbtn primary" type="button" onClick={() => go(CONSEIL)}>Le conseil municipal →</button>}
                <button className="iconbtn close" type="button" aria-label="Fermer" onClick={() => go(null)}>×</button>
              </div>
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
