import { useMemo, useState } from "react";

/* Démo pédagogique « Fixez le prix ».
   Modèle de choix (logit) volontairement simplifié, paramètres ILLUSTRATIFS — ni les données de Genève,
   ni les résultats du modèle de recherche. Il sert à faire sentir le mécanisme à deux niveaux :
   le décideur fixe prix + recommandation (niveau 1), les voyageurs réagissent (niveau 2). */

type Group = { id: string; label: string; share: number; bTime: number; bCost: number; ascCar: number };
const GROUPS: Group[] = [
  { id: "etu", label: "Étudiant·es", share: 0.30, bTime: 0.06, bCost: 1.5, ascCar: 0.0 },
  { id: "act", label: "Actif·ves", share: 0.45, bTime: 0.10, bCost: 0.7, ascCar: 0.8 },
  { id: "fam", label: "Familles & seniors", share: 0.25, bTime: 0.08, bCost: 1.0, ascCar: 1.0 },
];
const N = 1000; // trajets typiques de 5 km
const PT_FARE = 2.0, CAR_COST = 3.0;

type Inputs = { pPeak: number; pOff: number; discount: number; reco: boolean; peak: boolean };
type Out = { shares: { car: number; pt: number; ptBike: number }; byGroup: Record<string, number>; revenue: number; cars: number; welfare: number; bikePrice: number };

function simulate(i: Inputs): Out {
  const bikePrice = Math.max(0, (i.peak ? i.pPeak : i.pOff) - i.discount);
  const tCar = i.peak ? 30 : 20, tPt = i.peak ? 30 : 28, tPtBike = i.peak ? 21 : 20;
  const availPenalty = i.peak ? 0.35 : 0.1; // vélos plus rares en pointe
  const recoBonus = i.reco ? 0.7 : 0;
  let car = 0, pt = 0, ptBike = 0, welfare = 0; const byGroup: Record<string, number> = {};
  for (const g of GROUPS) {
    const uCar = g.ascCar - g.bTime * tCar - g.bCost * CAR_COST;
    const uPt = -g.bTime * tPt - g.bCost * PT_FARE;
    const uPb = recoBonus - availPenalty - g.bTime * tPtBike - g.bCost * (PT_FARE + bikePrice);
    const m = Math.max(uCar, uPt, uPb);
    const eC = Math.exp(uCar - m), eP = Math.exp(uPt - m), eB = Math.exp(uPb - m), Z = eC + eP + eB;
    const sC = eC / Z, sP = eP / Z, sB = eB / Z;
    car += g.share * sC; pt += g.share * sP; ptBike += g.share * sB; byGroup[g.id] = sB;
    welfare += g.share * (m + Math.log(Z)) / g.bCost; // surplus en € par trajet
  }
  const cars = Math.round(car * N);
  const revenue = ptBike * N * bikePrice;
  const total = welfare * N + revenue - cars * 0.5; // bien-être ≈ surplus usagers + recettes − nuisance voiture (0,5 €/voiture)
  return { shares: { car, pt, ptBike }, byGroup, revenue, cars, welfare: total, bikePrice };
}

type Objective = "cars" | "revenue" | "welfare";
function best(i: Inputs, obj: Objective): number {
  let bestP = 0, bestV = -Infinity;
  for (let p = 0; p <= 3.0001; p += 0.25) {
    const o = simulate({ ...i, pPeak: i.peak ? p : i.pPeak, pOff: i.peak ? i.pOff : p });
    const v = obj === "cars" ? -o.cars : obj === "revenue" ? o.revenue : o.welfare;
    if (v > bestV) { bestV = v; bestP = p; }
  }
  return bestP;
}

const eur = (v: number) => v.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €";
const pct = (v: number) => Math.round(v * 100) + " %";

export default function PricingDemo() {
  const [inp, setInp] = useState<Inputs>({ pPeak: 1.5, pOff: 1.0, discount: 0, reco: false, peak: true });
  const [obj, setObj] = useState<Objective>("welfare");
  const [showBest, setShowBest] = useState(false);
  const out = useMemo(() => simulate(inp), [inp]);
  const ref = useMemo(() => simulate({ pPeak: 1.5, pOff: 1.0, discount: 0, reco: false, peak: inp.peak }), [inp.peak]);
  const dW = out.welfare - ref.welfare;
  const bestP = useMemo(() => best(inp, obj), [inp, obj]);
  const set = (k: keyof Inputs, v: number | boolean) => { setInp((s) => ({ ...s, [k]: v })); setShowBest(false); };

  return (
    <section className="pdemo" aria-label="Démo Fixez le prix">
      <div className="pd-head">
        <div>
          <div className="k">Démo · niveau 1 : vous décidez, niveau 2 : les habitants réagissent</div>
          <h3>Fixez le prix du vélo</h3>
        </div>
        <div className="seg" role="group" aria-label="Moment de la journée">
          <button type="button" aria-pressed={inp.peak} onClick={() => set("peak", true)}>8 h · pointe</button>
          <button type="button" aria-pressed={!inp.peak} onClick={() => set("peak", false)}>15 h · creuse</button>
        </div>
      </div>

      <div className="pd-grid">
        <div className="pd-controls">
          <label><span>Prix du vélo en pointe <b>{inp.pPeak.toFixed(2)} €</b></span>
            <input id="pPeak" type="range" min="0" max="3" step="0.25" value={inp.pPeak} onChange={(e) => set("pPeak", +e.target.value)} /></label>
          <label><span>Prix du vélo en heures creuses <b>{inp.pOff.toFixed(2)} €</b></span>
            <input id="pOff" type="range" min="0" max="3" step="0.25" value={inp.pOff} onChange={(e) => set("pOff", +e.target.value)} /></label>
          <label><span>Remise billet combiné TC + vélo <b>− {inp.discount.toFixed(2)} €</b></span>
            <input id="discount" type="range" min="0" max="1.5" step="0.25" value={inp.discount} onChange={(e) => set("discount", +e.target.value)} /></label>
          <label className="chk"><input id="reco" type="checkbox" checked={inp.reco} onChange={(e) => set("reco", e.target.checked)} />
            <span>L'appli recommande d'abord le trajet TC + vélo</span></label>
          <div className="obj">
            <span>Votre objectif</span>
            <select id="objective" value={obj} onChange={(e) => { setObj(e.target.value as Objective); setShowBest(false); }}>
              <option value="cars">Le moins de voitures possible</option>
              <option value="revenue">Le plus de recettes pour l'opérateur</option>
              <option value="welfare">Le meilleur équilibre (usagers + opérateur + trafic)</option>
            </select>
            <button type="button" className="iconbtn primary" onClick={() => setShowBest(true)}>Que propose le modèle ?</button>
            {showBest && <div className="best">Pour cet objectif, {inp.peak ? "en pointe" : "en heures creuses"}, le prix calculé serait <b>{bestP.toFixed(2)} €</b> (avec vos autres réglages). {Math.abs(bestP - (inp.peak ? inp.pPeak : inp.pOff)) < 0.01 ? "C'est votre prix !" : "Essayez-le."}</div>}
          </div>
        </div>

        <div className="pd-results">
          <div className="bar" aria-label="Répartition des trajets">
            <div className="seg-car" style={{ width: pct(out.shares.car) }} title="Voiture">🚗 {pct(out.shares.car)}</div>
            <div className="seg-pt" style={{ width: pct(out.shares.pt) }} title="Transports en commun">🚌 {pct(out.shares.pt)}</div>
            <div className="seg-pb" style={{ width: pct(out.shares.ptBike) }} title="TC + vélo partagé">🚲 {pct(out.shares.ptBike)}</div>
          </div>
          <div className="tiles4">
            <div className="fact"><div className="l">Voitures sur 1 000 trajets</div><div className="v">{out.cars}</div></div>
            <div className="fact"><div className="l">Recettes vélo</div><div className="v">{eur(out.revenue)}</div></div>
            <div className="fact"><div className="l">Prix payé pour le vélo</div><div className="v">{out.bikePrice.toFixed(2)} €</div></div>
            <div className="fact"><div className="l">Bien-être vs. prix de référence</div><div className="v">{dW >= 0 ? "+ " : "− "}{eur(Math.abs(dW))}</div></div>
          </div>
          <div className="groups">
            <div className="k">Qui prend le vélo ? (part TC + vélo par groupe)</div>
            {GROUPS.map((g) => (
              <div className="grow" key={g.id}><span>{g.label}</span><div className="track"><div style={{ width: pct(out.byGroup[g.id]) }} /></div><b>{pct(out.byGroup[g.id])}</b></div>
            ))}
            <div className="note">Écart entre le groupe le plus sensible au prix et le moins sensible : <b>{Math.round(Math.abs(out.byGroup.etu - out.byGroup.act) * 100)} points</b>. Plus c'est petit, plus la mesure est équitable.</div>
          </div>
        </div>
      </div>
      <div className="pd-foot">Modèle pédagogique simplifié, paramètres illustratifs (1 000 trajets de 5 km, trois groupes d'habitants ; référence = 1,50 € en pointe / 1,00 € en creuse, sans remise ni recommandation). Ce ne sont ni les données de Genève ni les résultats du modèle de recherche.</div>
    </section>
  );
}
