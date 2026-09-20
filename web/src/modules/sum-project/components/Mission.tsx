import { useEffect, useState } from "react";
import type { Mission as MissionDef } from "../lib/types";
import Sketch from "./Sketch";

// La mission du maire (arrêt Station) : un texte, cinq questions dont la réponse se déplie, un outil externe.
// L'outil s'ouvre en modale (iframe) par le hash : #/<arrêt>/outil (l'outil) ou #/<arrêt>/outil--<question> (la preuve d'une réponse),
// pour que Échap, ×, le fond et le bouton « retour » du navigateur restent gérés par Journey.
export const EMBED_ID = "outil";

export function embedUrlFor(m: MissionDef | undefined | null, resId: string | null): string | null {
  if (!m || !resId || !resId.startsWith(EMBED_ID)) return null;
  if (resId === EMBED_ID) return m.tool.url;
  const qid = resId.slice(EMBED_ID.length + 2);   // « outil--<question> »
  return m.questions.find((q) => q.id === qid)?.answer?.link?.url || null;
}

type Props = { mission: MissionDef; onOpen: (id: string) => void };

export default function Mission({ mission, onOpen }: Props) {
  // ?q=<question> ouvre une réponse d'emblée (affiche, QR code, vérification).
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(location.search).get("q");
    if (q && mission.questions.some((x) => x.id === q)) setActive(q);
  }, [mission]);
  const cur = mission.questions.find((q) => q.id === active) || null;

  const answer = (q: (typeof mission.questions)[number]) => q.answer && (
    <div className="mans" id={"mans-" + q.id} role="region" aria-label={q.q}>
      <div className="k">Ce que dit le modèle</div>
      <h4>{q.answer.title}</h4>
      <ul>{q.answer.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
      {q.answer.link && (
        <button type="button" className="iconbtn" onClick={() => onOpen(EMBED_ID + "--" + q.id)}>{q.answer.link.label} →</button>
      )}
    </div>
  );

  return (
    <section className="mission" aria-label="Votre mission">
      <div className="mhead">
        <div className="k">{mission.eyebrow}</div>
        <p className="txt">{mission.text}</p>
        {mission.lead && <p className="lead">{mission.lead}</p>}
      </div>
      <div className="mqs" role="list">
        {mission.questions.map((q, i) => (
          <div key={q.id} className={"mqw" + (active === q.id ? " on" : "")} role="listitem">
            <button type="button" className="mq" aria-expanded={active === q.id} aria-controls={"mans-" + q.id}
                    onClick={() => setActive((a) => (a === q.id ? null : q.id))}>
              <span className="ic"><Sketch name={q.icon} size={40} /></span>
              <span className="n">{i + 1}</span>
              <span className="qt">{q.q}</span>
              <span className="chev" aria-hidden="true">{active === q.id ? "▴" : "▾"}</span>
            </button>
            {/* téléphone : la réponse se déplie sous sa question */}
            <div className="inline">{active === q.id && answer(q)}</div>
          </div>
        ))}
      </div>
      {/* grand écran : une seule zone de réponse sous la rangée */}
      <div className="below">{cur && answer(cur)}</div>
      <div className="cta">
        <button type="button" className="iconbtn primary big" onClick={() => onOpen(EMBED_ID)}>{mission.tool.label} →</button>
        <a className="iconbtn" href={mission.tool.url} target="_blank" rel="noopener">Nouvel onglet ↗</a>
      </div>
      {mission.tool.note && <p className="note">{mission.tool.note}</p>}
    </section>
  );
}

// L'outil dans la modale : l'iframe prend toute la place, un lien de secours ouvre la même page à part.
export function Embed({ url, title }: { url: string; title: string }) {
  const [ready, setReady] = useState(false);
  // Si l'iframe ne signale pas son chargement (page distante), on retire le message au bout de quelques secondes.
  useEffect(() => { const t = window.setTimeout(() => setReady(true), 5000); return () => window.clearTimeout(t); }, []);
  return (
    <div className={"embedwrap" + (ready ? " ready" : "")}>
      {!ready && <div className="loading">Chargement de l'outil…</div>}
      <iframe src={url} title={title} allow="fullscreen" onLoad={() => setReady(true)} />
      <a className="embedout" href={url} target="_blank" rel="noopener">Ouvrir dans un nouvel onglet ↗</a>
    </div>
  );
}
