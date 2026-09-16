import type { CitiesBlock, CityItem, CityMeasure } from "../lib/types";
import Gallery from "./Gallery";

type Props = { city: CityItem; m: CityMeasure; block: CitiesBlock; onBack: () => void };

// Fiche d'une mesure : photos, résumé, détails, chiffre clé, résultats de la ville, source.
export default function MeasureDetail({ city, m, block, onBack }: Props) {
  const t = block.measureTypes[m.type];
  return (
    <article className="detail mdetail">
      <button className="iconbtn back" type="button" onClick={onBack}>← Villes</button>
      <div className="mhead">
        <span className={"badge " + m.type}>{t.label}</span>
        <span className="who"><span className="flag">{city.flag}</span> {city.name} · {city.country}</span>
      </div>
      <h3>{m.title}</h3>
      {m.images && m.images.length > 0 && <Gallery images={m.images} />}
      {m.summary && <p>{m.summary}</p>}
      {m.details && m.details.length > 0 && (
        <ul className="items">{m.details.map((d, i) => <li key={i}>{d}</li>)}</ul>
      )}
      {m.keyFigure && (
        <div className="facts">
          <div className="fact"><div className="l">{m.keyFigure.label}</div><div className="v big">{m.keyFigure.value}</div></div>
        </div>
      )}
      {city.results && city.results.length > 0 && (
        <>
          <h4 className="sub">Ce qui s'est passé à {city.name}</h4>
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
          <a href={city.odpUrl || block.source.odp} target="_blank" rel="noopener">Voir les données sur l'Open Data Platform ↗</a>
        )}
      </div>
      {(m.source || block.source.presentations) && (
        <div className="src">Source : {m.source || block.source.presentations}</div>
      )}
    </article>
  );
}
