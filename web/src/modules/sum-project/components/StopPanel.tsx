import { assetUrl } from "../../../infrastructure/assetUrl";
import type { Content, InfoCard, Stop } from "../lib/types";
import ResourceDetail from "./ResourceDetail";
import CityCards, { parseSel } from "./CityCards";
import Gallery from "./Gallery";
import InfoCards from "./InfoCards";
import Modal from "./Modal";
import PickGame from "./PickGame";
import CityStrip from "./CityStrip";
import CoDesign, { ROLE_PRINT } from "./CoDesign";
import RolePrint from "./RolePrint";
import StoryRoad, { ChapterDetail, CHAPTER_PREFIX } from "./StoryRoad";
import Mission, { Embed, embedUrlFor } from "./Mission";
import Hero from "./Hero";
import Takeaways from "./Takeaways";

const modeLabel = { passive: "Table libre", animated: "Table animée", selfservice: "Jeu en autonomie" };

type Props = {
  stop: Stop; content: Content; resId: string | null; onOpen: (id: string | null) => void;
  chapter?: number; onChapter?: (i: number) => void;   // arrêt « histoire » : le chapitre ouvert (état de Journey, pour les flèches)
  autoplay?: boolean;                                  // ?autoplay=1
  onNextStop?: () => void; nextLabel?: string;
};

export default function StopPanel({ stop, content, resId, onOpen, chapter = 0, onChapter, autoplay = false, onNextStop, nextLabel }: Props) {
  const pick = stop.game?.pick || null;
  const story = stop.story || null;
  const mission = stop.mission || null;
  const proc = stop.process || null;
  const cardMode = !!(stop.cards || stop.cities || pick || stop.cityStrip || story || mission || proc || stop.hero || stop.takeaways); // arrêt « cartes » : recto / verso / fiche en modale
  // #/<arrêt>/chapitre-<id> : un chapitre de l'histoire en modale (téléphone, ou lien profond)
  const chapIdx = story && resId && resId.startsWith(CHAPTER_PREFIX) ? story.chapters.findIndex((c) => CHAPTER_PREFIX + c.id === resId) : -1;
  const chap = chapIdx >= 0 ? story!.chapters[chapIdx] : null;
  const cityId = stop.cities ? parseSel(resId).cityId : null;
  const isCity = !!cityId && content.cities.items.some((c) => c.id === cityId);
  const isPickCard = !!pick && pick.cards.some((c) => c.id === resId);
  const embedUrl = embedUrlFor(mission, resId);   // #/<arrêt>/outil : l'outil externe en modale
  const rolePrint = !!proc && resId === ROLE_PRINT;   // #/<arrêt>/roles-impression : les cartes de rôle à imprimer

  // En mode « cartes », l'enveloppe devient la dernière carte de la grille (son verso = la révélation).
  // Le jeu de cartes (Belvédère) garde son propre retournement : on n'y touche pas.
  const cards: InfoCard[] = stop.cards && stop.cards.length > 0 && stop.reveal && !pick
    ? [...stop.cards, {
        id: "__reveal", accent: true,
        front: { value: "✉", label: stop.reveal.title, teaser: "Ouvre-moi quand vous avez voté." },
        back: { title: "Ce qui s'est passé", lines: stop.reveal.lines },
        resource: "__reveal",
      }]
    : stop.cards || [];

  const r = isCity || isPickCard || chap || embedUrl || rolePrint ? null
    : resId === "__reveal" && stop.reveal
      ? { id: "__reveal", title: stop.reveal.title, teaser: "Ouvre-moi quand vous avez décidé.", kind: "reveal", body: stop.reveal.lines, source: stop.reveal.source }
      : stop.resources.find((x) => x.id === resId) || null;

  // « Pour aller plus loin » : les ressources que les blocs de l'arrêt n'ouvrent pas déjà (mission, atelier).
  const used = new Set((proc?.ctas || []).map((c) => c.resource).filter(Boolean) as string[]);
  const more = mission || proc ? stop.resources.filter((res) => !used.has(res.id)) : [];

  const crumb = `Arrêt ${stop.order} · ${stop.place}`;
  const via = r && [...(stop.cards || []), ...(stop.moreCards || [])].find((c) => c.resource === r.id);

  // Les repères d'un arrêt long : on n'affiche la rangée que s'il y a au moins deux sections à atteindre.
  const moreTitle = stop.moreTitle || "Pour aller plus loin";
  const secs = [
    stop.hero ? { id: "sec-hero", label: "La plateforme" } : null,
    cards.length > 0 ? { id: "sec-cards", label: "Cartes" } : null,
    stop.cities ? { id: "sec-cities", label: "Neuf villes" } : null,
    stop.moreCards && stop.moreCards.length > 0 ? { id: "sec-more", label: moreTitle } : null,
    stop.takeaways ? { id: "sec-take", label: stop.takeaways.title } : null,
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

  // les consignes sont facultatives : sans consigne, ni règle, ni questions, pas de bouton
  const hasConsignes = !!(stop.instructions?.length || stop.rule || stop.questions?.length);
  const consignes = (
    <>
      <ol>
        {(stop.instructions || []).map((i) => (
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
      {embedUrl && (
        <Modal className="embed" closeLabel="Fermer" crumbs={[crumb, "L'outil"]} onClose={() => onOpen(null)}>
          <Embed url={embedUrl} title="Outil : où placer les stations de vélos" />
        </Modal>
      )}
      {rolePrint && proc && (
        <Modal className="print" closeLabel="Fermer" crumbs={[crumb, "Cartes de rôle"]} onClose={() => onOpen(null)}>
          <RolePrint roles={proc.roles} />
        </Modal>
      )}
      {chap && story && (
        <Modal crumbs={[crumb, `Chapitre ${chapIdx + 1} sur ${story.chapters.length}`, chap.kicker]} onClose={() => onOpen(null)}>
          <ChapterDetail story={story} index={chapIdx} content={content} onOpen={onOpen} />
        </Modal>
      )}

      {/* La question de l'arrêt, et à sa droite les consignes de la table (repliées). */}
      <div className="qrow">
        <p className="q">{stop.question}</p>
        {cardMode && hasConsignes && (
          <details className="consignes">
            <summary>Consignes de la table</summary>
            <div className="cbody">{chips}{consignes}</div>
          </details>
        )}
      </div>
      {secs.length >= 2 && (
        <nav className="anchors" aria-label="Sections de l'arrêt">
          {secs.map((s) => <button key={s.id} type="button" onClick={() => jump(s.id)}>{s.label}</button>)}
        </nav>
      )}

      {!cardMode && stop.images && stop.images.length > 0 && <Gallery images={stop.images} />}
      <div className={"rlist" + (cardMode ? " cards" : "") + (pick ? " full" : "")}>
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
            {mission && <Mission mission={mission} onOpen={onOpen} />}
            {proc && <CoDesign process={proc} onOpen={onOpen} />}
            {more.length > 0 && (
              <section className="reslinks" aria-label={moreTitle}>
                <h3 className="csec-title">{moreTitle}</h3>
                <ul>
                  {more.map((res) => (
                    <li key={res.id}>
                      <button type="button" onClick={() => onOpen(res.id)}>
                        <span className="kind">{res.kind}</span><span className="t">{res.title}</span><span className="arrow" aria-hidden="true">→</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {pick && <PickGame stopId={stop.id} def={pick} stops={content.stops} reveal={stop.reveal} sel={resId} onOpen={onOpen} crumb={crumb} />}
            {story && (
              <StoryRoad story={story} content={content} chapter={chapter} onChapter={onChapter || (() => {})} autoplay={autoplay}
                         paused={!!resId} onOpen={onOpen} onNextStop={onNextStop || (() => {})} nextLabel={nextLabel || "Arrêt suivant"} />
            )}
            {stop.hero && <div className="sec" id="sec-hero"><Hero hero={stop.hero} onOpen={onOpen} /></div>}
            {cards.length > 0 && <div className="sec" id="sec-cards"><InfoCards cards={cards} onOpen={onOpen} /></div>}
            {stop.cities && <div className="sec" id="sec-cities"><CityCards block={content.cities} sel={resId} onOpen={onOpen} crumb={crumb} /></div>}
            {stop.moreCards && stop.moreCards.length > 0 && (
              <div className="sec" id="sec-more">
                <InfoCards cards={stop.moreCards} onOpen={onOpen} title={moreTitle} columns={stop.id === "station" ? 2 : undefined} />
              </div>
            )}
            {stop.takeaways && (
              <div className="sec" id="sec-take"><Takeaways block={stop.takeaways} cities={content.cities.items} onOpen={onOpen} /></div>
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
