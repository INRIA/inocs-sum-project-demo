import { useCallback, useEffect, useState } from "react";
import type { Content } from "../lib/types";
import CityMap from "./CityMap";
import StopPanel from "./StopPanel";

function parseHash(): { stop: string | null; res: string | null } {
  const [, stop, res] = (typeof location !== "undefined" ? location.hash : "").split("/");
  return { stop: stop || null, res: res || null };
}

export default function Journey({ content }: { content: Content }) {
  const stops = content.stops;
  const [stopId, setStopId] = useState<string | null>(null);
  const [resId, setResId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [tall, setTall] = useState(false);

  // routes : #/<stop> et #/<stop>/<ressource> (QR-ables)
  useEffect(() => {
    const apply = () => {
      const h = parseHash();
      const s = stops.find((x) => x.id === h.stop);
      if (s) { setStopId(s.id); setResId(h.res); setOpen(true); }
      else { setStopId(null); setResId(null); setOpen(false); }
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, [stops]);

  const go = useCallback((id: string | null, res: string | null = null) => {
    const h = id ? "#/" + id + (res ? "/" + res : "") : "#";
    if (location.hash !== h) location.hash = h; else { setStopId(id); setResId(res); setOpen(!!id); }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { if (resId) go(stopId, null); else go(null); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [resId, stopId, go]);

  const stop = stops.find((s) => s.id === stopId) || null;
  const idx = stop ? stops.indexOf(stop) : -1;
  const next = idx >= 0 && idx < stops.length - 1 ? stops[idx + 1] : null;
  const prev = idx > 0 ? stops[idx - 1] : null;

  return (
    <div className={"stage" + (tall ? " wide" : "")}>
      <div className={"mapwrap" + (open ? " shrunk" : "")}>
        <CityMap stops={stops} activeId={stopId} onSelect={(id) => go(id)} />
        <nav className="legend" aria-label="Arrêts">
          {stops.map((s) => (
            <button key={s.id} type="button" aria-current={s.id === stopId} onClick={() => go(s.id)}>
              <span className="n">{s.order}</span>{s.place}
            </button>
          ))}
        </nav>
      </div>

      <section className={"panel" + (open ? " open" : "")} aria-label="Ressources de l'arrêt" aria-hidden={!open}>
        <div className="grip"><button type="button" aria-label={tall ? "Réduire le panneau" : "Agrandir le panneau"} title={tall ? "Réduire" : "Agrandir"} onClick={() => setTall((t) => !t)}>{tall ? "›" : "‹"}</button></div>
        {stop && (
          <>
            <header className="sheet-head">
              <div>
                <div className="eyebrow">Arrêt {stop.order} · {stop.place}</div>
                <h2>{stop.title.replace(/ ([?!:;])/g, "\u00a0$1")}{stop.badge && <span className="titlebadge">{stop.badge}</span>}</h2>
                <div className="q">{stop.question}</div>
              </div>
              <div className="actions">
                {prev && <button className="iconbtn" type="button" onClick={() => go(prev.id)} title={prev.place}>← {prev.order}</button>}
                {next && <button className="iconbtn primary" type="button" onClick={() => go(next.id)}>Arrêt suivant : {next.place} →</button>}
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
