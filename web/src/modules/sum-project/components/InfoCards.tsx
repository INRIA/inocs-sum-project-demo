import { useState } from "react";
import { assetUrl } from "../../../infrastructure/assetUrl";
import type { InfoCard } from "../lib/types";
import FlipCard from "./FlipCard";
import Picto from "./Pictos";
import Chart from "./Charts";

// Grille de cartes d'information. L'état « retournée » est local : on peut en retourner plusieurs
// et les garder ouvertes pendant qu'on raconte. « En savoir plus » ouvre la fiche (modale) via le hash.
type Props = { cards: InfoCard[]; onOpen: (res: string) => void; title?: string; columns?: number };

export default function InfoCards({ cards, onOpen, title, columns }: Props) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const set = (id: string, on: boolean) => setOpen((s) => { const n = new Set(s); on ? n.add(id) : n.delete(id); return n; });
  return (
    <section className="cardsec" aria-label={title}>
      {title && <h3 className="csec-title">{title}</h3>}
      <div className={"cardgrid" + (columns ? ` cols-${columns}` : "")}>
        {cards.map((c) => (
          <FlipCard key={c.id} flipped={open.has(c.id)} onFlip={(on) => set(c.id, on)} label={c.front.label}
                    className={"info" + (c.accent ? " accent" : "") + (c.wide ? " wide" : "")}
                    backTitle={c.back.title || c.front.label}
                    front={
                      <>
                        {c.front.image && (
                          <figure className={"pic" + (c.front.image.src.endsWith(".png") ? " fit" : "")}>
                            <img src={assetUrl(c.front.image.src)} alt={c.front.image.alt || c.front.image.caption} />
                          </figure>
                        )}
                        {c.front.icons && <div className="pictos" aria-hidden="true">{c.front.icons.map((k) => <Picto key={k} name={k} />)}</div>}
                        {c.front.value && <div className={"n" + (c.front.value.length > 7 ? " long" : "")}>{c.front.value}</div>}
                        <div className="l">{c.front.label}</div>
                        {c.front.teaser && <p className="t">{c.front.teaser}</p>}
                      </>
                    }
                    back={
                      <>
                        {c.back.image && (
                          <figure className="bimg">
                            <img src={assetUrl(c.back.image.src)} alt={c.back.image.alt || c.back.image.caption} />
                          </figure>
                        )}
                        {c.back.chart && <Chart chart={c.back.chart} />}
                        {c.back.lines && c.back.lines.length > 0 && (
                          <ul className="blines">{c.back.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
                        )}
                        {(c.link || c.resource) && (
                          <div className="cta">
                            {c.resource && <button type="button" className="iconbtn primary" onClick={() => onOpen(c.resource!)}>En savoir plus →</button>}
                            {c.link && (c.link.url.startsWith("#")
                              ? <a className="iconbtn" href={c.link.url}>{c.link.label} →</a>
                              : <a className="iconbtn" href={c.link.url} target="_blank" rel="noopener">{c.link.label} ↗</a>)}
                          </div>
                        )}
                      </>
                    } />
        ))}
      </div>
    </section>
  );
}
