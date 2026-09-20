import type { ReactNode } from "react";
import type { Chart as ChartDef } from "../lib/types";

// Barres horizontales : une par frein, la plus longue en haut. Les valeurs viennent du JSON.
function Bars({ unit, items }: { unit?: string; items: { label: string; value: number }[] }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="bars" role="img" aria-label={items.map((i) => `${i.label} : ${i.value}${unit || ""}`).join(", ")}>
      {items.map((i) => (
        <div className="bar" key={i.label}>
          <div className="lbl">{i.label}</div>
          <div className="trk"><div className="fill" style={{ width: `${(i.value / max) * 100}%` }} /></div>
          <div className="val">{i.value}{unit}</div>
        </div>
      ))}
    </div>
  );
}

// Frise : une ligne, un point par étape, la date au-dessus, le texte en dessous. `horizontal` : en ligne sur grand écran.
function Timeline({ items, horizontal }: { items: { when: string; text: string }[]; horizontal?: boolean }) {
  return (
    <ol className={"tl" + (horizontal ? " horizontal" : "")}>
      {items.map((i, k) => (
        <li key={k}><span className="dot" aria-hidden="true" /><b>{i.when}</b><span>{i.text}</span></li>
      ))}
    </ol>
  );
}

// Avant / après : deux barres par ligne (avant en bleu clair, après en bleu SUM), les deux valeurs écrites à côté.
const fr = (n: number) => String(n).replace(".", ",");
function Delta({ unit, items }: { unit?: string; items: { label: string; before: number; after: number; beforeText?: string; afterText?: string }[] }) {
  const max = Math.max(...items.flatMap((i) => [i.before, i.after]), 1);
  const u = unit || "";
  return (
    <div className="delta" role="img" aria-label={items.map((i) => `${i.label} : ${i.beforeText || fr(i.before)}${u} avant, ${i.afterText || fr(i.after)}${u} après`).join(" ; ")}>
      {items.map((i) => (
        <div className="drow" key={i.label}>
          <div className="lbl">{i.label}</div>
          <div className="pair">
            <div className="trk"><div className="fill before" style={{ width: `${(i.before / max) * 100}%` }} /></div>
            <div className="trk"><div className="fill after" style={{ width: `${(i.after / max) * 100}%` }} /></div>
          </div>
          <div className="vals"><span className="b">{i.beforeText || fr(i.before)}{u}</span><span className="ar" aria-hidden="true">→</span><b className="a">{i.afterText || fr(i.after)}{u}</b></div>
        </div>
      ))}
      <div className="dlegend" aria-hidden="true"><span><i className="sw before" /> avant</span><span><i className="sw after" /> après</span></div>
    </div>
  );
}

// Acceptation : un visage de couleur (vert / ambre / rouge) plutôt qu'un émoji, lisible de loin et sans les couleurs
// grâce à la bouche. Les données gardent l'émoji ; « NA » devient un rond vide.
const FACE: Record<string, { tone: string; label: string; mouth: string }> = {
  "🙂": { tone: "good", label: "au-dessus de la moyenne", mouth: "M7.5 14 Q12 19 16.5 14" },
  "😐": { tone: "mid", label: "dans la moyenne", mouth: "M8 15.5 H16" },
  "🙁": { tone: "bad", label: "en dessous de la moyenne", mouth: "M7.5 17.5 Q12 12.5 16.5 17.5" },
};
export function Smiley({ value }: { value: string }) {
  const f = FACE[value];
  if (!f) {
    if (value !== "NA") return <>{value}</>;
    return (
      <span className="smile na" role="img" aria-label="non évalué">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle className="bg" cx="12" cy="12" r="10" /><path className="mouth" d="M8 12 H16" /></svg>
      </span>
    );
  }
  return (
    <span className={"smile " + f.tone} role="img" aria-label={f.label}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle className="bg" cx="12" cy="12" r="11" />
        <circle className="eye" cx="8.5" cy="9.5" r="1.7" /><circle className="eye" cx="15.5" cy="9.5" r="1.7" />
        <path className="mouth" d={f.mouth} />
      </svg>
    </span>
  );
}

// La légende « 🙂 au-dessus de la moyenne · 😐 … » écrite dans le JSON, rendue avec les mêmes visages.
export function LegendFaces({ text }: { text: string }) {
  const parts = text.split(" · ").map((t) => t.trim()).filter(Boolean);
  return (
    <div className="legendfaces">
      {parts.map((t, i) => {
        const m = t.match(/^(🙂|😐|🙁|NA)\s*(.*)$/u);
        const icon: ReactNode = m ? <Smiley value={m[1]} /> : null;
        return <span key={i}>{icon}{m ? m[2] : t}</span>;
      })}
    </div>
  );
}

// Grille d'émojis : une ligne par service, une colonne par critère. Les `headCols` premières colonnes forment l'en-tête de ligne (ville + service).
// Une ligne tout en vert est surlignée : c'est la réponse à « devinez les villes tout en vert ».
function Matrix({ columns, rows, legend, headCols = 1 }: { columns: string[]; rows: string[][]; legend?: string; headCols?: number }) {
  return (
    <div className="mtx">
      <table>
        <thead><tr><th className="h">{columns.slice(0, headCols).join(" · ")}</th>{columns.slice(headCols).map((c, j) => <th key={j}>{c}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => {
          const cells = r.slice(headCols);
          const allgood = cells.length > 0 && cells.every((v) => v === "🙂");
          return (
            <tr key={i} className={allgood ? "allgood" : undefined}>
              <td className="h">{r.slice(0, headCols).map((v, j) => j === 0 ? <b key={j}>{v}</b> : <small key={j}>{v}</small>)}</td>
              {cells.map((v, j) => <td key={j} className="e"><Smiley value={v} /></td>)}
            </tr>
          );
        })}</tbody>
      </table>
      {legend && <LegendFaces text={legend} />}
    </div>
  );
}

export default function Chart({ chart }: { chart: ChartDef }) {
  if (chart.type === "bars") return <Bars unit={chart.unit} items={chart.items} />;
  if (chart.type === "timeline") return <Timeline items={chart.items} horizontal={chart.horizontal} />;
  if (chart.type === "delta") return <Delta unit={chart.unit} items={chart.items} />;
  return <Matrix columns={chart.columns} rows={chart.rows} legend={chart.legend} headCols={chart.headCols} />;
}
