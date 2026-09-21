import type { StopLite } from "./CityMap";

// Le parcours en vertical : sur téléphone, la carte devient illisible (étiquettes minuscules),
// on la remplace par un escalier d'arrêts — disque numéroté, lieu, titre, chevron — relié par un
// trait qui verdit à mesure qu'on avance.
type Props = {
  stops: StopLite[];
  visited: Set<string>;
  activeId: string | null;
  onSelect: (id: string) => void;
};

export default function StopList({ stops, visited, activeId, onSelect }: Props) {
  return (
    <ol className="stoplist" id="stoplist" aria-label={`Les ${stops.length} arrêts du trajet`}>
      {stops.map((s, i) => {
        const v = visited.has(s.id);
        const on = s.id === activeId;
        const cls = [
          "sstep",
          v ? "done" : "",
          on ? "on" : "",
          i > 0 && visited.has(stops[i - 1].id) ? "lit-up" : "",
          v ? "lit-down" : "",
        ].filter(Boolean).join(" ");
        return (
          <li key={s.id} className={cls}>
            <button type="button" onClick={() => onSelect(s.id)} aria-current={on ? "true" : undefined}
                    aria-label={`Arrêt ${s.order} : ${s.place}${v ? ", visité" : ""}`}>
              <span className="disc" aria-hidden="true">{v ? "✓" : s.order}</span>
              <span className="txt">
                <span className="pl">{s.place}</span>
                <span className="ti">{s.title}</span>
              </span>
              <span className="chev" aria-hidden="true">›</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
