import { assetUrl } from "../../../infrastructure/assetUrl";
import type { CityItem, Stop } from "../lib/types";

// Bandeau des villes : une photo, un drapeau, un nom. Toucher une ville ouvre sa carte à l'arrêt Destination.
type Props = { strip: NonNullable<Stop["cityStrip"]>; cities: CityItem[] };

export default function CityStrip({ strip, cities }: Props) {
  return (
    <section className="citystrip" aria-label={strip.title}>
      <div className="head">
        <h3 className="csec-title">{strip.title}</h3>
        {strip.lead && <p className="lead">{strip.lead}</p>}
      </div>
      <div className="tiles">
        {cities.map((c) => (
          <a key={c.id} className="ctile" href={"#/destination/" + c.id} aria-label={`${c.name}, ${c.country} — voir la ville`}>
            {c.hero ? <img src={assetUrl(c.hero.src)} alt="" loading="lazy" /> : <div className="ph" aria-hidden="true">{c.flag}</div>}
            <span className="cap"><span className="flag" aria-hidden="true">{c.flag}</span><b>{c.name}</b></span>
          </a>
        ))}
      </div>
    </section>
  );
}
