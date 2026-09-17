import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Content } from "../lib/types";
import Glossary from "./Glossary";

// Écran de clôture : « Le conseil municipal » (route #/conseil). Rejoue le trajet (billet tamponné),
// le score du jeu de tri, les quatre messages, puis une seule action principale (plateforme de données).
const nb = (s: string) => s.replace(/ ([?!:;])/g, " $1");
const SORT_KEY = (id: string) => `sum-sort:${id}`;
const REFLECT_KEY = (id: string) => `sum-sort:reflect:${id}`;

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
  const sortStop = stops.find((s) => s.game?.sort) || null;
  const cards = sortStop?.game?.sort?.cards || [];

  // Le score du Belvédère est gardé par appareil : on le relit ici (jamais au rendu serveur).
  const [sc, setSc] = useState<{ score: number; revealed: boolean } | null>(null);
  // « Ce qui m'a le plus surpris » : le choix fait au Belvédère est rejoué ici.
  const [reflect, setReflect] = useState<string | null>(null);
  useEffect(() => {
    if (!sortStop) return;
    try {
      const raw = sessionStorage.getItem(SORT_KEY(sortStop.id));
      const saved = raw ? JSON.parse(raw) : null;
      const placed: Record<string, string> = (saved && saved.placed) || {};
      setSc({ score: cards.filter((k) => placed[k.id] === k.verdict).length, revealed: !!(saved && saved.revealed) });
    } catch { setSc(null); }
    try { setReflect(sessionStorage.getItem(REFLECT_KEY(sortStop.id))); } catch { setReflect(null); }
  }, [sortStop, cards]);
  const reflectBin = (sortStop?.game?.sort?.bins || []).find((b) => b.id === reflect) || null;

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
          <section aria-label="Votre trajet">
            <div className="csec-title">Votre trajet</div>
            <ol className="ticket">
              {stops.map((s) => {
                const v = visited.has(s.id);
                return (
                  <li key={s.id}>
                    <button type="button" className={"trow" + (v ? " on" : "")} onClick={() => onGo(s.id)}>
                      <span className="n">{s.order}</span>
                      <span className="pl">{s.place}</span>
                      <span className="stamp">{v ? "✓ visité" : "pas encore"}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>

          {sortStop && (
            <section className="scorebox" aria-label={`Votre score au ${sortStop.place}`}>
              <div className="k">Votre score au {sortStop.place}</div>
              {sc && sc.revealed ? (
                <p className="big">{sc.score} / {cards.length} bien vues</p>
              ) : (
                <p className="none">
                  Partie non terminée{" "}: passez au{" "}
                  <a href={`#/${sortStop.id}`}>{sortStop.place}, arrêt {sortStop.order}</a>
                </p>
              )}
              {reflectBin && (
                <p className="surprise">
                  Ce qui vous a le plus surpris{"\u00A0"}: <b><span aria-hidden="true">{reflectBin.emoji}</span> {reflectBin.label}</b>
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
