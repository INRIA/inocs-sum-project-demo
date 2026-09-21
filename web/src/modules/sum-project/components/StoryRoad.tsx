import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as RPointerEvent } from "react";
import { assetUrl } from "../../../infrastructure/assetUrl";
import type { CityItem, Content, Story, StoryChapter } from "../lib/types";
import { drive, easeInOut, fractionsFor, linear, placeMarker, reducedMotion } from "../lib/road";
import Bike from "./Bike";
import Chart from "./Charts";
import Picto from "./Pictos";

// « La route de SUM » : l'histoire d'un arrêt en chapitres. À gauche une route qui descend, un disque par chapitre,
// le vélo garé au chapitre ouvert ; à droite le chapitre. « Lecture auto » fait rouler le vélo d'un disque au
// suivant en `autoplaySec` secondes. Sur téléphone la route se couche au-dessus d'une carte-résumé, et le
// chapitre se lit dans la modale (#/<arrêt>/chapitre-<id>).

export const CHAPTER_PREFIX = "chapitre-";

// Deux routes : debout (grand écran, viewBox 360 × 720, du haut vers le bas) et couchée (téléphone, 720 × 150).
const ROAD_V = "M 170 30 C 60 90, 60 90, 190 150 C 320 210, 300 230, 170 280 C 40 330, 60 350, 190 410 C 320 470, 260 500, 150 540 C 40 580, 60 660, 190 690";
const ROAD_H = "M 30 92 C 110 30, 190 30, 260 92 S 400 150, 490 92 S 620 30, 690 92";
const PARK_V = 36;   // le vélo s'arrête juste avant le disque
const PARK_H = 62;

type RailProps = {
  chapters: StoryChapter[]; chapter: number; seen: Set<string>;
  progress: number;          // avancement de la lecture auto vers le chapitre suivant (0 … 1)
  onPick: (i: number) => void; horizontal?: boolean;
};

// Une route : les disques, les étiquettes, le vélo, et le tronçon qui verdit pendant la lecture auto.
function Rail({ chapters, chapter, seen, progress, onPick, horizontal = false }: RailProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const bikeRef = useRef<SVGGElement>(null);
  const progRef = useRef<SVGPathElement>(null);
  const lenRef = useRef(0);
  const cancelRef = useRef<() => void>(() => {});
  const [pts, setPts] = useState<{ x: number; y: number; right: boolean; push: number }[]>([]);
  const [segD, setSegD] = useState("");
  const n = chapters.length;
  const park = horizontal ? PARK_H : PARK_V;
  const lift = horizontal ? 18 : 24;

  // positions des chapitres sur la route
  useEffect(() => {
    const p = pathRef.current; if (!p) return;
    const L = p.getTotalLength();
    // l'étiquette du côté libre de la route (route debout) ; si le vélo se gare de ce côté, elle s'écarte un peu
    setPts(fractionsFor(n).map((f) => {
      const q = p.getPointAtLength(L * f); const b = p.getPointAtLength(Math.max(0, L * f - park));
      const right = q.x < 180;
      const push = (right && b.x > q.x + 8) || (!right && b.x < q.x - 8) ? 30 : 0;
      return { x: q.x, y: q.y, right, push };
    }));
  }, [n, horizontal, park]);

  // le tronçon du chapitre ouvert au suivant, échantillonné en polyligne (il se remplit pendant la lecture auto)
  useEffect(() => {
    const p = pathRef.current; if (!p) return;
    const L = p.getTotalLength(); const FR = fractionsFor(n);
    if (chapter >= n - 1) { setSegD(""); return; }
    const a = L * FR[chapter], b = L * FR[chapter + 1];
    const steps = 24; const pts: string[] = [];
    for (let k = 0; k <= steps; k++) { const q = p.getPointAtLength(a + ((b - a) * k) / steps); pts.push(`${q.x.toFixed(1)} ${q.y.toFixed(1)}`); }
    setSegD("M " + pts.join(" L "));
  }, [chapter, n, horizontal]);

  // le vélo : d'un coup de pédale vers le disque choisi, ou pas à pas vers le suivant pendant la lecture auto
  useEffect(() => {
    const p = pathRef.current, g = bikeRef.current; if (!p || !g) return;
    const L = p.getTotalLength(); const FR = fractionsFor(n);
    const start = L * FR[chapter] - park;
    const end = chapter < n - 1 ? L * FR[chapter + 1] - park : start;
    const target = start + (end - start) * progress;
    const from = lenRef.current;
    const dist = Math.abs(target - from);
    const tick = progress > 0 && target > from && dist <= (end - start) / 2 + 1;   // une seconde de lecture auto
    const dur = reducedMotion() ? 0 : tick ? 1000 : Math.min(1600, Math.max(450, dist * 2));
    cancelRef.current();
    const seg = end - start;
    cancelRef.current = drive(from, target, dur, (len) => {
      lenRef.current = len; placeMarker(p, g, len, lift, horizontal ? 0.6 : 0.35);
      if (progRef.current) progRef.current.setAttribute("stroke-dashoffset", String(seg > 0 ? 1 - Math.max(0, Math.min(1, (len - start) / seg)) : 1));
    }, tick ? linear : easeInOut);
    return () => cancelRef.current();
  }, [chapter, progress, n, park, lift, horizontal]);

  const stampSize = (s: string) => (s.length <= 2 ? 20 : s.length <= 4 ? 15 : 12);

  return (
    <svg className={"road " + (horizontal ? "h" : "v")} viewBox={horizontal ? "0 0 720 150" : "0 0 360 720"} preserveAspectRatio="xMidYMid meet"
         role="group" aria-label={`La route de l'histoire : ${n} chapitres`}>
      <path className="roadbed" d={horizontal ? ROAD_H : ROAD_V} />
      <path ref={pathRef} className="center" d={horizontal ? ROAD_H : ROAD_V} />
      {segD && <path ref={progRef} className="prog" d={segD} pathLength={1} strokeDasharray="1" strokeDashoffset={1} />}
      {pts.map((p, i) => {
        const c = chapters[i]; if (!c) return null;
        const active = i === chapter; const done = seen.has(c.id) && !active;
        const right = p.right; const lx = (40 + p.push) * (right ? 1 : -1);
        return (
          <g key={c.id} className={"st" + (active ? " active" : "") + (done ? " seen" : "")} transform={`translate(${p.x} ${p.y})`}
             role="button" tabIndex={0} aria-label={`Chapitre ${i + 1} : ${c.kicker}${done ? ", vu" : ""}`} aria-current={active}
             onClick={() => onPick(i)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(i); } }}>
            <circle className="hit" r={horizontal ? 40 : 34} />
            <circle className="ring" r="26" />
            <circle className="disc" r="26" />
            <text className="stamp" style={{ fontSize: stampSize(c.stamp) }}>{c.stamp}</text>
            {done && (
              <g className="tick" transform="translate(19 -19)" aria-hidden="true">
                <circle r="10" fill="#fff" stroke="var(--sum-green-deep)" strokeWidth="2.5" />
                <path d="M-4 0 L-1 3.5 L4.5 -3.5" fill="none" stroke="var(--sum-green-deep)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            )}
            {horizontal
              ? <text className="klbl" y="46" textAnchor="middle" style={{ fontSize: 15 }}>{c.kickerShort || c.kicker}</text>
              : <text className="klbl" x={lx} textAnchor={right ? "start" : "end"}>{c.kickerShort || c.kicker}</text>}
          </g>
        );
      })}
      <Bike ref={bikeRef} scale={horizontal ? 1.1 : 1.15} />
    </svg>
  );
}

// ---- Le corps d'un chapitre : image, pictos, graphiques, exemples, villes, lignes. Même rendu dans le volet et dans la modale.
function Example({ city, measure, caption }: { city: CityItem; measure?: string; caption?: string }) {
  const m = measure ? city.measures.find((x) => x.id === measure) : undefined;
  const img = m?.images?.find((i) => i.src) || city.hero;
  const href = "#/destination/" + city.id + (m ? "--" + m.id : "--histoire");
  return (
    <li>
      <a className="ex" href={href} aria-label={`${city.name} : ${m ? m.title : city.tagline} — voir la ville`}>
        {img ? <img src={assetUrl(img.src)} alt="" loading="lazy" /> : <div className="ph" aria-hidden="true">{city.flag}</div>}
        <span className="who"><span aria-hidden="true">{city.flag}</span>{city.name}</span>
        {m?.keyFigure && <span className="kf">{m.keyFigure.value}<small>{m.keyFigure.label}</small></span>}
        <span className="mt">{caption || (m ? m.title : city.tagline)}</span>
      </a>
    </li>
  );
}

export function ChapterBody({ c, content }: { c: StoryChapter; content: Content }) {
  const cities = content.cities.items;
  return (
    <div className="body">
      {c.image && (
        <figure className={"pic" + (c.image.src.endsWith(".png") ? " fit" : "")}>
          <img src={assetUrl(c.image.src)} alt={c.image.alt || c.image.caption} />
          {c.image.caption && <figcaption>{c.image.caption}</figcaption>}
        </figure>
      )}
      {c.images && c.images.length > 0 && (
        <div className="hero2">
          {c.images.map((im) => (
            <figure key={im.src} className={"pic" + (im.src.endsWith(".png") ? " fit" : "")}>
              <img src={assetUrl(im.src)} alt={im.alt || im.caption} />
              {im.caption && <figcaption>{im.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )}
      {c.stats && (
        <ul className="stats">
          {c.stats.map((k) => <li key={k.label}><b>{k.value}</b><span>{k.label}</span></li>)}
        </ul>
      )}
      {c.icons && (
        <div className="pictos">
          {c.icons.map((i) => <div key={i.name}><Picto name={i.name} size={40} /><span>{i.label}</span></div>)}
        </div>
      )}
      {c.cards && (
        <ul className="lcards">
          {c.cards.map((k) => (
            <li key={k.title}><Picto name={k.icon} size={34} /><b>{k.title}</b><span>{k.text}</span></li>
          ))}
        </ul>
      )}
      {(c.charts || []).map((ch, k) => <Chart key={k} chart={ch} />)}
      {c.examples && (
        <ul className="examples">
          {c.examples.map((e) => { const city = cities.find((x) => x.id === e.city); return city ? <Example key={e.city + (e.measure || "")} city={city} measure={e.measure} caption={e.caption} /> : null; })}
        </ul>
      )}
      {c.cities && (
        <div className="cityrow" aria-label="Les neuf villes">
          {cities.map((x) => (
            <a key={x.id} className="cthumb" href={"#/destination/" + x.id} aria-label={`${x.name}, ${x.country} — voir la ville`}>
              {x.hero ? <img src={assetUrl(x.hero.src)} alt="" loading="lazy" /> : <span className="ph" aria-hidden="true">{x.flag}</span>}
              <span><span aria-hidden="true">{x.flag}</span> {x.name}</span>
            </a>
          ))}
        </div>
      )}
      {c.lines && c.lines.length > 0 && <ul className="blines">{c.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>}
      {c.highlights && c.highlights.length > 0 && <ul className="hlights">{c.highlights.map((l, i) => <li key={i}>{l}</li>)}</ul>}
      {c.source && <p className="src"><em><a href={c.source.url} target="_blank" rel="noopener">{c.source.label}</a></em></p>}
    </div>
  );
}

function ChapterCta({ c, onOpen }: { c: StoryChapter; onOpen: (id: string) => void }) {
  if (!c.resource && !(c.links && c.links.length)) return null;
  return (
    <div className="cta">
      {c.resource && <button type="button" className="iconbtn primary" onClick={() => onOpen(c.resource!)}>En savoir plus →</button>}
      {(c.links || []).map((l) => l.url.startsWith("#")
        ? <a key={l.url} className="iconbtn" href={l.url}>{l.label} →</a>
        : <a key={l.url} className="iconbtn" href={l.url} target="_blank" rel="noopener">{l.label} ↗</a>)}
    </div>
  );
}

function Figure({ c }: { c: StoryChapter }) {
  if (!c.figure) return null;
  return (
    <div className="fig">
      <div className={"n" + (c.figure.length > 5 ? " long" : "")}>{c.figure}</div>
      {c.figureLabel && <div className="l">{c.figureLabel}</div>}
    </div>
  );
}

// Le chapitre en modale (téléphone, ou lien profond #/<arrêt>/chapitre-<id>) : tout le chapitre, et de quoi passer au suivant.
export function ChapterDetail({ story, index, content, onOpen }: { story: Story; index: number; content: Content; onOpen: (id: string) => void }) {
  const c = story.chapters[index]; const n = story.chapters.length;
  const prev = index > 0 ? story.chapters[index - 1] : null;
  const next = index < n - 1 ? story.chapters[index + 1] : null;
  return (
    <article className="schap detail-chap">
      <div className="k">Chapitre {index + 1} sur {n} · {c.kicker}</div>
      <h3>{c.title}</h3>
      <Figure c={c} />
      {c.teaser && <p className="t">{c.teaser}</p>}
      <ChapterBody c={c} content={content} />
      <ChapterCta c={c} onOpen={onOpen} />
      <nav className="chapnav" aria-label="Chapitres">
        {prev ? <button type="button" className="iconbtn" onClick={() => onOpen(CHAPTER_PREFIX + prev.id)}>‹ {prev.kickerShort || prev.kicker}</button> : <span />}
        {next && <button type="button" className="iconbtn primary" onClick={() => onOpen(CHAPTER_PREFIX + next.id)}>{next.kickerShort || next.kicker} ›</button>}
      </nav>
    </article>
  );
}

// ---- Le bloc complet : route + chapitre + lecture auto.
type Props = {
  story: Story; content: Content;
  chapter: number; onChapter: (i: number) => void;
  autoplay: boolean;          // ?autoplay=1 : la lecture démarre à l'arrivée
  paused: boolean;            // une modale est ouverte : la lecture attend
  onOpen: (id: string) => void;
  onNextStop: () => void; nextLabel: string;
};

export default function StoryRoad({ story, content, chapter, onChapter, autoplay, paused, onOpen, onNextStop, nextLabel }: Props) {
  const chapters = story.chapters;
  const n = chapters.length; const last = n - 1;
  const sec = story.autoplaySec ?? 20;
  const c = chapters[Math.max(0, Math.min(last, chapter))];
  const [playing, setPlaying] = useState(false);
  const [remaining, setRemaining] = useState(sec);
  const [seen, setSeen] = useState<Set<string>>(() => new Set());
  const swipe = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => { if (autoplay) setPlaying(true); }, [autoplay]);
  useEffect(() => {
    setRemaining(sec);
    setSeen((s) => (s.has(c.id) ? s : new Set(s).add(c.id)));
  }, [c.id, sec]);
  useEffect(() => { if (chapter >= last) setPlaying(false); }, [chapter, last]);

  // la lecture auto : un compte à rebours d'une seconde, le chapitre suivant à zéro
  const active = playing && !paused && chapter < last;
  useEffect(() => {
    if (!active) return;
    const iv = window.setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => window.clearInterval(iv);
  }, [active, chapter]);
  // à zéro : chapitre suivant, et le compte repart tout de suite (sinon le même zéro ferait avancer deux fois)
  useEffect(() => { if (active && remaining <= 0) { setRemaining(sec); onChapter(chapter + 1); } }, [remaining, active, chapter, sec, onChapter]);
  useEffect(() => {
    const onVis = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  // Espace : lecture / pause (pas depuis un champ ni un bouton, pas quand une modale est ouverte)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== " " || e.metaKey || e.ctrlKey || e.altKey) return;
      if (paused || document.querySelector(".modal-backdrop")) return;
      const t = e.target as HTMLElement | null; const tag = (t?.tagName || "").toLowerCase();
      if (["input", "textarea", "select", "button", "a"].includes(tag) || t?.isContentEditable) return;
      e.preventDefault();
      if (chapter < last) setPlaying((p) => !p);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paused, chapter, last]);

  const pick = useCallback((i: number) => { onChapter(Math.max(0, Math.min(last, i))); }, [onChapter, last]);
  const progress = chapter < last ? Math.max(0, Math.min(1, (sec - remaining) / sec)) : 0;

  // un glissement horizontal sur la carte-résumé (téléphone) change de chapitre
  const onDown = (e: RPointerEvent) => { swipe.current = { x: e.clientX, y: e.clientY }; };
  const onUp = (e: RPointerEvent) => {
    const s = swipe.current; swipe.current = null; if (!s) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (Math.abs(dx) >= 40 && Math.abs(dy) < 30) pick(chapter + (dx < 0 ? 1 : -1));
  };

  const atEnd = chapter >= last;
  return (
    <div className="roadstory" onClickCapture={(e) => { if (!(e.target as HTMLElement).closest(".playbtn")) setPlaying(false); }}>
      <aside className="srail">
        <Rail chapters={chapters} chapter={chapter} seen={seen} progress={progress} onPick={pick} />
        <Rail chapters={chapters} chapter={chapter} seen={seen} progress={progress} onPick={pick} horizontal />
        <div className="ctl">
          {!atEnd && (
            <button type="button" className={"iconbtn playbtn" + (playing ? " on" : "")} aria-pressed={playing}
                    onClick={() => setPlaying((p) => !p)} title={`Un chapitre toutes les ${sec} secondes (Espace)`}>
              {playing ? "❚❚ Pause" : "▶ Lecture auto"}
            </button>
          )}
          {!atEnd && playing && <span className="count" aria-live="off">{remaining} s</span>}
          {atEnd && <button type="button" className="iconbtn primary playbtn" onClick={onNextStop}>Suivant{" "}: {nextLabel} →</button>}
          {atEnd && <button type="button" className="iconbtn ghost" onClick={() => pick(0)}>↺ Depuis le début</button>}
          {!atEnd && <span className="hint">Touchez une étape</span>}
        </div>
      </aside>

      <section key={c.id} className="schap" aria-live="polite" onPointerDown={onDown} onPointerUp={onUp}>
        <div className="k">Présentation SUM · {chapter + 1}/{n} · {c.kicker}</div>
        <h3>{c.title}</h3>
        <Figure c={c} />
        {c.teaser && <p className="t">{c.teaser}</p>}
        <ChapterBody c={c} content={content} />
        <ChapterCta c={c} onOpen={onOpen} />
        {/* téléphone : le chapitre se lit dans la modale, et ‹ › changent de chapitre */}
        <nav className="mnav" aria-label="Chapitres">
          <button type="button" className="iconbtn" disabled={chapter === 0} aria-label="Chapitre précédent" onClick={() => pick(chapter - 1)}>‹</button>
          <button type="button" className="iconbtn primary" onClick={() => onOpen(CHAPTER_PREFIX + c.id)}>Lire le chapitre →</button>
          <button type="button" className="iconbtn" disabled={atEnd} aria-label="Chapitre suivant" onClick={() => pick(chapter + 1)}>›</button>
        </nav>
      </section>
    </div>
  );
}
