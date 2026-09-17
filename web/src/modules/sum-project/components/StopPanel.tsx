import { assetUrl } from "../../../infrastructure/assetUrl";
import type { Content, InfoCard, Stop } from "../lib/types";
import ResourceDetail from "./ResourceDetail";
import CityCards, { parseSel } from "./CityCards";
import Gallery from "./Gallery";
import InfoCards from "./InfoCards";
import Modal from "./Modal";
import SortGame from "./SortGame";
import CityStrip from "./CityStrip";
import Stepper from "./Stepper";

const modeLabel = { passive: "Table libre", animated: "Table animée", selfservice: "Jeu en autonomie" };

type Props = { stop: Stop; content: Content; resId: string | null; onOpen: (id: string | null) => void };

export default function StopPanel({ stop, content, resId, onOpen }: Props) {
  const sort = stop.game?.sort || null;
  const cardMode = !!(stop.cards || stop.cities || stop.challenge || sort || stop.cityStrip); // arrêt « cartes » : recto / verso / fiche en modale
  const cityId = stop.cities ? parseSel(resId).cityId : null;
  const isCity = !!cityId && content.cities.items.some((c) => c.id === cityId);
  const isSortCard = !!sort && sort.cards.some((c) => c.id === resId);

  // En mode « cartes », l'enveloppe devient la dernière carte de la grille (son verso = la révélation).
  // Le jeu de tri (Belvédère) garde son propre retournement : on n'y touche pas.
  const cards: InfoCard[] = stop.cards && stop.cards.length > 0 && stop.reveal && !sort
    ? [...stop.cards, {
        id: "__reveal", accent: true,
        front: { value: "✉", label: stop.reveal.title, teaser: "Ouvre-moi quand vous avez voté." },
        back: { title: "Ce qui s'est passé", lines: stop.reveal.lines },
        resource: "__reveal",
      }]
    : stop.cards || [];

  const r = isCity || isSortCard ? null
    : resId === "__reveal" && stop.reveal
      ? { id: "__reveal", title: stop.reveal.title, teaser: "Ouvre-moi quand vous avez décidé.", kind: "reveal", body: stop.reveal.lines, source: stop.reveal.source }
      : stop.resources.find((x) => x.id === resId) || null;

  const crumb = `Arrêt ${stop.order} · ${stop.place}`;
  const via = r && [...(stop.cards || []), ...(stop.moreCards || [])].find((c) => c.resource === r.id);

  // Les repères d'un arrêt long : on n'affiche la rangée que s'il y a au moins deux sections à atteindre.
  const moreTitle = stop.moreTitle || "Pour aller plus loin";
  const secs = [
    cards.length > 0 ? { id: "sec-cards", label: "Cartes" } : null,
    stop.cities ? { id: "sec-cities", label: "Neuf villes" } : null,
    stop.moreCards && stop.moreCards.length > 0 ? { id: "sec-more", label: moreTitle } : null,
    stop.cityStrip ? { id: "sec-strip", label: "Les villes" } : null,
  ].filter(Boolean) as { id: string; label: string }[];
  const jump = (id: string) => {
    const el = document.getElementById(id); if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    try { el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); } catch { el.scrollIntoView(); }
  };

  const chips = (
    <div className="chips">
      <span className="chip">{modeLabel[stop.mode]}</span>
      {stop.animator && <span className="chip blue">Animateur {stop.animator}</span>}
      {stop.durationMin && <span className="chip blue">{stop.durationMin} min</span>}
      {stop.capacity && <span className="chip blue">≤ {stop.capacity} pers.</span>}
    </div>
  );

  // Table animée en mode « cartes » : l'échafaudage pas-à-pas remplace la liste numérotée des consignes.
  const stepped = cardMode && stop.mode === "animated" && stop.instructions.length > 0;

  const consignes = (
    <>
      {!stepped && (
        <ol>
          {stop.instructions.map((i) => (
            <li key={i.step}>{i.title && <b>{i.title} — </b>}{i.text || <i>À compléter</i>}</li>
          ))}
        </ol>
      )}
      {stop.rule && <div className="notice">♥ {stop.rule}</div>}
      {stop.questions && (
        <div className="qs">
          {stop.questions.map((q) => <div key={q.id}><b>{q.id.toUpperCase()}.</b> {q.text || <i>À compléter</i>}</div>)}
        </div>
      )}
    </>
  );

  return (
    <>
      {r && (
        <Modal crumbs={[crumb, via ? via.front.label : r.id === "__reveal" ? "Enveloppe" : "Ressources", r.title]} onClose={() => onOpen(null)}>
          <ResourceDetail r={r} />
        </Modal>
      )}

      {/* La question de l'arrêt, et à sa droite les consignes de la table (repliées). */}
      <div className="qrow">
        <p className="q">{stop.question}</p>
        {cardMode && (
          <details className="consignes">
            <summary>{stepped ? "Infos de la table" : "Consignes de la table"}</summary>
            <div className="cbody">{chips}{consignes}</div>
          </details>
        )}
      </div>
      {stepped && <Stepper stopId={stop.id} steps={stop.instructions} rule={stop.rule} />}
      {secs.length >= 2 && (
        <nav className="anchors" aria-label="Sections de l'arrêt">
          {secs.map((s) => <button key={s.id} type="button" onClick={() => jump(s.id)}>{s.label}</button>)}
        </nav>
      )}

      {!cardMode && stop.images && stop.images.length > 0 && <Gallery images={stop.images} />}
      <div className={"rlist" + (cardMode ? " cards" : "") + (sort ? " full" : "")}>
        {cardMode ? (
          !stop.brief && (
            // sans brief dans l'en-tête, on garde la phrase du chevalet de table
            <aside className="tent compact"><div className="subline">{stop.tableTent.subline}</div></aside>
          )
        ) : (
          <aside className="tent">
            <div className="headline">{stop.tableTent.headline}</div>
            <div className="subline">{stop.tableTent.subline}</div>
            {chips}
            {consignes}
            {stop.game?.tablet?.url && <a className="demo" href={/^https?:/.test(stop.game.tablet.url) ? stop.game.tablet.url : assetUrl(stop.game.tablet.url)} target="_blank" rel="noopener">Ouvrir la démo sur la tablette ↗</a>}
            {stop.game?.note && <div className="notice soft">{stop.game.note}</div>}
          </aside>
        )}

        {cardMode ? (
          <>
            {stop.challenge && (
              <section className="challenge" aria-label="La question">
                <div className="k">{stop.challenge.eyebrow || "La question"}</div>
                <p className="q">{stop.challenge.question}</p>
                {stop.challenge.hint && <p className="h">{stop.challenge.hint}</p>}
                <a className="iconbtn primary big" href={stop.challenge.cta.url} target="_blank" rel="noopener">{stop.challenge.cta.label} ↗</a>
              </section>
            )}
            {sort && <SortGame stopId={stop.id} def={sort} stops={content.stops} reveal={stop.reveal} sel={resId} onOpen={onOpen} crumb={crumb} />}
            {cards.length > 0 && <div className="sec" id="sec-cards"><InfoCards cards={cards} onOpen={onOpen} /></div>}
            {stop.cities && <div className="sec" id="sec-cities"><CityCards block={content.cities} sel={resId} onOpen={onOpen} crumb={crumb} /></div>}
            {stop.moreCards && stop.moreCards.length > 0 && (
              <div className="sec" id="sec-more">
                <InfoCards cards={stop.moreCards} onOpen={onOpen} title={moreTitle} columns={stop.id === "station" ? 2 : undefined} />
              </div>
            )}
            {stop.cityStrip && <div className="sec" id="sec-strip"><CityStrip strip={stop.cityStrip} cities={content.cities.items} /></div>}
          </>
        ) : (
          <div className="tiles">
            {stop.resources.map((res) => {
              const first = res.facts?.[0];
              const big = first && /^[\d≈<>+]/.test(first.value) && first.value.length <= 14 ? first.value : null;
              return (
                <button key={res.id} type="button" className="tile" onClick={() => onOpen(res.id)}>
                  <div className="k">{res.kind}</div>
                  {big && <div className="n">{big}</div>}
                  <h4>{res.title}</h4>
                  <p>{res.teaser}</p>
                </button>
              );
            })}
            {stop.reveal && (
              <button type="button" className="tile envelope" onClick={() => onOpen("__reveal")}>
                <div className="k">Enveloppe</div>
                <h4>{stop.reveal.title}</h4>
                <p>Ouvre-moi quand vous avez décidé.</p>
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
