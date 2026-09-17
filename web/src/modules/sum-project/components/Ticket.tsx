import { useEffect, useRef, useState } from "react";
import type { Stop } from "../lib/types";
import { CONSEIL_ID } from "./StopList";

// Le billet : le même objet du début à la fin du trajet. Six cases — cinq arrêts et le conseil
// municipal — qui se tamponnent au passage, plus deux souvenirs du Belvédère (le score et ce qui
// a le plus surpris). Discret dans l'en-tête d'un arrêt, en grand sur l'écran de clôture.
const SORT_KEY = (id: string) => `sum-sort:${id}`;
const REFLECT_KEY = (id: string) => `sum-sort:reflect:${id}`;

type Props = {
  stops: Stop[];
  visited: Set<string>;
  activeId: string | null;      // « conseil » sur l'écran de clôture
  onSelect: (id: string) => void;
  big?: boolean;                // variante de clôture : cases de 56 px, le lieu sous chaque case
};

export default function Ticket({ stops, visited, activeId, onSelect, big = false }: Props) {
  const sortStop = stops.find((s) => s.game?.sort) || null;
  const cards = sortStop?.game?.sort?.cards || [];
  const bins = sortStop?.game?.sort?.bins || [];

  // Souvenirs gardés par appareil : relus après le montage (jamais au rendu serveur).
  const [score, setScore] = useState<number | null>(null);
  const [reflect, setReflect] = useState<string | null>(null);
  useEffect(() => {
    if (!sortStop) return;
    try {
      const raw = sessionStorage.getItem(SORT_KEY(sortStop.id));
      const saved = raw ? JSON.parse(raw) : null;
      const placed: Record<string, string> = (saved && saved.placed) || {};
      setScore(saved && saved.revealed ? cards.filter((k) => placed[k.id] === k.verdict).length : null);
    } catch { setScore(null); }
    try { setReflect(sessionStorage.getItem(REFLECT_KEY(sortStop.id))); } catch { setReflect(null); }
  }, [sortStop, cards, activeId, visited]);
  const bin = bins.find((b) => b.id === reflect) || null;

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
        {(score !== null || bin) && (
          <div className="tkb">
            {score !== null && sortStop && (
              <span className="b sc" aria-label={`Score au ${sortStop.place} : ${score} sur ${cards.length} bien vues`}>
                <b>{score}/{cards.length}</b><span className="l">bien vues</span>
              </span>
            )}
            {bin && (
              <span className="b emo" aria-label={`Ce qui vous a le plus surpris : ${bin.label}`}>
                <span aria-hidden="true">{bin.emoji}</span><span className="l">{bin.short || bin.label}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
