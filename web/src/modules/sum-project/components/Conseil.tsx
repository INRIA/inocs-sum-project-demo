import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Content } from "../lib/types";
import { loadPick, loadReflect } from "../lib/pickState";
import Glossary from "./Glossary";
import Ticket from "./Ticket";

// Écran de clôture : « Le conseil municipal » (route #/conseil). Rejoue le trajet (billet tamponné),
// le programme composé au Belvédère, les quatre messages, puis une seule action principale (plateforme de données).
const nb = (s: string) => s.replace(/ ([?!:;])/g, " $1");
const low = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

type Props = {
  content: Content;
  visited: Set<string>;
  onGo: (id: string | null, res?: string | null) => void;
  onReset: () => void;
  actions?: ReactNode;
};

export default function Conseil({ content, visited, onGo, onReset, actions }: Props) {
  const stops = content.stops;
  const c = content.journey.conclusion;
  const p = content.meta.project;
  const last = stops[stops.length - 1] || null;
  const pickStop = stops.find((s) => s.game?.pick) || null;
  const cards = pickStop?.game?.pick?.cards || [];
  const statuses = pickStop?.game?.pick?.statuses || [];

  // Le programme du Belvédère est gardé par appareil : on le relit ici (jamais au rendu serveur).
  const [pk, setPk] = useState<{ picked: string[]; revealed: boolean } | null>(null);
  // « Ce qui m'a le plus surpris » : le choix fait au Belvédère est rejoué ici.
  const [reflect, setReflect] = useState<string | null>(null);
  useEffect(() => {
    if (!pickStop) return;
    setPk(loadPick(pickStop.id));
    setReflect(loadReflect(pickStop.id));
  }, [pickStop]);
  const reflectStatus = statuses.find((b) => b.id === reflect) || null;
  // « 5 idées choisies : 2 en service · 1 au labo » — les statuts absents du programme ne s'écrivent pas.
  const mine = pk ? cards.filter((c) => pk.picked.includes(c.id)) : [];
  const parts = statuses
    .map((st) => ({ st, n: mine.filter((c) => c.status === st.id).length }))
    .filter((x) => x.n > 0);

  return (
    <>
      <header className="sheet-head">
        <div className="eyebrow">Fin du trajet</div>
        <div className="actions">
          {last && <button className="iconbtn" type="button" onClick={() => onGo(last.id)} title={last.place} aria-label={`Arrêt précédent\u00A0: ${last.place}`}>← {last.order}</button>}
          {actions}
          <button className="iconbtn close" type="button" aria-label="Fermer" onClick={() => onGo(null)}>×</button>
        </div>
        <h2>{nb(c.title)}</h2>
      </header>
      <div className="sheet-body">
        <div className="conseil">
          {/* Le même billet que dans l'en-tête des arrêts, en grand : le trajet se rejoue sur l'objet déjà connu. */}
          <Ticket stops={stops} visited={visited} activeId="conseil" onSelect={(id) => onGo(id)} big />

          {pickStop && (
            <section className="scorebox" aria-label={`Votre programme au ${pickStop.place}`}>
              <div className="k">Votre programme au {pickStop.place}</div>
              {pk && pk.revealed ? (
                <p className="big">
                  {mine.length} idée{mine.length > 1 ? "s" : ""} choisie{mine.length > 1 ? "s" : ""}
                  {parts.length > 0 && <span className="det">{parts.map((x) => `${x.n} ${low(x.st.short)}`).join(" \u00B7 ")}</span>}
                </p>
              ) : (
                <p className="none">
                  Partie non terminée{" "}: passez au{" "}
                  <a href={`#/${pickStop.id}`}>{pickStop.place}, arrêt {pickStop.order}</a>
                </p>
              )}
              {reflectStatus && (
                <p className="surprise">
                  Ce qui vous a le plus surpris{"\u00A0"}: <b><span className={"dot " + reflectStatus.tone} aria-hidden="true" /> {reflectStatus.label}</b>
                </p>
              )}
            </section>
          )}

          <section aria-label="Ce qu'on retient">
            <div className="csec-title">Ce qu'on retient</div>
            <ul className="items">
              {c.messages.map((m, i) => <li key={i}>{nb(m)}</li>)}
            </ul>
          </section>

          <a className="iconbtn primary big" href={p.odp} target="_blank" rel="noopener">Voir les vraies données des villes ↗</a>

          <details className="more">
            <summary>Pour aller plus loin</summary>
            <ul className="links2">
              <li><a href={p.website} target="_blank" rel="noopener">Le site du projet SUM ↗</a></li>
              <li><a href={p.demo} target="_blank" rel="noopener">La démo Station de vélos ↗</a></li>
            </ul>
          </details>

          <details className="more">
            <summary>Lexique</summary>
            <Glossary items={content.glossary} />
          </details>

          <details className="more">
            <summary>Pour l'animateur</summary>
            <p className="mini">À la minute {c.atMinute}, {c.durationMin} min</p>
            <ol className="steps2">
              {c.steps.map((s, i) => <li key={i}>{nb(s)}</li>)}
            </ol>
          </details>

          <button className="iconbtn big reset" type="button" onClick={onReset}>Nouvelle partie ↺</button>
        </div>
      </div>
    </>
  );
}
