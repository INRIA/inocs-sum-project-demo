import { useEffect, useMemo, useState } from "react";
import type { CitiesBlock, CityItem, Split } from "../lib/types";
import CityStory from "./CityStory";
import FlipCard from "./FlipCard";
import Modal from "./Modal";
import Sketch from "./Sketch";

// Encodage dans l'URL : #/<arrêt>/<ville> (carte retournée au chargement, pour les QR codes),
// #/<arrêt>/<ville>--histoire (histoire de la ville en modale), #/<arrêt>/<ville>--<mesure> (idem, positionnée sur la mesure).
export const parseSel = (sel: string | null) => {
  const [city, measure] = (sel || "").split("--");
  return { cityId: city || null, measureId: measure && measure !== "histoire" ? measure : null, story: !!measure };
};

export const pct = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 1 }) + " %";
const dir = (s: Split) => (s.after > s.before ? "up" : s.after < s.before ? "down" : "flat");
const glyph = { up: "▲", down: "▼", flat: "＝" };
// La couleur dit le progrès, pas le sens de la flèche : « good » est le sens qui mérite le vert.
const tone = (s: Split, good: "up" | "down") => { const d = dir(s); return d === "flat" ? "flat" : d === good ? "up" : "down"; };

export function Move({ s, years, compact, good = "up" }: { s: Split; years?: number[]; compact?: boolean; good?: "up" | "down" }) {
  const d = dir(s);
  return (
    <div className={"move " + tone(s, good) + (compact ? " compact" : "")}>
      <div className="v"><span className="g" aria-hidden="true">{glyph[d]}</span>{pct(s.before)} <span className="ar">→</span> {pct(s.after)}</div>
      {years && years.length === 2 && years[0] && years[1] && <div className="y">{years[0]} → {years[1]}</div>}
    </div>
  );
}

export function NsmMove({ c, compact }: { c: CityItem; compact?: boolean }) {
  const ms = c.modalSplit;
  return ms && ms.nsm
    ? <Move s={ms.nsm} years={ms.years} compact={compact} />
    : <div className={"move none" + (compact ? " compact" : "")}>NSM : pas encore publié{ms?.note && <div className="y">{ms.note}</div>}</div>;
}

// ---------- Les deux lignes de résultats d'une ville ----------
// Ligne 1 : transports en commun + modes partagés (la somme quand les deux sont publiés) — monter, c'est bien.
// Ligne 2 : voiture individuelle — descendre, c'est bien.
type Kpi = { key: string; icons: string[]; label: string; s: Split; good: "up" | "down" };

export function kpis(c: CityItem): Kpi[] {
  const ms = c.modalSplit;
  if (!ms) return [];
  const out: Kpi[] = [];
  if (ms.pt) {
    const both = !!ms.nsm;
    out.push({
      key: "tc",
      icons: both ? ["bus", "scooter"] : ["bus"],
      label: both ? "Transports en commun + modes partagés" : "Transports en commun (partagés : pas encore publiés)",
      s: both ? { before: ms.pt.before + ms.nsm!.before, after: ms.pt.after + ms.nsm!.after } : ms.pt,
      good: "up",
    });
  }
  if (ms.car) out.push({ key: "car", icons: ["car"], label: "Voiture individuelle", s: ms.car, good: "down" });
  return out;
}

const delta = (k: Kpi | undefined) => (k ? k.s.after - k.s.before : null);
const carDelta = (c: CityItem) => delta(kpis(c).find((k) => k.key === "car"));
const tcDelta = (c: CityItem) => delta(kpis(c).find((k) => k.key === "tc"));
const hasResults = (c: CityItem) => kpis(c).length > 0;

function KpiRow({ c }: { c: CityItem }) {
  const rows = kpis(c);
  const ms = c.modalSplit;
  const years = ms?.years;
  if (rows.length === 0) {
    const kf = c.measures.find((m) => m.keyFigure)?.keyFigure;
    return (
      <div className="kpis none">
        <div className="pending">{ms?.note || "Résultats pas encore publiés"}</div>
        {kf && <div className="kf"><b>{kf.value}</b> {kf.label}</div>}
      </div>
    );
  }
  return (
    <div className="kpis">
      {rows.map((k) => {
        const d = dir(k.s);
        return (
          <div key={k.key} className={"kpi " + tone(k.s, k.good)}>
            <span className="ic" aria-hidden="true">{k.icons.map((n) => <Sketch key={n} name={n} size={24} />)}</span>
            <span className="lb">{k.label}</span>
            <span className="v">
              <span className="g" aria-hidden="true">{glyph[d]}</span>
              {pct(k.s.before)} <span className="ar">→</span> <b>{pct(k.s.after)}</b>
            </span>
          </div>
        );
      })}
      {years && years.length === 2 && years[0] && years[1] && <div className="y">{years[0]} → {years[1]}</div>}
    </div>
  );
}

function CardFront({ c }: { c: CityItem }) {
  return (
    <>
      <div className="top">
        <span className="flag" aria-hidden="true">{c.flag}</span>
        <div>
          <h4>{c.name}</h4>
          <div className="c">{c.country}</div>
        </div>
      </div>
      {c.tagline && <p className="tagline">{c.tagline}</p>}
      <KpiRow c={c} />
    </>
  );
}

// ---------- Tri ----------
type SortKey = "car" | "tc" | "az";
const SORTS: { key: SortKey; label: string; says: string }[] = [
  { key: "car", label: "Voiture ↓", says: "Classées par baisse de la voiture individuelle" },
  { key: "tc", label: "TC + partagés ↑", says: "Classées par hausse des transports en commun et modes partagés" },
  { key: "az", label: "A → Z", says: "Par ordre alphabétique" },
];

function sortCities(items: CityItem[], key: SortKey): CityItem[] {
  const idx = new Map(items.map((c, i) => [c.id, i]));
  const keep = (a: CityItem, b: CityItem) => (idx.get(a.id) || 0) - (idx.get(b.id) || 0);
  const list = [...items];
  if (key === "az") return list.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  // Les villes sans résultats publiés passent à la fin, dans leur ordre d'origine.
  return list.sort((a, b) => {
    const ra = hasResults(a), rb = hasResults(b);
    if (ra !== rb) return ra ? -1 : 1;
    if (!ra) return keep(a, b);
    const da = key === "car" ? carDelta(a) : tcDelta(a);
    const db = key === "car" ? carDelta(b) : tcDelta(b);
    if (da === null || db === null) return da === null ? (db === null ? keep(a, b) : 1) : -1;
    if (da === db) return keep(a, b);
    return key === "car" ? da - db : db - da;   // voiture : la plus forte baisse d'abord ; TC : la plus forte hausse d'abord
  });
}

const shortName = (name: string) => name.split(" (")[0];

type Props = { block: CitiesBlock; sel: string | null; onOpen: (res: string | null) => void; crumb: string };

export default function CityCards({ block, sel, onOpen, crumb }: Props) {
  const { cityId, measureId, story } = parseSel(sel);
  const city = block.items.find((c) => c.id === cityId) || null;
  const [sort, setSort] = useState<SortKey>("car");
  const items = useMemo(() => sortCities(block.items, sort), [block.items, sort]);

  // Cartes retournées : état local (plusieurs à la fois), amorcé par le hash (QR code d'une ville).
  const [open, setOpen] = useState<Set<string>>(() => new Set(city ? [city.id] : []));
  useEffect(() => { if (city) setOpen((s) => (s.has(city.id) ? s : new Set(s).add(city.id))); }, [city]);
  // Lien profond (QR, bandeau de l'arrêt 1) : on amène la carte de la ville sous les yeux, une fois le tiroir ouvert.
  useEffect(() => {
    if (!city || story) return;
    const el = document.getElementById("city-" + city.id); if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => el.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" }), 80);
    return () => clearTimeout(t);
  }, [city, story]);
  const set = (id: string, on: boolean) => setOpen((s) => { const n = new Set(s); on ? n.add(id) : n.delete(id); return n; });

  const jumpTo = (id: string) => {
    const el = document.getElementById("city-" + id); if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    try { el.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" }); } catch { el.scrollIntoView(); }
  };

  return (
    <section className="citywrap" aria-label={block.title}>
      {city && story && (
        <Modal crumbs={[crumb, <><span className="flag" aria-hidden="true">{city.flag}</span> {city.name}</>]} onClose={() => onOpen(null)}>
          <CityStory city={city} block={block} measureId={measureId} />
        </Modal>
      )}
      <h3 className="csec-title">Les neuf villes</h3>
      {block.intro && <p className="cintro">{block.intro}</p>}
      {block.items.length === 0 ? (
        <div className="empty">Contenu en préparation — les villes arrivent bientôt.</div>
      ) : (
        <>
          {/* Téléphone : une rangée de drapeaux pour sauter à une ville sans dérouler les neuf cartes. */}
          <nav className="cjump" aria-label="Aller à une ville">
            {items.map((c) => (
              <button key={c.id} type="button" onClick={() => jumpTo(c.id)}>
                <span className="flag" aria-hidden="true">{c.flag}</span> {shortName(c.name)}
              </button>
            ))}
          </nav>
          <div className="csort">
            <div className="chipsrow" role="group" aria-label="Trier les villes">
              {SORTS.map((s) => (
                <button key={s.key} type="button" className={"sortchip" + (sort === s.key ? " on" : "")}
                        aria-pressed={sort === s.key} onClick={() => setSort(s.key)}>{s.label}</button>
              ))}
            </div>
            <p className="says" aria-live="polite">{SORTS.find((s) => s.key === sort)!.says}</p>
          </div>
          <div className="cardgrid cities">
            {items.map((c) => (
              <FlipCard key={c.id} id={"city-" + c.id} flipped={open.has(c.id)} onFlip={(on) => set(c.id, on)} label={c.name}
                        className={"city" + (hasResults(c) ? "" : " soft")}
                        backTitle={<>{c.flag} {c.name}</>}
                        front={<CardFront c={c} />}
                        back={
                          <>
                            <div className="k">Ce que la ville a fait</div>
                            <ul className="mlist">
                              {c.measures.map((m) => (
                                <li key={m.id}>
                                  <button type="button" onClick={() => onOpen(c.id + "--" + m.id)}>
                                    <span className={"badge " + m.type}>{block.measureTypes[m.type].label}</span>
                                    <span className="t">{m.title}</span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                            {c.measures.length === 0 && <div className="empty">Mesures en préparation.</div>}
                            <div className="cta">
                              <button type="button" className="iconbtn primary" onClick={() => onOpen(c.id + "--histoire")}>Lire l'histoire de {c.name} →</button>
                            </div>
                          </>
                        } />
            ))}
          </div>
        </>
      )}
      <div className="clegend">
        {(["push", "pull"] as const).map((t) => (
          <span key={t} className="lg"><span className={"badge " + t}>{block.measureTypes[t].label}</span> {block.measureTypes[t].description}</span>
        ))}
      </div>
      <div className="src">
        Source : {block.source.presentations}
        {block.source.odp && <> · <a href={block.source.odp} target="_blank" rel="noopener">Open Data Platform ↗</a></>}
      </div>
    </section>
  );
}
