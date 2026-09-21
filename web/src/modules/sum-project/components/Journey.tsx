import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Content, Stop } from "../lib/types";
import CityMap from "./CityMap";
import StopPanel from "./StopPanel";
import Intro from "./Intro";
import Conseil from "./Conseil";
import Ticket from "./Ticket";

const VKEY = "sum-visited";      // arrêts déjà ouverts, par appareil (sessionStorage : remis à zéro d'un groupe à l'autre)
const LKEY = "sum-layout";       // affichage préféré de l'appareil (localStorage : gardé d'un groupe à l'autre)
const PKEY = "sum-presenter";    // mode présentateur de l'appareil (localStorage : gardé d'un groupe à l'autre)
const CONSEIL = "conseil";       // route de l'écran de clôture : #/conseil

// Paramètres d'URL, à mettre dans le QR ou le raccourci du poste :
//   ?layout=carte|large|plein        l'affichage de départ (devient la préférence de l'appareil)
//   ?mode=presentateur|visiteur      le mode de départ (devient la préférence de l'appareil ; touche « p » pour basculer)
//   ?autoplay=1                      l'histoire d'un arrêt (arrêt 1) se lit toute seule, un chapitre toutes les 20 s (grand écran de l'entrée)
// Les deux l'emportent sur ce qui est gardé en mémoire ; sans eux, on reprend la préférence de l'appareil.

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

// L'interrupteur « Présentateur » : greffé dans le bandeau (mode guidé = gros texte, écran épuré, flèches).
function PresenterToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="prestoggle" aria-pressed={on} onClick={onToggle}
            title="Mode présentateur : texte plus grand, écran épuré pour le vidéoprojecteur (touche P)">
      <span className="sw" aria-hidden="true" />
      <span className="lbl">Présentateur</span>
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
  const [presenter, setPresenter] = useState(false);   // mode guidé (vidéoprojecteur) ; relu au montage
  const [slot, setSlot] = useState<HTMLElement | null>(null);  // l'emplacement laissé par le bandeau (rendu par Astro)
  const [visited, setVisited] = useState<Set<string>>(() => new Set());
  const [noanim, setNoanim] = useState(true);  // arrivée directe (QR) : pas de glissement du tiroir
  const [chapter, setChapter] = useState(0);   // arrêt « histoire » : le chapitre ouvert (les flèches le font avancer avant de changer d'arrêt)
  const [autoplay, setAutoplay] = useState(false);
  const lastStopRef = useRef<string | null>(null);
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
  const togglePresenter = useCallback(() => {
    setPresenter((p) => {
      const n = !p;
      try { localStorage.setItem(PKEY, n ? "1" : "0"); } catch {}
      return n;
    });
  }, []);

  // Le mode teint la scène et la racine : le bandeau (hors React) peut se mettre au diapason.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("presenter", presenter);
    return () => root.classList.remove("presenter");
  }, [presenter]);

  // L'interrupteur va se loger dans le bandeau rendu par Astro (pas d'îlot supplémentaire).
  useEffect(() => { setSlot(document.getElementById("presenter-slot")); }, []);

  // routes : #/<stop>, #/<stop>/<ressource> (QR-ables) et #/conseil ; sans hash, le hub montre l'intro
  const apply = useCallback(() => {
    const h = parseHash();
    if (h.stop === CONSEIL) { setStopId(null); setResId(null); setView("conseil"); return; }
    const s = stops.find((x) => x.id === h.stop);
    if (s) {
      setStopId(s.id); setResId(h.res); setView("stop"); markVisited(s.id);
      // l'histoire : chapitre 1 en arrivant sur l'arrêt, ou celui du lien #/<arrêt>/chapitre-<id>
      const hi = s.story && h.res && h.res.startsWith("chapitre-") ? s.story.chapters.findIndex((c) => "chapitre-" + c.id === h.res) : -1;
      const fresh = lastStopRef.current !== s.id; lastStopRef.current = s.id;
      if (hi >= 0) setChapter(hi); else if (fresh) setChapter(0);
      const phone = window.matchMedia("(max-width: 860px)").matches;
      // téléphone : la carte est cachée par défaut (pastille ⤢ en bas à droite), le contenu prend tout l'écran
      if (phone && (s.story || fresh)) setLayout("plein");
      // grand écran : le chapitre s'ouvre dans le volet, pas en modale — le lien devient #/<arrêt>
      if (hi >= 0 && !phone) { setResId(null); history.replaceState(null, "", "#/" + s.id); }
    }
    else { setStopId(null); setResId(null); setView("intro"); }
  }, [stops, markVisited]);

  useEffect(() => {
    const direct = !!parseHash().stop;
    const qs = new URLSearchParams(location.search);

    // Mode : ?mode=presentateur|visiteur l'emporte (et devient la préférence de l'appareil), sinon la préférence gardée.
    let pres = false;
    try { pres = localStorage.getItem(PKEY) === "1"; } catch {}
    const m = qs.get("mode");
    if (m === "presentateur" || m === "visiteur") {
      pres = m === "presentateur";
      try { localStorage.setItem(PKEY, pres ? "1" : "0"); } catch {}
    }
    if (pres) setPresenter(true);
    if (qs.get("autoplay") === "1") setAutoplay(true);

    // Affichage : ?layout=carte|large|plein l'emporte (et devient la préférence de l'appareil), sinon la préférence
    // gardée, sinon « large » en présentateur (le texte prime sur la carte), sinon « plein » quand on arrive droit
    // sur un arrêt (QR à la table).
    let want: Layout = "carte";
    let stored: string | null = null;
    try { stored = localStorage.getItem(LKEY); } catch {}
    const q = qs.get("layout");
    if (isLayout(q)) { want = q; try { localStorage.setItem(LKEY, q); } catch {} }
    else if (isLayout(stored)) want = stored;
    else if (pres) want = "large";
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
      const arrow = e.key === "ArrowLeft" || e.key === "ArrowRight";
      if (!arrow && e.key !== "p") return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      // pas de navigation ni de bascule quand une fiche est ouverte, ni depuis un champ de saisie
      if (resId || document.querySelector(".modal-backdrop")) return;
      const t = e.target as HTMLElement | null;
      const tag = (t?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || t?.isContentEditable) return;
      if (!arrow) { e.preventDefault(); togglePresenter(); return; }   // « p » : présentateur ⇄ visiteur
      if (view !== "stop") return;
      // sur un arrêt « histoire », les flèches parcourent d'abord les chapitres
      const last = stop?.story ? stop.story.chapters.length - 1 : -1;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (last >= 0 && chapter > 0) setChapter(chapter - 1); else if (prev) go(prev.id);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (last >= 0 && chapter < last) setChapter(chapter + 1); else if (next) go(next.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [resId, stopId, view, go, prev, next, togglePresenter, stop, chapter]);

  // « Je suis à une table » : on amène les pastilles sous les yeux (et le clavier dessus).
  // En plein écran les pastilles sont cachées : on revient d'abord à l'affichage « carte ».
  const showLegend = useCallback(() => {
    const flash = (el: HTMLElement | null) => {
      if (!el) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.classList.add("flash");
      // « nearest » : on ne fait défiler que si c'est nécessaire (la scène est un conteneur overflow:hidden)
      try { el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest", inline: "nearest" }); } catch {}
      (el.querySelector("button") as HTMLButtonElement | null)?.focus({ preventScroll: true });
      window.setTimeout(() => el.classList.remove("flash"), 2400);
    };
    // Téléphone : la carte et ses pastilles sont masquées sur le hub — on vise l'escalier d'arrêts.
    const phone = window.matchMedia("(max-width: 860px)").matches;
    if (phone) { flash(document.getElementById("stoplist")); return; }
    if (layout === "plein") { chooseLayout("carte"); window.setTimeout(() => flash(legendRef.current), 60); }
    else flash(legendRef.current);
  }, [layout, chooseLayout]);

  // « Nouvelle partie » : on efface l'état de l'appareil pour le groupe suivant
  const reset = useCallback(() => {
    try {
      sessionStorage.removeItem(VKEY);
      const kill: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && (k.startsWith("sum-sort:") || k.startsWith("sum-steps:"))) kill.push(k);
      }
      kill.forEach((k) => sessionStorage.removeItem(k));
    } catch {}
    setVisited(new Set());
    go(null);
  }, [go]);

  // Depuis l'en-tête : un tap malheureux ne doit pas effacer le programme d'un groupe.
  const askReset = useCallback(() => {
    if (window.confirm("Tout remettre à zéro et recommencer une nouvelle partie ?")) reset();
  }, [reset]);

  const mini = layout === "plein";
  const layoutBtn = <LayoutButton layout={layout} onCycle={cycleLayout} />;
  const parts = stop ? briefParts(stop) : [];

  return (
    <div className={"stage " + layout + (view === "intro" ? " hub" : "") + (presenter ? " presenter" : "")}>
      {slot && createPortal(<PresenterToggle on={presenter} onToggle={togglePresenter} />, slot)}
      <div className={"mapwrap shrunk" + (noanim ? " noanim" : "")}>
        <CityMap stops={stops} activeId={stopId} visited={visited} atEnd={view === "conseil"} mini={mini} onSelect={(id) => go(id)} />
        {mini && (
          <button type="button" className="mapzoom" title="Agrandir la carte" aria-label="Agrandir la carte"
                  onClick={() => chooseLayout("carte")}>
            <svg className="ic-expand" aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7" /></svg>
            {/* téléphone : une carte pliée, plus parlante qu'une flèche */}
            <svg className="ic-map" aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5z" /><path d="M9 4v13.5M15 6.5V20" /></svg>
          </button>
        )}
        {layout === "carte" && (
          <button type="button" className="mapzoom shrink" title="Réduire la carte" aria-label="Réduire la carte"
                  onClick={() => chooseLayout("plein")}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10h-6V4M14 10l7-7M4 14h6v6M10 14l-7 7" /></svg></button>
        )}
        <nav className="legend" aria-label="Arrêts" ref={legendRef}>
          {stops.map((s) => {
            const v = visited.has(s.id);
            return (
              <button key={s.id} type="button" className={v ? "visited" : undefined} aria-current={s.id === stopId}
                      aria-label={`Arrêt ${s.order} : ${s.place}${v ? ", visité" : ""}`} onClick={() => go(s.id)}>
                <span className="n">{s.order}</span><span className="lbl">{s.place}</span>
                {v && <span className="tick" aria-hidden="true">✓</span>}
              </button>
            );
          })}
        </nav>
      </div>

      <section className={"panel open" + (stop ? " stopview" : "") + (noanim ? " noanim" : "")} aria-label="Ressources de l'arrêt">
        {view === "intro" && <Intro content={content} actions={layoutBtn} visited={visited} onSelect={(id) => go(id)} onStart={() => stops[0] && go(stops[0].id)} onChoose={showLegend} />}
        {view === "conseil" && <Conseil content={content} visited={visited} actions={layoutBtn} onGo={go} onReset={reset} />}

        {stop && (
          <>
            <header className="sheet-head">
              <div className="where">
                <div className="eyebrow">Arrêt {stop.order} sur {stops.length} · {stop.place}</div>
                <Ticket stops={stops} visited={visited} activeId={stop.id} onSelect={(id) => go(id)} />
              </div>
              <div className="actions">
                <button className="iconbtn restart" type="button" title="Tout remettre à zéro" onClick={askReset}><span className="rtxt">Nouvelle partie </span>↺</button>
                {prev && <button className="iconbtn back" type="button" onClick={() => go(prev.id)} title={prev.place} aria-label={`Arrêt précédent : ${prev.place}`}>←<span className="ord"> {prev.order}</span></button>}
                {next && <button className="iconbtn primary" type="button" onClick={() => go(next.id)} aria-label={`Arrêt suivant : ${next.place}`}>
                      <span><span className="stxt">Suivant</span><span className="long">{"\u00a0: " + next.place}</span></span> →
                    </button>}
                {layoutBtn}
                {/* <button className="iconbtn close" type="button" aria-label="Fermer" onClick={() => go(null)}>×</button> */}
              </div>
              <h2>{stop.title.replace(/ ([?!:;])/g, " $1")}{stop.badge && <span className="titlebadge">{stop.badge}</span>}</h2>
              {parts.length > 0 && (
                <div className="brief"><b>Table {stop.order}</b>{parts.map((p) => " · " + p).join("")}</div>
              )}
              {/* Le billet : une ligne fine, les arrêts déjà tamponnés restent sous les yeux d'un arrêt à l'autre. */}
            </header>
            <div className={"sheet-body" + (stop.story ? " fill" : "")}>
              <StopPanel stop={stop} content={content} resId={resId} onOpen={(r) => go(stop.id, r)}
                         chapter={chapter} onChapter={setChapter} autoplay={autoplay}
                         onNextStop={() => next && go(next.id)} nextLabel={next ? next.place : "Arrêt suivant"} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
