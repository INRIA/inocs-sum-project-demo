import { useEffect } from "react";
import type { CitiesBlock, CityItem, Split } from "../lib/types";
import MeasureDetail from "./MeasureDetail";

// Encodage dans l'URL : #/arret-de-tram/<ville> (carte retournée), #/arret-de-tram/<ville>--<mesure> (fiche).
export const parseSel = (sel: string | null) => {
  const [city, measure] = (sel || "").split("--");
  return { cityId: city || null, measureId: measure || null };
};

const pct = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 1 }) + " %";
const dir = (s: Split) => (s.after > s.before ? "up" : s.after < s.before ? "down" : "flat");
const glyph = { up: "▲", down: "▼", flat: "＝" };

function Move({ s, years }: { s: Split; years?: number[] }) {
  const d = dir(s);
  return (
    <div className={"move " + d}>
      <div className="v"><span className="g" aria-hidden="true">{glyph[d]}</span>{pct(s.before)} <span className="ar">→</span> {pct(s.after)}</div>
      {years && years.length === 2 && <div className="y">{years[0]} → {years[1]}</div>}
    </div>
  );
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
      {ms && ms.nsm
        ? <Move s={ms.nsm} years={ms.years} />
        : <div className="move none">NSM : pas encore publié{ms?.note && <div className="y">{ms.note}</div>}</div>}
      {ms && !ms.nsm && ms.pt && (
        <div className="second">
          <span>Transports en commun</span> <b>{pct(ms.pt.before)} → {pct(ms.pt.after)}</b>
          {ms.years && ms.years.length === 2 && <i> ({ms.years[0]} → {ms.years[1]})</i>}
        </div>
      )}
      <div className="hint">Toucher pour voir les mesures ↻</div>
    </>
  );
}

type Props = { block: CitiesBlock; sel: string | null; onOpen: (res: string | null) => void };

export default function CityCards({ block, sel, onOpen }: Props) {
  const { cityId, measureId } = parseSel(sel);
  const city = block.items.find((c) => c.id === cityId) || null;
  const measure = (city && city.measures.find((m) => m.id === measureId)) || null;

  // Échap dans une fiche de mesure : revenir à la ville, pas à la carte du parcours.
  useEffect(() => {
    if (!measure || !city) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onOpen(city.id);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [measure, city, onOpen]);

  if (city && measure) return <MeasureDetail city={city} m={measure} block={block} onBack={() => onOpen(city.id)} />;

  return (
    <section className="citywrap" aria-label={block.title}>
      {block.intro && <p className="cintro">{block.intro}</p>}
      {block.items.length === 0 ? (
        <div className="empty">Contenu en préparation — les villes arrivent bientôt.</div>
      ) : (
        <div className="citygrid">
          {block.items.map((c) => {
            const flipped = c.id === cityId;
            return (
              <div key={c.id} className={"citycard" + (flipped ? " flip" : "")}>
                <div className="inner">
                  <button type="button" className="face front" inert={flipped}
                          aria-label={`${c.name} — voir les mesures`} onClick={() => onOpen(c.id)}>
                    <CardFront c={c} />
                  </button>
                  <div className="face back" inert={!flipped}>
                    <div className="bhead">
                      <h4>{c.flag} {c.name}</h4>
                      <button type="button" className="iconbtn flipback" onClick={() => onOpen(null)} aria-label={`Retourner la carte ${c.name}`}>↩</button>
                    </div>
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
                  </div>
                </div>
              </div>
            );
          })}
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
