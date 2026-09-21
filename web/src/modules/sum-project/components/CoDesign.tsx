import { useEffect, useRef, useState, type ReactNode } from "react";
import { assetUrl } from "../../../infrastructure/assetUrl";
import type { Process, ProcessStep } from "../lib/types";
import Sketch from "./Sketch";

// L'atelier de co-design en quatre étapes (arrêt « Carrefour »).
// C'est un guide, pas un jeu : les quatre étapes sont ouvertes dès l'arrivée, on en consulte une à la fois.
// Grand écran : une bande de quatre stations, le panneau de l'étape choisie en dessous.
// Téléphone : la bande devient une liste, l'étape choisie déplie son panneau sous son bouton (accordéon).
// ?step=<id> ouvre une étape d'emblée (affiche, QR code, vérification).

export const ROLE_PRINT = "roles-impression";   // #/carrefour/roles-impression : les cartes de rôle à imprimer

type Props = { process: Process; onOpen: (id: string) => void };

export default function CoDesign({ process, onOpen }: Props) {
  const steps = process.steps;
  const [active, setActive] = useState(steps[0]?.id || "");
  useEffect(() => {
    const s = new URLSearchParams(location.search).get("step");
    if (s && steps.some((x) => x.id === s)) setActive(s);
  }, [process]);

  // Un clic sur une étape amène son contenu dans la vue : sinon le panneau se déplie hors écran
  // (l'étape précédemment ouverte se referme au-dessus et décale la page).
  const root = useRef<HTMLElement>(null);
  const touched = useRef(false);
  useEffect(() => {
    if (!touched.current) return;
    const el = root.current; if (!el) return;
    const inline = getComputedStyle(el.querySelector(".inline")!).display !== "none";
    const target = inline ? el.querySelector(".pstepw.on") : el.querySelector(".below .ppanel");
    if (!target) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => target.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" }));
  }, [active]);
  const choose = (id: string) => { touched.current = true; setActive(id); };

  const idx = Math.max(0, steps.findIndex((s) => s.id === active));
  const cur = steps[idx];
  const go = (i: number) => { const s = steps[i]; if (s) choose(s.id); };

  const roles = process.roles;
  const method = process.method;

  const nav = (
    <div className="pnav">
      <button type="button" className="iconbtn" disabled={idx === 0} onClick={() => go(idx - 1)}>‹ Étape précédente</button>
      <button type="button" className="iconbtn" disabled={idx === steps.length - 1} onClick={() => go(idx + 1)}>Étape suivante ›</button>
    </div>
  );

  const figures = (s: ProcessStep) => s.images && s.images.length > 0 && (
    <div className="pfigs">
      {s.images.map((im, i) => (
        <figure key={i}>
          <img src={assetUrl(im.src)} alt={im.alt || im.caption} />
          <figcaption>{im.caption}{im.credit && <span> — {im.credit}</span>}</figcaption>
        </figure>
      ))}
    </div>
  );

  // La famille n'est pas répétée sur la carte : elle titre déjà le groupe (elle reste sur la carte imprimée).
  const rolecard = (icon: string, label: string, need: string, blank = false) => (
    <div className={"rolecard" + (blank ? " blank" : "")}>
      <span className="ic" aria-hidden="true">{blank ? "✎" : <Sketch name={icon} size={40} />}</span>
      <div className="txt">
        <div className="lbl">{label}</div>
        <div className="need"><b>Ce dont j'ai besoin :</b> {need}</div>
      </div>
    </div>
  );

  const body = (s: ProcessStep): ReactNode => {
    if (s.id === "inviter") return (
      <>
        <p className="ptext">{s.text}</p>
        <div className="fams">
          {roles.families.map((f) => (
            <div className="fam" key={f.id}>
              <h4 className="csec-title">{f.label}</h4>
              <div className="rolecards">
                {f.roles.map((r) => <div key={r.id}>{rolecard(r.icon, r.label, r.need)}</div>)}
              </div>
            </div>
          ))}
          <div className="fam">
            <h4 className="csec-title">Et qui manque ?</h4>
            <div className="rolecards">
              {[0, 1].map((i) => <div key={i}>{rolecard("", roles.blank.label, roles.blank.need, true)}</div>)}
            </div>
          </div>
        </div>
        <button type="button" className="iconbtn primary big" onClick={() => onOpen(ROLE_PRINT)}>Imprimer les cartes de rôle 🖨</button>
      </>
    );
    if (s.id === "parler") return (
      <>
        <p className="ptext">{s.text}</p>
        <div className="meth">
          <h4 className="csec-title">{method.name}</h4>
          <ol className="msteps">
            {method.steps.map((m) => (
              <li key={m.n}>
                <span className="disc" aria-hidden="true">{m.n}</span>
                <div>
                  <div className="mt">{m.title} <span className="chip blue">{m.time}</span></div>
                  <p>{m.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="menu" aria-label="Le menu de la co-création">
            {method.menu.map((c) => (
              <div className={"course" + (c.dish ? " on" : "")} key={c.course}>
                <div className="cn">{c.course}</div>
                <div className="cr">{c.role}</div>
                {c.dish && <div className="cd">{c.dish}</div>}
              </div>
            ))}
          </div>
          {method.note && <p className="mnote">{method.note}</p>}
        </div>
      </>
    );
    if (s.id === "voter") return (
      <>
        <p className="ptext">{s.text}</p>
        {s.table && <div className="notice">{s.table}</div>}
        <button type="button" className="iconbtn primary big" onClick={() => onOpen("__reveal")}>Ouvrir l'enveloppe ✉</button>
      </>
    );
    return (
      <>
        {figures(s)}
        <p className="ptext">{s.text}</p>
        {s.difficulties && s.difficulties.length > 0 && (
          <div className="chips">{s.difficulties.map((d, i) => <span className="chip" key={i}>{d}</span>)}</div>
        )}
      </>
    );
  };

  const panel = (s: ProcessStep) => (
    <div className="ppanel" role="region" aria-label={`Étape ${s.n} : ${s.title}`}>
      <div className="phead">
        <span className="disc" aria-hidden="true">{s.n}</span>
        <h3>{s.title}</h3>
        <span className="verb">{s.verb}</span>
      </div>
      {body(s)}
      {s.table && s.id !== "voter" && <div className="notice">{s.table}</div>}
      {nav}
    </div>
  );

  return (
    <section ref={root} className="codesign" aria-label="L'atelier en quatre étapes">
      <div className="chead">
        <div className="k">{process.eyebrow}</div>
        <p className="txt">{process.intro}</p>
      </div>

      <div className="pband">
        {steps.map((s) => (
          <div className={"pstepw" + (s.id === active ? " on" : "")} key={s.id}>
            <button type="button" className={"pstep" + (s.id === active ? " on" : "")}
                    aria-expanded={s.id === active} onClick={() => choose(s.id)}>
              <span className="disc" aria-hidden="true">{s.n}</span>
              <span className="t">{s.title}</span>
              <span className="verb">{s.verb}</span>
            </button>
            {/* téléphone : le panneau se déplie sous son étape */}
            <div className="inline">{s.id === active && panel(s)}</div>
          </div>
        ))}
      </div>

      {/* grand écran : un seul panneau sous la bande */}
      <div className="below">{cur && panel(cur)}</div>

      <div className="cta">
        {process.ctas.map((c) => (c.href
          ? <a key={c.label} className="iconbtn" href={assetUrl(c.href)} target="_blank" rel="noopener">{c.label} ↗</a>
          : <button key={c.label} type="button" className="iconbtn" onClick={() => onOpen(c.resource!)}>{c.label} →</button>))}
      </div>
    </section>
  );
}
