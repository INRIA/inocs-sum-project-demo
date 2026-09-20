import { useEffect, useState } from "react";
import type { CityItem, Takeaways as TakeawaysBlock, TakeawayPanel } from "../lib/types";

// « Ce qu'on retient » (arrêt 5) : quatre panneaux — ce qui a marché, ce qui n'a pas marché,
// les défis, et la suite. Un constat qui porte une ville ouvre l'histoire de cette ville.
// Sur téléphone chaque panneau se replie (<details>) : le premier reste ouvert.
type Props = { block: TakeawaysBlock; cities: CityItem[]; onOpen: (res: string) => void };

function Items({ panel, cities, onOpen }: { panel: TakeawayPanel; cities: CityItem[]; onOpen: (res: string) => void }) {
  return (
    <ul className="tkitems">
      {panel.items.map((it, i) => {
        const c = it.city ? cities.find((x) => x.id === it.city) : null;
        return (
          <li key={i}>
            {c && (
              <button type="button" className="tkcity" onClick={() => onOpen(c.id + "--histoire")}>
                <span className="flag" aria-hidden="true">{c.flag}</span> {c.name}
              </button>
            )}
            <span className="tx">{it.text}</span>
          </li>
        );
      })}
    </ul>
  );
}

function Foot({ panel, onOpen }: { panel: TakeawayPanel; onOpen: (res: string) => void }) {
  if (!panel.resource && !panel.link) return null;
  return (
    <div className="tkfoot">
      {panel.resource && (
        <button type="button" className="iconbtn" onClick={() => onOpen(panel.resource!)}>En savoir plus →</button>
      )}
      {panel.link && (panel.link.url.startsWith("#")
        ? <a className="iconbtn" href={panel.link.url}>{panel.link.label} →</a>
        : <a className="iconbtn" href={panel.link.url} target="_blank" rel="noopener">{panel.link.label} ↗</a>)}
    </div>
  );
}

export default function Takeaways({ block, cities, onOpen }: Props) {
  // Téléphone : les panneaux se replient (seul le premier est ouvert). Grand écran : tout est ouvert.
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 860px)");
    const sync = () => setPhone(mq.matches);
    sync(); mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <section className="takeaways" aria-label={block.title}>
      <h3 className="csec-title">{block.title}</h3>
      <div className="tkgrid">
        {block.panels.map((p, i) => (
          <article key={p.id} className={"tkpanel " + p.tone}>
            <details className="tkdet" open={!phone || i === 0}>
              {/* grand écran : les panneaux restent ouverts ; téléphone : le résumé les replie */}
              <summary onClick={(e) => { if (!phone) e.preventDefault(); }}><h4>{p.title}</h4></summary>
              <div className="tkbody">
                <Items panel={p} cities={cities} onOpen={onOpen} />
                <Foot panel={p} onOpen={onOpen} />
              </div>
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}
