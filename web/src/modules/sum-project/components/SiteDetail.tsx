import { assetUrl } from "../../../infrastructure/assetUrl";
import type { Roles, Site } from "../lib/types";
import Sketch from "./Sketch";

// La fiche d'un site (#/<arrêt>/site-<id>) : la même page que dans le jeu imprimé.
// À gauche ce qu'on lit avant de regarder, à droite le plan puis les deux vues de rue.
// Les constats sont des observations : le groupe les vérifie et les corrige sur place.

export default function SiteDetail({ site, roles }: { site: Site; roles: Roles }) {
  const all = roles.families.flatMap((f) => f.roles);

  const fig = (i: number, cls?: string) => {
    const im = site.images[i];
    if (!im) return null;
    return (
      <figure className={cls} key={i}>
        <img src={assetUrl(im.src)} alt={im.alt || im.caption} />
        <figcaption>{im.caption}{im.credit && <span> — {im.credit}</span>}</figcaption>
      </figure>
    );
  };

  return (
    <article className="sitedetail">
      <div className="txt">
        <h3>{site.name}</h3>
        <div className="addr">{site.city}</div>
        <p className="q">{site.question}</p>
        {site.context && <p>{site.context}</p>}
        <h4 className="csec-title">Le problème</h4>
        <ul className="lines">{site.problem.map((p, i) => <li key={i}>{p}</li>)}</ul>
        <div className="who">
          <b>Qui est concerné ?</b> {site.who}
          {/* .rolechip et non .chip : .presenter .chip est masqué sur l'écran projeté */}
          <div className="rolechips">
            {site.roles.map((id) => {
              const r = all.find((x) => x.id === id);
              return r ? <span className="rolechip" key={id}><Sketch name={r.icon} size={18} /> {r.label}</span> : null;
            })}
          </div>
        </div>
      </div>
      <div className="pics">
        {fig(0, "big")}
        <div className="two">{fig(1)}{fig(2)}</div>
      </div>
    </article>
  );
}
