import { useEffect, useRef, useState, type ReactNode } from "react";
import { assetUrl } from "../../../infrastructure/assetUrl";
import type { CitiesBlock, MeasureType, Process, ProcessStep } from "../lib/types";
import Sketch from "./Sketch";

// L'atelier de co-design en quatre étapes (arrêt « Carrefour »).
// C'est un guide, pas un jeu : les quatre étapes sont ouvertes dès l'arrivée, on en consulte une à la fois.
// Étape 1 : les trois sites lyonnais, chacun ouvre sa fiche en modale (#/carrefour/site-<id>).
// Étape 3 : les mesures des neuf villes du projet servent de banque d'idées (contrainte / incitation).
// Grand écran : une bande de quatre stations, le panneau de l'étape choisie en dessous.
// Téléphone : la bande devient une liste, l'étape choisie déplie son panneau sous son bouton (accordéon).
// ?step=<id> ouvre une étape d'emblée (affiche, QR code, vérification).

export const ROLE_PRINT = "roles-impression";   // #/carrefour/roles-impression : les cartes de rôle à imprimer
export const SITE_PREFIX = "site-";             // #/carrefour/site-<id> : la fiche d'un des trois sites

type Props = { process: Process; cities: CitiesBlock; onOpen: (id: string) => void };

export default function CoDesign({ process, cities, onOpen }: Props) {
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
  const measures = process.measures;

  const nav = (
    <div className="pnav">
      <button type="button" className="iconbtn" disabled={idx === 0} onClick={() => go(idx - 1)}>‹ Étape précédente</button>
      <button type="button" className="iconbtn" disabled={idx === steps.length - 1} onClick={() => go(idx + 1)}>Étape suivante ›</button>
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

  // Les villes qui l'ont fait, sous chaque idée : le drapeau et le nom, jamais l'identifiant brut.
  const cityName = (id: string) => {
    const c = cities.items.find((x) => x.id === id);
    return c ? c.flag + " " + c.name : id;
  };

  // Une colonne de la banque d'idées : l'étiquette et la couleur viennent du bloc « villes ».
  const mcol = (t: MeasureType) => (
    <div className="mcol" style={{ borderTopColor: cities.measureTypes[t].color }}>
      <h4>
        <span className={"badge " + t}>{cities.measureTypes[t].label}</span>
        <span className="d">{cities.measureTypes[t].description}</span>
      </h4>
      {measures.items.filter((m) => m.type === t).map((m) => (
        <div className="mcard" key={m.id}>
          <div className="lbl">{m.title}</div>
          <p>{m.text}</p>
          {m.cities && m.cities.length > 0 && <div className="cities">{m.cities.map(cityName).join(" · ")}</div>}
        </div>
      ))}
      {/* la carte vide ferme la colonne courte (six contraintes contre quatorze incitations) */}
      {t === "push" && (
        <div className="mcard blank">
          <span className="ic" aria-hidden="true">✎</span>
          <div><div className="lbl">{measures.blank.label}</div><p>{measures.blank.need}</p></div>
        </div>
      )}
    </div>
  );

  const body = (s: ProcessStep): ReactNode => {
    if (s.id === "voir") return (
      <>
        <p className="ptext">{s.text}</p>
        <div className="sites">
          {process.sites.map((st) => (
            <button type="button" className="site" key={st.id} onClick={() => onOpen(SITE_PREFIX + st.id)}>
              {st.images[0] && <img src={assetUrl(st.images[0].src)} alt={st.images[0].alt || st.images[0].caption} />}
              <span className="nm">{st.short}<span className="city">{st.city}</span></span>
              <span className="q">{st.question}</span>
              <span className="more">Voir le site →</span>
            </button>
          ))}
        </div>
      </>
    );
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
        {measures.intro && <p className="ptext muted">{measures.intro}</p>}
        <div className="measures">
          {mcol("push")}
          {mcol("pull")}
        </div>
      </>
    );
    // « Voter » n'a que son texte : la consigne de table suffit, le vote clôt l'atelier.
    return <p className="ptext">{s.text}</p>;
  };

  const panel = (s: ProcessStep) => (
    <div className="ppanel" role="region" aria-label={`Étape ${s.n} : ${s.title}`}>
      <div className="phead">
        <span className="disc" aria-hidden="true">{s.n}</span>
        <h3>{s.title}</h3>
        <span className="verb">{s.verb}</span>
      </div>
      {body(s)}
      {s.table && <div className="notice">{s.table}</div>}
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
