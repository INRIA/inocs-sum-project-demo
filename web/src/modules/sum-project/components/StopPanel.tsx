import { assetUrl } from "../../../infrastructure/assetUrl";
import type { Content, Stop } from "../lib/types";
import ResourceDetail, { SourceLine } from "./ResourceDetail";
import CardGame from "./CardGame";
import Gallery from "./Gallery";
import PricingDemo from "./PricingDemo";

const modeLabel = { passive: "Table libre", animated: "Table animée", selfservice: "Jeu en autonomie" };

type Props = { stop: Stop; content: Content; resId: string | null; onOpen: (id: string | null) => void };

export default function StopPanel({ stop, content, resId, onOpen }: Props) {
  const r = resId === "__reveal" && stop.reveal
    ? { id: "__reveal", title: stop.reveal.title, teaser: "Ouvre-moi quand vous avez décidé.", kind: "reveal", body: stop.reveal.lines, source: stop.reveal.source }
    : stop.resources.find((x) => x.id === resId) || null;

  if (r) return <ResourceDetail r={r} onBack={() => onOpen(null)} />;

  return (
    <>
      {stop.images && stop.images.length > 0 && <Gallery images={stop.images} />}
      {stop.id === "tarif" && <PricingDemo />}
      <div className="rlist">
        <aside className="tent">
          <div className="headline">{stop.tableTent.headline}</div>
          <div className="subline">{stop.tableTent.subline}</div>
          <div className="chips" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span className="chip">{modeLabel[stop.mode]}</span>
            {stop.animator && <span className="chip blue">Animateur {stop.animator}</span>}
            {stop.durationMin && <span className="chip blue">{stop.durationMin} min</span>}
            {stop.capacity && <span className="chip blue">≤ {stop.capacity} pers.</span>}
          </div>
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
          {stop.game?.tablet?.url && <a className="demo" href={/^https?:/.test(stop.game.tablet.url) ? stop.game.tablet.url : assetUrl(stop.game.tablet.url)} target="_blank" rel="noopener">Ouvrir la démo sur la tablette ↗</a>}
          {stop.game?.note && <div className="notice soft">{stop.game.note}</div>}
          {stop.researchOnly && <div className="notice">Recherche uniquement — rien n'est déployé dans une ville.</div>}
        </aside>

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
      </div>
      {stop.id === "arret-de-tram" && <CardGame game={content.cardGame} />}
    </>
  );
}
