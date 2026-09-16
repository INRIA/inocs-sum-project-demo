import { useEffect } from "react";
import { assetUrl } from "../../../infrastructure/assetUrl";
import type { CitiesBlock, CityItem } from "../lib/types";
import { NsmMove } from "./CityCards";
import Gallery from "./Gallery";

type Props = { city: CityItem; block: CitiesBlock; measureId: string | null };

// L'histoire d'une ville, en une page : le contexte en trois lignes, chaque mesure avec sa photo
// et sa phrase, les résultats en puces, ce qui n'a pas eu lieu, le lien vers ses données.
export default function CityStory({ city, block, measureId }: Props) {
  // Ouvert depuis une mesure : on s'y positionne et on la met en évidence.
  useEffect(() => {
    if (!measureId) return;
    const el = document.getElementById("mesure-" + measureId);
    el?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [measureId]);

  const role = city.role === "leader" ? "ville leader" : city.role === "suiveuse" ? "ville suiveuse" : city.role;
  return (
    <article className="detail story">
      <header className="shead">
        <span className="flag" aria-hidden="true">{city.flag}</span>
        <div className="who">
          <h3>{city.name}</h3>
          <div className="c">{city.country}{role && <> · {role}</>}</div>
        </div>
        <div className="smove"><div className="k">Mobilité partagée (NSM)</div><NsmMove c={city} compact /></div>
      </header>
      {city.tagline && <p className="lead">{city.tagline}</p>}
      {city.context && <p>{city.context}</p>}

      <h4 className="sub">Ce que la ville a fait</h4>
      <ol className="steps">
        {city.measures.map((m, i) => {
          const imgs = m.images || [];
          const first = imgs[0];
          const more = (m.details && m.details.length > 0) || imgs.length > 1;
          return (
            <li key={m.id} id={"mesure-" + m.id} className={m.id === measureId ? "on" : ""}>
              <div className="num" aria-hidden="true">{i + 1}</div>
              <figure className="pic">
                {first && first.src ? <img src={assetUrl(first.src)} alt={first.alt || first.caption} loading="lazy" /> : <div className="ph">Pas de photo</div>}
                {first && first.caption && <figcaption>{first.caption}</figcaption>}
              </figure>
              <div className="txt">
                <div className="mh"><span className={"badge " + m.type}>{block.measureTypes[m.type].label}</span><b>{m.title}</b></div>
                <p>{m.summary}</p>
                {m.keyFigure && <div className="kf"><b>{m.keyFigure.value}</b> {m.keyFigure.label}</div>}
                {more && (
                  <details open={m.id === measureId}>
                    <summary>Plus de détails</summary>
                    {m.details && m.details.length > 0 && <ul className="items">{m.details.map((d, k) => <li key={k}>{d}</li>)}</ul>}
                    {imgs.length > 1 && <Gallery images={imgs} />}
                  </details>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {city.results && city.results.length > 0 && (
        <>
          <h4 className="sub">Ce qui s'est passé</h4>
          <ul className="items">{city.results.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </>
      )}
      {city.notDone && city.notDone.length > 0 && (
        <>
          <h4 className="sub">Ce qui n'a pas eu lieu</h4>
          <ul className="items soft">{city.notDone.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </>
      )}
      <div className="links">
        {(city.odpUrl || block.source.odp) && (
          <a href={city.odpUrl || block.source.odp} target="_blank" rel="noopener">Voir les données de {city.name} sur l'Open Data Platform ↗</a>
        )}
      </div>
      <div className="src">Source : {block.source.presentations}</div>
    </article>
  );
}
