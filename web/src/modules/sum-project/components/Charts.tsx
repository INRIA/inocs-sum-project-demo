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

// Frise : une ligne, un point par étape, la date au-dessus, le texte en dessous.
function Timeline({ items }: { items: { when: string; text: string }[] }) {
  return (
    <ol className="tl">
      {items.map((i, k) => (
        <li key={k}><span className="dot" aria-hidden="true" /><b>{i.when}</b><span>{i.text}</span></li>
      ))}
    </ol>
  );
}

// Grille d'émojis : une ligne par service, une colonne par critère. Les `headCols` premières colonnes forment l'en-tête de ligne (ville + service).
function Matrix({ columns, rows, legend, headCols = 1 }: { columns: string[]; rows: string[][]; legend?: string; headCols?: number }) {
  return (
    <div className="mtx">
      <table>
        <thead><tr><th className="h">{columns.slice(0, headCols).join(" · ")}</th>{columns.slice(headCols).map((c, j) => <th key={j}>{c}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={i}>
            <td className="h">{r.slice(0, headCols).map((v, j) => j === 0 ? <b key={j}>{v}</b> : <small key={j}>{v}</small>)}</td>
            {r.slice(headCols).map((v, j) => <td key={j} className="e">{v}</td>)}
          </tr>
        ))}</tbody>
      </table>
      {legend && <div className="legendtxt">{legend}</div>}
    </div>
  );
}

export default function Chart({ chart }: { chart: ChartDef }) {
  if (chart.type === "bars") return <Bars unit={chart.unit} items={chart.items} />;
  if (chart.type === "timeline") return <Timeline items={chart.items} />;
  return <Matrix columns={chart.columns} rows={chart.rows} legend={chart.legend} headCols={chart.headCols} />;
}
