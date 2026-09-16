import type { Resource, Source } from "../lib/types";
import { assetUrl } from "../../../infrastructure/assetUrl";

export function SourceLine({ s }: { s?: Source | null }) {
  if (!s) return null;
  const parts: string[] = [];
  if (s.report) parts.push("Rapport final " + s.report);
  if (s.task) parts.push(s.task);
  if (s.partner) parts.push(s.partner);
  if (s.livingLab) parts.push("Living Lab : " + s.livingLab);
  return <div className="src">Source : {parts.join(" · ")}</div>;
}

export default function ResourceDetail({ r, onBack }: { r: Resource; onBack: () => void }) {
  return (
    <article className="detail">
      <button className="iconbtn back" type="button" onClick={onBack}>← Ressources</button>
      <h3>{r.title}</h3>
      {r.teaser && <div className="teaser">{r.teaser}</div>}
      {(r.body || []).map((b, i) => <p key={i}>{b}</p>)}
      {r.items && (
        <ul className="items">
          {r.items.map((it, i) => (
            <li key={i}><b>{it.title}</b> — {it.text}{it.partner && <small> ({it.partner})</small>}</li>
          ))}
        </ul>
      )}
      {r.table && (
        <div className="tblwrap">
          <table>
            <thead><tr>{r.table.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>{r.table.rows.map((row, i) => <tr key={i}>{row.map((v, j) => <td key={j} className={j > 1 ? "e" : ""}>{v}</td>)}</tr>)}</tbody>
          </table>
          {r.legend && <div className="legendtxt">{r.legend}</div>}
        </div>
      )}
      {r.facts && r.facts.length > 0 && (
        <div className="facts">
          {r.facts.map((f, i) => <div className="fact" key={i}><div className="l">{f.label}</div><div className="v">{f.value}</div></div>)}
        </div>
      )}
      {(r.images || []).map((img, i) => (
        <figure className="imgph" key={i}>
          {img.src ? <img src={assetUrl(img.src)} alt={img.caption} /> : <b>IMAGE À INSÉRER</b>}
          <div>{img.caption}</div>
          {!img.src && img.suggestedSource && <small>Source suggérée : {img.suggestedSource}</small>}
        </figure>
      ))}
      {r.links && r.links.length > 0 && (
        <div className="links">
          {r.links.map((l, i) => l.url
            ? <a key={i} href={l.url} target="_blank" rel="noopener">{l.label} ↗</a>
            : <span key={i} className="todo">{l.label} — URL à compléter</span>)}
        </div>
      )}
      <SourceLine s={r.source} />
    </article>
  );
}
