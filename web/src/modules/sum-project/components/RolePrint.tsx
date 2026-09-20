import { assetUrl } from "../../../infrastructure/assetUrl";
import type { Roles } from "../lib/types";
import Sketch from "./Sketch";

// Les cartes de rôle à imprimer (#/carrefour/roles-impression) : 12 rôles + 2 cartes vides,
// en cartes A6, quatre par page A4 portrait. Les règles @media print de codesign.css ne gardent
// que cette modale à l'impression ; le reste de la page disparaît.
type Props = { roles: Roles; logo?: string };

export default function RolePrint({ roles, logo = "/images/sum-logo.png" }: Props) {
  const cards = roles.families.flatMap((f) => f.roles.map((r) => ({ ...r, family: f.label, blank: false })));
  const blanks = [0, 1].map((i) => ({
    id: "blank-" + i, icon: "", family: "Carte vide", label: roles.blank.label, need: roles.blank.need, blank: true,
  }));

  return (
    <div className="roleprint">
      <div className="ptools">
        <button type="button" className="iconbtn primary" onClick={() => window.print()}>Imprimer 🖨</button>
        <span className="hint">14 cartes A6, quatre par page A4 — imprimez en portrait, découpez, distribuez-en une par personne.</span>
      </div>
      <div className="pcards">
        {[...cards, ...blanks].map((c) => (
          <div className={"rpcard" + (c.blank ? " blank" : "")} key={c.id}>
            <div className="rphead">
              <span className="fam">{c.family}</span>
              <img className="logo" src={assetUrl(logo)} alt="SUM" />
            </div>
            <div className="rpic" aria-hidden="true">{c.blank ? "✎" : <Sketch name={c.icon} size={64} />}</div>
            <h4>{c.label}</h4>
            <div className="need"><b>Ce dont j'ai besoin</b><span>{c.need}</span></div>
            <div className="prompts">
              {roles.prompts.map((p, i) => (
                <div className="prompt" key={i}><span>{p}</span><i /><i /></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
