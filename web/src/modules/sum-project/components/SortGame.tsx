import { useEffect, useMemo, useState } from "react";
import { assetUrl } from "../../../infrastructure/assetUrl";
import type { SortBin, SortCard, SortGameDef, Stop } from "../lib/types";
import Modal from "./Modal";

// Jeu de tri : on lit une carte, on la pose sur un tapis (un toucher), puis on retourne tout d'un coup.
// L'état (cartes posées, retournées ou non) est gardé par appareil (sessionStorage), pour survivre
// à un détour « Pour le voir : arrêt X » et revenir à la table sans perdre la partie.
type Props = {
  stopId: string; def: SortGameDef; stops: Pick<Stop, "id" | "order" | "place">[];
  reveal: Stop["reveal"]; sel: string | null; onOpen: (id: string | null) => void; crumb: string;
};
type Saved = { placed: Record<string, string>; revealed: boolean };

const KEY = (id: string) => `sum-sort:${id}`;
const load = (id: string): Saved => {
  try { const raw = sessionStorage.getItem(KEY(id)); if (raw) return JSON.parse(raw); } catch {}
  return { placed: {}, revealed: false };
};
const save = (id: string, s: Saved) => { try { sessionStorage.setItem(KEY(id), JSON.stringify(s)); } catch {} };

export default function SortGame({ stopId, def, stops, reveal, sel, onOpen, crumb }: Props) {
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState(false);
  const [trueSort, setTrueSort] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => { const s = load(stopId); setPlaced(s.placed); setRevealed(s.revealed); setReady(true); }, [stopId]);
  useEffect(() => { if (ready) save(stopId, { placed, revealed }); }, [ready, stopId, placed, revealed]);

  const bins = def.bins, cards = def.cards;
  const binOf = (id: string) => bins.find((b) => b.id === id);
  const hand = cards.filter((c) => !placed[c.id]);
  const nPlaced = cards.length - hand.length;
  const score = cards.filter((c) => placed[c.id] === c.verdict).length;

  // où s'affiche chaque carte : le tapis choisi ; après le retournement on peut ranger selon la vraie réponse ;
  // une carte jamais posée apparaît sur son vrai tapis, marquée « pas placée ».
  const shownIn = (c: SortCard) => (revealed && (trueSort || !placed[c.id]) ? c.verdict : placed[c.id]);
  const inBin = (b: SortBin) => cards.filter((c) => shownIn(c) === b.id);
  const yours = (b: SortBin) => cards.filter((c) => placed[c.id] === b.id).length;
  const truth = (b: SortBin) => cards.filter((c) => c.verdict === b.id).length;

  const place = (cardId: string, binId: string) => setPlaced((p) => ({ ...p, [cardId]: binId }));
  const unplace = (cardId: string) => setPlaced((p) => { const n = { ...p }; delete n[cardId]; return n; });
  const restart = () => { setPlaced({}); setRevealed(false); setTrueSort(false); };
  // Au retournement, on ramène les tapis sous la barre de score : le retournement des cartes est le moment du jeu.
  const doReveal = () => {
    setRevealed(true);
    const mats = document.getElementById("sort-mats"), sb = mats?.closest(".sheet-body") as HTMLElement | null, bar = document.getElementById("sort-bar");
    if (mats && sb) {
      const pad = parseFloat(getComputedStyle(sb).paddingTop) || 0; // la barre collante s'arrête sous le padding du tiroir
      const top = mats.getBoundingClientRect().top - sb.getBoundingClientRect().top + sb.scrollTop - pad - (bar?.offsetHeight || 0) - 12;
      sb.scrollTo({ top: Math.max(0, top), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
  };

  const open = useMemo(() => cards.find((c) => c.id === sel) || null, [cards, sel]);
  const stopFor = (id?: string) => stops.find((s) => s.id === id) || null;
  const goSee = (see: SortCard["see"]) => { if (!see) return; location.hash = "#/" + see.stop + (see.res ? "/" + see.res : ""); };

  const stampOf = (c: SortCard) => { const b = binOf(c.verdict)!; return <span className={"stamp " + b.tone}><span aria-hidden="true">{b.emoji}</span> {c.stamp || b.label}</span>; };

  return (
    <section className="sortgame" aria-label="Jeu de tri">
      {open && (() => {
        const b = binOf(open.verdict)!; const st = stopFor(open.see?.stop);
        return (
          <Modal crumbs={[crumb, `Carte ${open.n}`, open.title]} onClose={() => onOpen(null)}>
            <article className="detail verso">
              <span className={"stamp big " + b.tone}><span aria-hidden="true">{b.emoji}</span> {open.stamp || b.label}</span>
              <h3>{open.title}</h3>
              <div className="teaser">{open.pitch}</div>
              {open.image?.src
                ? <figure className="imgph"><img src={assetUrl(open.image.src)} alt={open.image.alt || open.image.caption} /><div>{open.image.caption}</div></figure>
                : <figure className="imgph"><b>IMAGE À INSÉRER</b><div>{open.image?.caption || "Photo de l'innovation"}</div></figure>}
              <h4 className="sub">Pourquoi</h4>
              {open.why.length > 0 ? <ul className="items">{open.why.map((w, i) => <li key={i}>{w}</li>)}</ul> : <p className="empty">Pourquoi : à compléter</p>}
              {(open.partner || open.livingLab) && <div className="meta">{[open.partner, open.livingLab && "Living Lab : " + open.livingLab].filter(Boolean).join(" · ")}</div>}
              {st && <button type="button" className="iconbtn primary" onClick={() => goSee(open.see)}>Pour le voir : arrêt {st.order} · {st.place} →</button>}
              {open.source && <div className="src">Source : {open.source}</div>}
            </article>
          </Modal>
        );
      })()}

      <div className="sortintro">
        <div className="k">Le jeu</div>
        {def.message && <p className="msg">{def.message}</p>}
        {def.howto && <p className="how">{def.howto}</p>}
      </div>

      <div className="sortbar" id="sort-bar" role="status" aria-live="polite">
        {revealed ? (
          <>
            <span className="cnt">{score} <small>/ {cards.length} bien vues</small></span>
            <button type="button" className="iconbtn" aria-pressed={trueSort} onClick={() => setTrueSort((t) => !t)}>{trueSort ? "Revoir mon tri" : "Ranger selon la vraie réponse"}</button>
            <button type="button" className="iconbtn" onClick={restart}>Recommencer ↺</button>
          </>
        ) : (
          <>
            <span className="cnt">{nPlaced} <small>/ {cards.length} cartes posées</small></span>
            <div className="bar" aria-hidden="true"><i style={{ width: `${(100 * nPlaced) / cards.length}%` }} /></div>
            <button type="button" className="iconbtn primary" disabled={nPlaced === 0} onClick={doReveal}
                    title={nPlaced < cards.length ? "Posez toutes les cartes avant de retourner" : undefined}>
              Retourner les cartes ↻
            </button>
          </>
        )}
      </div>

      <div className="mats" id="sort-mats">
        {bins.map((b) => {
          const list = inBin(b);
          return (
            <section key={b.id} className={"mat " + b.tone} aria-label={b.label}>
              <header><span className="emoji" aria-hidden="true">{b.emoji}</span><span>{b.label}</span><span className="count" aria-label={`${list.length} cartes`}>{list.length}</span></header>
              <div className="slot">
                {list.length === 0 && <div className="ph">{b.hint || "Posez une carte ici"}</div>}
                {list.map((c, i) => {
                  const ok = placed[c.id] === c.verdict, you = binOf(placed[c.id]);
                  return (
                    <div key={c.id} className={"fcard sort" + (revealed ? " flip" : "")}>
                      <div className="inner" style={{ transitionDelay: revealed ? `${i * 90}ms` : "0ms" }}>
                        <div className="face front" inert={revealed}>
                          <div className="row"><span className="num">{c.n}</span><button type="button" className="iconbtn" onClick={() => unplace(c.id)} aria-label={`Reprendre la carte ${c.n}`}>↩ Reprendre</button></div>
                          <h4>{c.title}</h4>
                        </div>
                        <div className={"face back " + (!placed[c.id] ? "none" : ok ? "ok" : "ko")} inert={!revealed}>
                          <div className="row">{stampOf(c)}<span className="num">{c.n}</span></div>
                          <h4>{c.title}</h4>
                          <div className="you">{!placed[c.id] ? "Carte non placée" : ok ? "✓ Bien vu !" : <>✗ Vous l'aviez mise sur {you?.emoji} {you?.short}</>}</div>
                          {c.why[0] && <p className="why">{c.why[0]}</p>}
                          <div className="row"><button type="button" className="iconbtn" onClick={() => onOpen(c.id)}>Pourquoi ? →</button></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {!revealed && hand.length > 0 && (
        <section className="hand" aria-label="Cartes à placer">
          <h3 className="csec-title">Cartes à placer · {hand.length}</h3>
          <div className="handgrid">
            {hand.map((c) => (
              <article key={c.id} className="hcard">
                {c.image?.src
                  ? <div className="pic"><img src={assetUrl(c.image.src)} alt={c.image.alt || c.image.caption} /></div>
                  : <div className="pic ph">Photo à insérer</div>}
                <div className="row"><span className="num">{c.n}</span><h4>{c.title}</h4></div>
                <p className="pitch">{c.pitch}</p>
                {c.question && <p className="qq">{c.question}</p>}
                <div className="verdicts" role="group" aria-label={`Où va la carte ${c.n} ?`}>
                  {bins.map((b) => (
                    <button key={b.id} type="button" className={"vbtn " + b.tone} onClick={() => place(c.id, b.id)} aria-label={`${c.title} : ${b.label}`}>
                      <span className="emoji" aria-hidden="true">{b.emoji}</span>{b.short}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {!revealed && hand.length === 0 && (
        <div className="allplaced">
          <div>Toutes les cartes sont posées. Personne ne bouge : on retourne tout ensemble.</div>
          <button type="button" className="iconbtn primary big" onClick={doReveal}>Retourner les cartes ↻</button>
        </div>
      )}

      {revealed && (
        <section className="result" id="sort-result" aria-label="Résultat">
          <div className="k">{reveal?.title || "Le score"}</div>
          <div className="score"><b>{score}</b><span>bonnes réponses sur {cards.length}</span></div>
          <div className="cmp" role="table" aria-label="Votre tri comparé à la réalité">
            <span className="h" />{bins.map((b) => <span key={b.id} className="h"><span aria-hidden="true">{b.emoji}</span> {b.short}</span>)}
            <span className="h">Vous</span>{bins.map((b) => <b key={b.id}>{yours(b)}</b>)}
            <span className="h">En vrai</span>{bins.map((b) => <b key={b.id}>{truth(b)}</b>)}
          </div>
          {reveal && reveal.lines.length > 0 && <ul className="lines">{reveal.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>}
          {reveal?.source?.report && <div className="src light">Source : rapport {reveal.source.report}</div>}
        </section>
      )}

      {revealed && def.debrief && <div className="debrief"><b>À remarquer · </b>{def.debrief}</div>}
      {revealed && def.bulletin && (
        <div className="bulletin" aria-label="Bulletin pour le conseil municipal">
          <div className="k">Bulletin pour le conseil municipal · à remplir sur papier</div>
          <div className="txt">{def.bulletin}</div>
          <div className="line" aria-hidden="true" />
        </div>
      )}
    </section>
  );
}
