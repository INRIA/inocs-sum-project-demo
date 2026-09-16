import { useEffect, useState } from "react";
import type { CitiesBlock, CityItem, Split } from "../lib/types";
import CityStory from "./CityStory";
import FlipCard from "./FlipCard";
import Modal from "./Modal";

// Encodage dans l'URL : #/<arrêt>/<ville> (carte retournée au chargement, pour les QR codes),
// #/<arrêt>/<ville>--histoire (histoire de la ville en modale), #/<arrêt>/<ville>--<mesure> (idem, positionnée sur la mesure).
export const parseSel = (sel: string | null) => {
  const [city, measure] = (sel || "").split("--");
  return { cityId: city || null, measureId: measure && measure !== "histoire" ? measure : null, story: !!measure };
};

export const pct = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 1 }) + " %";
const dir = (s: Split) => (s.after > s.before ? "up" : s.after < s.before ? "down" : "flat");
const glyph = { up: "▲", down: "▼", flat: "＝" };

export function Move({ s, years, compact }: { s: Split; years?: number[]; compact?: boolean }) {
  const d = dir(s);
  return (
    <div className={"move " + d + (compact ? " compact" : "")}>
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

function CardFront({ c }: { c: CityItem }) {
  const ms = c.modalSplit;
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
      <div className="k">Mobilité partagée (NSM)</div>
      <NsmMove c={c} />
      {ms && !ms.nsm && ms.pt && (
        <div className="second">
          <span>Transports en commun</span> <b>{pct(ms.pt.before)} → {pct(ms.pt.after)}</b>
          {ms.years && ms.years.length === 2 && <i> ({ms.years[0]} → {ms.years[1]})</i>}
        </div>
      )}
    </>
  );
}

type Props = { block: CitiesBlock; sel: string | null; onOpen: (res: string | null) => void; crumb: string };

export default function CityCards({ block, sel, onOpen, crumb }: Props) {
  const { cityId, measureId, story } = parseSel(sel);
  const city = block.items.find((c) => c.id === cityId) || null;

  // Cartes retournées : état local (plusieurs à la fois), amorcé par le hash (QR code d'une ville).
  const [open, setOpen] = useState<Set<string>>(() => new Set(city ? [city.id] : []));
  useEffect(() => { if (city) setOpen((s) => (s.has(city.id) ? s : new Set(s).add(city.id))); }, [city]);
  const set = (id: string, on: boolean) => setOpen((s) => { const n = new Set(s); on ? n.add(id) : n.delete(id); return n; });

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
        <div className="cardgrid cities">
          {block.items.map((c) => (
            <FlipCard key={c.id} flipped={open.has(c.id)} onFlip={(on) => set(c.id, on)} label={c.name} className="city"
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
