import { assetUrl } from "../../../infrastructure/assetUrl";
import type { Content, Stop } from "../lib/types";
import ResourceDetail from "./ResourceDetail";
import CityCards, { parseSel } from "./CityCards";
import Gallery from "./Gallery";
import InfoCards from "./InfoCards";
import Modal from "./Modal";

const modeLabel = { passive: "Table libre", animated: "Table animée", selfservice: "Jeu en autonomie" };

type Props = { stop: Stop; content: Content; resId: string | null; onOpen: (id: string | null) => void };

export default function StopPanel({ stop, content, resId, onOpen }: Props) {
  const cardMode = !!(stop.cards || stop.cities); // arrêt « cartes » : recto / verso / fiche en modale
  const cityId = stop.cities ? parseSel(resId).cityId : null;
  const isCity = !!cityId && content.cities.items.some((c) => c.id === cityId);

  const r = isCity ? null
    : resId === "__reveal" && stop.reveal
      ? { id: "__reveal", title: stop.reveal.title, teaser: "Ouvre-moi quand vous avez décidé.", kind: "reveal", body: stop.reveal.lines, source: stop.reveal.source }
      : stop.resources.find((x) => x.id === resId) || null;

  const crumb = `Arrêt ${stop.order} · ${stop.place}`;
  const via = r && [...(stop.cards || []), ...(stop.moreCards || [])].find((c) => c.resource === r.id);
  const consignes = (
    <>
      <ol>
        {stop.instructions.map((i) => (
          <li key={i.step}>{i.title && <b>{i.title} — </b>}{i.text || <i>À compléter</i>}</li>
        ))}
      </ol>
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
      {!cardMode && stop.images && stop.images.length > 0 && <Gallery images={stop.images} />}
      <div className={"rlist" + (cardMode ? " cards" : "")}>
        <aside className={"tent" + (cardMode ? " compact" : "")}>
          {!cardMode && <div className="headline">{stop.tableTent.headline}</div>}
          <div className="subline">{stop.tableTent.subline}</div>
          <div className="chips" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span className="chip">{modeLabel[stop.mode]}</span>
            {stop.animator && <span className="chip blue">Animateur {stop.animator}</span>}
            {stop.durationMin && <span className="chip blue">{stop.durationMin} min</span>}
            {stop.capacity && <span className="chip blue">≤ {stop.capacity} pers.</span>}
          </div>
          {cardMode ? <details className="consignes"><summary>Consignes de la table</summary>{consignes}</details> : consignes}
          {!cardMode && stop.game?.tablet?.url && <a className="demo" href={/^https?:/.test(stop.game.tablet.url) ? stop.game.tablet.url : assetUrl(stop.game.tablet.url)} target="_blank" rel="noopener">Ouvrir la démo sur la tablette ↗</a>}
          {!cardMode && stop.game?.note && <div className="notice soft">{stop.game.note}</div>}
          {stop.researchOnly && <div className="notice">Recherche uniquement — rien n'est déployé dans une ville.</div>}
        </aside>

        {cardMode ? (
          <>
            {stop.cards && stop.cards.length > 0 && <InfoCards cards={stop.cards} onOpen={onOpen} />}
            {stop.cities && <CityCards block={content.cities} sel={resId} onOpen={onOpen} crumb={crumb} />}
            {stop.moreCards && stop.moreCards.length > 0 && <InfoCards cards={stop.moreCards} onOpen={onOpen} title="Pour aller plus loin" />}
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
