import { useState } from "react";
import type { Content } from "../lib/types";

export default function CardGame({ game }: { game: Content["cardGame"] }) {
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const byId = Object.fromEntries(game.measures.map((m) => [m.id, m]));
  return (
    <section className="game" aria-label="Jeu de cartes">
      <h3>Jeu de cartes — {game.title}</h3>
      <ol className="rules">{game.rules.map((r, i) => <li key={i}>{r}</li>)}</ol>
      <div className="measures">
        {game.measures.map((m) => <span key={m.id} className={"mcard " + m.type}>{m.label}</span>)}
      </div>
      <div className="cities">
        {game.cities.map((c) => (
          <button key={c.id} type="button" className={"city" + (flipped[c.id] ? " flip" : "")}
                  aria-label={`${c.name} — retourner la carte`} onClick={() => setFlipped((f) => ({ ...f, [c.id]: !f[c.id] }))}>
            <div className="inner">
              <div className="face front">
                <div className="k">Ville</div>
                <h4>{c.name}</h4>
                <div className="c">{c.country} · Living Lab {c.role}</div>
                <p>{c.profile}</p>
                <p className="prob">{c.problem}</p>
                <div className="hint">Choisissez 3 mesures, puis cliquez pour retourner.</div>
              </div>
              <div className="face back">
                <div className="k">Ce que la ville a fait</div>
                <h4>{c.name}</h4>
                <div className="c">{c.measuresTaken.map((id) => byId[id]?.label).filter(Boolean).join(" · ")}</div>
                <ul>{c.whatTheyDid.map((l, i) => <li key={i}>{l}</li>)}</ul>
                <div className="k">Ce qui s'est passé</div>
                <ul>{c.whatHappened.map((l, i) => <li key={i}>{l}</li>)}</ul>
                {c.notDone.length > 0 && (<><div className="no">Ce qui n'a pas eu lieu</div><ul>{c.notDone.map((l, i) => <li key={i}>{l}</li>)}</ul></>)}
                <div className="hint">Source : rapport final {c.source.report}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
