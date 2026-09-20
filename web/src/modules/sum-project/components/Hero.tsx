import { assetUrl } from "../../../infrastructure/assetUrl";
import type { Hero as HeroBlock } from "../lib/types";

// Bandeau bleu en tête de l'arrêt (arrêt 5 : la plateforme de données ouvertes).
// À gauche la capture d'écran, à droite le chiffre, ce qu'on y trouve et les liens ;
// à côté (grand écran) une tuile chiffre. « En savoir plus » ouvre la fiche en modale.
type Props = { hero: HeroBlock; onOpen: (res: string) => void };

export default function Hero({ hero, onOpen }: Props) {
  const links = hero.links || [];
  return (
    <section className="heroblock" aria-label={hero.kicker}>
      <div className="hmain">
        {hero.image && hero.image.src && (
          <figure className="hshot">
            <img src={assetUrl(hero.image.src)} alt={hero.image.alt || hero.image.caption} />
            {hero.image.caption && <figcaption>{hero.image.caption}</figcaption>}
          </figure>
        )}
        <div className="htxt">
          <div className="k">{hero.kicker}</div>
          <div className="fig">{hero.figure}</div>
          <div className="l">{hero.label}</div>
          {hero.text && <p className="t">{hero.text}</p>}
          {hero.lines && hero.lines.length > 0 && (
            <ul className="hlines">{hero.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
          )}
          <div className="hcta">
            {links.map((l, i) => (
              <a key={l.url} className={"iconbtn" + (i === 0 ? " primary" : " ghost")} href={l.url} target="_blank" rel="noopener">
                {l.label} ↗
              </a>
            ))}
            {hero.resource && (
              <button type="button" className="iconbtn ghost" onClick={() => onOpen(hero.resource!)}>En savoir plus →</button>
            )}
          </div>
        </div>
      </div>
      {hero.stat && (
        <aside className="hstat">
          <div className="v">{hero.stat.value}</div>
          <div className="l">{hero.stat.label}</div>
          {hero.stat.teaser && <p className="t">{hero.stat.teaser}</p>}
          {hero.stat.resource && (
            <button type="button" className="iconbtn ghost" onClick={() => onOpen(hero.stat!.resource!)}>En savoir plus →</button>
          )}
        </aside>
      )}
    </section>
  );
}
