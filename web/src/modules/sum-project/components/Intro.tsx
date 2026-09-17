import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Content } from "../lib/types";
import Modal from "./Modal";
import Glossary from "./Glossary";
import StopList from "./StopList";

// Écran d'entrée : « Vous êtes maire ». Affiché dans le tiroir quand aucun arrêt n'est ouvert
// (le hub *est* l'intro), la carte reste visible à droite. Tout le texte vient de content.journey.intro.
const nb = (s: string) => s.replace(/ ([?!:;])/g, " $1");

type Props = {
  content: Content; onStart: () => void; onChoose: () => void; actions?: ReactNode;
  visited: Set<string>;                 // pour l'escalier d'arrêts (téléphone)
  onSelect: (id: string) => void;
};

export default function Intro({ content, onStart, onChoose, actions, visited, onSelect }: Props) {
  const intro = content.journey.intro;
  const script = intro.script || [];
  const first = content.stops[0];
  const event = (content.meta.event?.name || "").split("—")[0].trim();
  const [showGlossary, setShowGlossary] = useState(false);

  // Modale locale (pas de route) : le routeur de Journey ne la voit pas, donc Échap est géré ici.
  useEffect(() => {
    if (!showGlossary) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowGlossary(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showGlossary]);

  return (
    <>
      <header className="sheet-head">
        <div className="eyebrow">Bienvenue{event ? " · " + event : ""}</div>
        {actions && <div className="actions">{actions}</div>}
        <h2>{nb(intro.title)}{intro.badge?.text && <span className="sticker">{intro.badge.text}</span>}</h2>
      </header>
      <div className="sheet-body">
        <div className="intro">
          {script[0] && <p className="q">{nb(script[0])}</p>}
          {script[1] && <p className="stake">{nb(script[1])}</p>}
          {script[2] && <p>{nb(script[2])}</p>}
          {script[3] && <p>{nb(script[3])}</p>}
          <div className="introcta">
            {first && (
              <button className="iconbtn primary big" type="button" onClick={onStart}>
                Commencer{" "}: arrêt {first.order} · {first.place} →
              </button>
            )}
            <button className="iconbtn big" type="button" onClick={onChoose}>
              Je suis à une table{" "}: choisir mon arrêt
            </button>
          </div>
          {/* Téléphone : la carte est masquée, le trajet se lit ici, une marche par arrêt. */}
          <section className="hubsteps" aria-label="Choisir son arrêt">
            <div className="csec-title">Le trajet{"\u00A0"}: {content.stops.length} arrêts</div>
            <StopList stops={content.stops} visited={visited} activeId={null} onSelect={onSelect} />
          </section>
          <button className="iconbtn ghost glossarybtn" type="button" onClick={() => setShowGlossary(true)}>
            Lexique
          </button>
        </div>
      </div>
      {showGlossary && (
        <Modal crumbs={["Bienvenue", "Lexique"]} onClose={() => setShowGlossary(false)}>
          <Glossary items={content.glossary} />
        </Modal>
      )}
    </>
  );
}
