import { useEffect, useRef, useState } from "react";
import type { Stop } from "../lib/types";
import { loadPick, loadReflect } from "../lib/pickState";
import { CONSEIL_ID } from "./StopList";

// Le billet : le même objet du début à la fin du trajet. Six cases — cinq arrêts et le conseil
// municipal — qui se tamponnent au passage, plus deux souvenirs du Belvédère (le nombre d'idées
// choisies et ce qui a le plus surpris). Discret dans l'en-tête d'un arrêt, en grand sur l'écran de clôture.

type Props = {
  stops: Stop[];
  visited: Set<string>;
  activeId: string | null;      // « conseil » sur l'écran de clôture
  onSelect: (id: string) => void;
  big?: boolean;                // variante de clôture : cases de 56 px, le lieu sous chaque case
};

export default function Ticket({ stops, visited, activeId, onSelect, big = false }: Props) {
  const pickStop = stops.find((s) => s.game?.pick) || null;
  const statuses = pickStop?.game?.pick?.statuses || [];

  // Souvenirs gardés par appareil : relus après le montage (jamais au rendu serveur).
  const [nPicked, setNPicked] = useState<number | null>(null);
  const [reflect, setReflect] = useState<string | null>(null);
  useEffect(() => {
    if (!pickStop) return;
    const saved = loadPick(pickStop.id);
    setNPicked(saved.revealed ? saved.picked.length : null);
    setReflect(loadReflect(pickStop.id));
  }, [pickStop, activeId, visited]);
  const status = statuses.find((b) => b.id === reflect) || null;

  // Le coup de tampon : seulement pour l'arrêt qu'on vient de visiter, jamais au montage.
  const seen = useRef<Set<string> | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  useEffect(() => {
    const before = seen.current;
    seen.current = new Set(visited);
    if (!before) return;
    const id = [...visited].find((x) => !before.has(x));
    if (!id) return;
    setFresh(id);
    const t = window.setTimeout(() => setFresh(null), 700);
    return () => window.clearTimeout(t);
  }, [visited]);

  const slot = (id: string, n: string, label: string, place: string, v: boolean) => {
    const cls = ["tk", v ? "on" : "", id === activeId ? "cur" : "", id === fresh ? "fresh" : "",
                 id === CONSEIL_ID ? "fin" : ""].filter(Boolean).join(" ");
    return (
      <li key={id}>
        <button type="button" className={cls} onClick={() => onSelect(id)}
                aria-current={id === activeId ? "true" : undefined} aria-label={label}>
          <span className="d" aria-hidden="true">{v && id !== CONSEIL_ID ? "✓" : n}</span>
          {big && <span className="pl" aria-hidden="true">{place}</span>}
        </button>
      </li>
    );
  };

  const done = stops.filter((s) => visited.has(s.id)).length;

  return (
    <aside className={"ticket" + (big ? " big" : "")}
           aria-label={`Votre billet : ${done} arrêt${done > 1 ? "s" : ""} sur ${stops.length} tamponné${done > 1 ? "s" : ""}`}>
      {big && <div className="csec-title">Votre billet</div>}
      <div className="tkstrip">
        <ol className="tkrow">
          {stops.map((s) => slot(s.id, String(s.order), `Arrêt ${s.order} : ${s.place}${visited.has(s.id) ? ", tamponné" : ", pas encore"}`, s.place, visited.has(s.id)))}
          {slot(CONSEIL_ID, "⚑", "Le conseil municipal, fin du trajet", "Le conseil", activeId === CONSEIL_ID)}
        </ol>
        {(nPicked !== null || status) && (
          <div className="tkb">
            {nPicked !== null && pickStop && (
              <span className="b sc" aria-label={`Votre programme au ${pickStop.place} : ${nPicked} idée${nPicked > 1 ? "s" : ""} choisie${nPicked > 1 ? "s" : ""}`}>
                <b>{nPicked}</b><span className="l">idée{nPicked > 1 ? "s" : ""}</span>
              </span>
            )}
            {status && (
              <span className="b emo" aria-label={`Ce qui vous a le plus surpris : ${status.label}`}>
                <span className={"dot " + status.tone} aria-hidden="true" /><span className="l">{status.short || status.label}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
