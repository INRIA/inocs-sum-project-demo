import { useEffect, useMemo, useState } from "react";
import { assetUrl } from "../../../infrastructure/assetUrl";
import type { PickCard, PickGameDef, PickStatus, Stop } from "../lib/types";
import { loadPick, loadReflect, savePick, saveReflect } from "../lib/pickState";
import Modal from "./Modal";
import Sketch from "./Sketch";

// Jeu de cartes du Belvédère, en trois temps : Choisir → Retourner → Retenir.
// Le visiteur est le maire : il compose son programme (aucune limite), puis retourne les cartes
// pour découvrir où en est vraiment chaque idée dans le projet. Pas de score, pas de bonne réponse.
// L'état est gardé par appareil (voir lib/pickState.ts), pour survivre à un détour « Pour le voir : arrêt X ».
type Props = {
  stopId: string; def: PickGameDef; stops: Pick<Stop, "id" | "order" | "place">[];
  reveal: Stop["reveal"]; sel: string | null; onOpen: (id: string | null) => void; crumb: string;
};

const calm = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function PickGame({ stopId, def, stops, reveal, sel, onOpen, crumb }: Props) {
  const [picked, setPicked] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [flipped, setFlipped] = useState(false);   // le retournement lui-même : posé une image après, pour que l'animation parte
  const [ready, setReady] = useState(false);
  const [reflect, setReflect] = useState<string | null>(null);

  useEffect(() => {
    const s = loadPick(stopId);
    setPicked(s.picked); setRevealed(s.revealed); setFlipped(s.revealed);
    setReflect(loadReflect(stopId)); setReady(true);
  }, [stopId]);
  useEffect(() => { if (ready) savePick(stopId, { picked, revealed }); }, [ready, stopId, picked, revealed]);
  useEffect(() => { if (ready) saveReflect(stopId, reflect); }, [ready, stopId, reflect]);

  const statuses = def.statuses, cards = def.cards;
  const statusOf = (c: PickCard) => statuses.find((s) => s.id === c.status) || statuses[0];
  const isOn = (id: string) => picked.includes(id);
  const mine = cards.filter((c) => isOn(c.id));
  const others = cards.filter((c) => !isOn(c.id));
  const nMine = mine.length;
  const countIn = (list: PickCard[], s: PickStatus) => list.filter((c) => c.status === s.id).length;

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const restart = () => { setPicked([]); setRevealed(false); setFlipped(false); setReflect(null); };

  // Au retournement, on ramène le programme sous la barre collante : le retournement est le moment du jeu.
  const doReveal = () => {
    setRevealed(true);
    // les deux sections viennent d'être posées à plat : on attend une image avant de lancer le retournement
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setFlipped(true);
      const secs = document.getElementById("pick-secs"), sb = secs?.closest(".sheet-body") as HTMLElement | null, bar = document.getElementById("sort-bar");
      if (!secs || !sb) return;
      const pad = parseFloat(getComputedStyle(sb).paddingTop) || 0;   // la barre collante s'arrête sous le padding du tiroir
      const top = secs.getBoundingClientRect().top - sb.getBoundingClientRect().top + sb.scrollTop - pad - (bar?.offsetHeight || 0) - 12;
      sb.scrollTo({ top: Math.max(0, top), behavior: calm() ? "auto" : "smooth" });
    }));
  };
  const goSec = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const bar = document.getElementById("sort-bar");
    if (bar) el.style.scrollMarginTop = bar.offsetHeight + 10 + "px";   // la barre collante change de hauteur selon l'écran
    el.scrollIntoView({ block: "start", behavior: calm() ? "auto" : "smooth" });
  };

  const open = useMemo(() => cards.find((c) => c.id === sel) || null, [cards, sel]);
  const stopFor = (id?: string) => stops.find((s) => s.id === id) || null;
  const goSee = (see: PickCard["see"]) => { if (!see) return; location.hash = "#/" + see.stop + (see.res ? "/" + see.res : ""); };
  const stampOf = (c: PickCard, big = false) => {
    const s = statusOf(c);
    return <span className={"stamp " + s.tone + (big ? " big" : "")}>{c.stamp || s.label}</span>;
  };

  // Une carte : recto = la photo (ou le croquis CIVITAS) et le bouton « Pour ma ville » ;
  // verso = le tampon du statut réel, la première raison, et « Pourquoi ? → » (la fiche en modale).
  const card = (c: PickCard, i: number) => {
    const on = isOn(c.id), s = statusOf(c);
    return (
      <div key={c.id} className={"fcard pick" + (on ? " on" : "") + (flipped ? " flip" : "")}>
        <div className="inner" style={{ transitionDelay: flipped ? `${i * 90}ms` : "0ms" }}>
          <div className="face front" inert={revealed}>
            {c.image?.src
              ? <div className="pic"><img src={assetUrl(c.image.src)} alt={c.image.alt || c.image.caption} /></div>
              : c.icon
                ? <div className="pic sk"><Sketch name={c.icon} size={70} /></div>
                : <div className="pic ph">Photo à insérer</div>}
            <div className="row"><span className="num">{c.n}</span><h4>{c.title}</h4></div>
            <p className="pitch">{c.pitch}</p>
            {c.question && <p className="qq">{c.question}</p>}
            <button type="button" className={"pickbtn" + (on ? " on" : "")} aria-pressed={on}
                    onClick={() => toggle(c.id)} aria-label={`${c.title} : ${on ? "retirer de mon programme" : "ajouter à mon programme"}`}>
              {on ? "✓ Choisie" : "+ Pour ma ville"}
            </button>
          </div>
          <div className={"face back " + s.tone} inert={!revealed}>
            <div className="row">{stampOf(c)}<span className="num">{c.n}</span></div>
            <h4>{c.title}</h4>
            {c.why[0] && <p className="why">{c.why[0]}</p>}
            <div className="row"><button type="button" className="iconbtn" onClick={() => onOpen(c.id)}>Plus d'infos →</button></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="pickgame" aria-label="Jeu de cartes : votre programme pour la ville">
      {open && (() => {
        const s = statusOf(open), st = stopFor(open.see?.stop);
        return (
          <Modal crumbs={[crumb, `Carte ${open.n}`, open.title]} onClose={() => onOpen(null)}>
            <article className="detail verso">
              {stampOf(open, true)}
              <h3>{open.title}</h3>
              <div className="teaser">{open.pitch}</div>
              {open.image?.src
                ? <figure className="imgph"><img src={assetUrl(open.image.src)} alt={open.image.alt || open.image.caption} /><div>{open.image.caption}</div></figure>
                : open.icon
                  ? <figure className="imgph sk"><Sketch name={open.icon} size={120} /><div>{open.image?.caption || "Photo de l'innovation"}</div></figure>
                  : <figure className="imgph"><b>IMAGE À INSÉRER</b><div>{open.image?.caption || "Photo de l'innovation"}</div></figure>}
              <div className="statusline">{s.hint}</div>
              <h4 className="sub">Pourquoi</h4>
              {open.why.length > 0 ? <ul className="items">{open.why.map((w, i) => <li key={i}>{w}</li>)}</ul> : <p className="empty">Pourquoi : à compléter</p>}
              {(open.partner || open.livingLab) && <div className="meta">{[open.partner, open.livingLab && "Living Lab : " + open.livingLab].filter(Boolean).join(" · ")}</div>}
              {st && <button type="button" className="iconbtn primary" onClick={() => goSee(open.see)}>Pour le voir : arrêt {st.order} · {st.place} →</button>}
              {open.source && <div className="src">Source : {open.source}</div>}
            </article>
          </Modal>
        );
      })()}

      <div className="pickintro">
        {def.message && <p className="msg">{def.message}</p>}
        {def.howto && <p className="how">{def.howto}</p>}
      </div>

      <div className="pickbar" id="sort-bar" role="status" aria-live="polite">
        {revealed ? (
          <>
            <span className="cnt"><span className="lbl">Mon programme · </span><b>{nMine}</b> <small>idée{nMine > 1 ? "s" : ""}</small></span>
            <div className="counts" role="group" aria-label="Votre programme par statut">
              {statuses.map((s) => {
                const n = countIn(mine, s);
                return <span key={s.id} className={"ccount " + s.tone + (n === 0 ? " zero" : "")}><b>{n}</b> {s.short}</span>;
              })}
            </div>
            <button type="button" className="iconbtn" onClick={restart} aria-label="Recommencer"><span className="rtxt">Recommencer </span>↺</button>
            {/* Téléphone : deux repères pour atteindre les deux sections sans faire défiler à l'aveugle. */}
            <div className="jumps" role="group" aria-label="Aller à une section">
              <button type="button" className="jpill" onClick={() => goSec("pick-mine")}>Votre programme</button>
              <button type="button" className="jpill" onClick={() => goSec("pick-others")}>Les autres idées</button>
            </div>
          </>
        ) : (
          <>
            <span className="cnt"><span className="lbl">Mon programme · </span><b>{nMine}</b> <small>idée{nMine > 1 ? "s" : ""}</small></span>
            <div className="pchips" role="group" aria-label="Les idées de votre programme">
              {mine.map((c) => (
                <button key={c.id} type="button" className="pchip" onClick={() => toggle(c.id)}
                        title={c.title} aria-label={`Retirer de mon programme : ${c.title}`}>
                  <span className="n">{c.n}</span><span className="x" aria-hidden="true">×</span>
                </button>
              ))}
            </div>
            <button type="button" className="iconbtn primary" disabled={nMine === 0} onClick={doReveal}
                    title={nMine === 0 ? "Choisissez au moins une idée" : undefined}>
              Retourner les cartes ↻
            </button>
          </>
        )}
      </div>

      {!revealed && <div className="pickgrid">{cards.map((c, i) => card(c, i))}</div>}

      {revealed && (
        <div className="picksecs" id="pick-secs">
          <section className="picksec" id="pick-mine" aria-label="Votre programme">
            <h3 className="csec-title">Votre programme · {nMine} idée{nMine > 1 ? "s" : ""}</h3>
            <div className="pickgrid">{mine.map((c, i) => card(c, i))}</div>
          </section>
          <section className="picksec rest" id="pick-others" aria-label="Les autres idées">
            <h3 className="csec-title">Les autres idées</h3>
            <div className="pickgrid">{others.map((c, i) => card(c, nMine + i))}</div>
          </section>
        </div>
      )}

      {revealed && (
        <section className="result" id="pick-result" aria-label="Votre programme et où en sont les idées">
          <div className="k">Votre programme</div>
          <ul className="prog">
            {statuses.filter((s) => countIn(mine, s) > 0).map((s) => {
              const list = mine.filter((c) => c.status === s.id);
              return (
                <li key={s.id}>
                  <b>{list.length} idée{list.length > 1 ? "s" : ""}</b>
                  <span className={"stamp " + s.tone}>{s.label}</span>
                  <span className="t">{" : " + list.map((c) => c.title).join(", ")}</span>
                </li>
              );
            })}
            {nMine === 0 && <li className="none">Aucune idée choisie : les treize cartes sont retournées ci-dessus.</li>}
          </ul>
          <div className="k">{reveal?.title || "Où en sont les treize idées"}</div>
          <div className="totals" role="group" aria-label="Les treize idées par statut">
            {statuses.map((s) => (
              <span key={s.id} className="tot"><b>{countIn(cards, s)}</b> {s.label}</span>
            ))}
          </div>
          {reveal && reveal.lines.length > 0 && <ul className="lines">{reveal.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>}
          {reveal?.source?.report && <div className="src light">Source : rapport {reveal.source.report}</div>}
        </section>
      )}

      {revealed && (
        <section className="reflect" aria-label="Ce qui m'a le plus surpris">
          <div className="k">Ce qui m'a le plus surpris{" "}:</div>
          <div className="rbtns" role="group" aria-label="Choisir un statut">
            {statuses.map((s) => (
              <button key={s.id} type="button" className={"rbtn " + s.tone + (reflect === s.id ? " on" : "")}
                      aria-pressed={reflect === s.id}
                      onClick={() => setReflect((r) => (r === s.id ? null : s.id))}>
                {s.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {revealed && def.debrief && <div className="debrief"><b>À remarquer · </b>{def.debrief}</div>}
      {/* {revealed && def.bulletin && (
        <div className="bulletin" aria-label="Bulletin pour le conseil municipal">
          <div className="k">Bulletin pour le conseil municipal · à remplir sur papier</div>
          <div className="txt">{def.bulletin}</div>
          <div className="line" aria-hidden="true" />
        </div>
      )} */}
    </section>
  );
}
