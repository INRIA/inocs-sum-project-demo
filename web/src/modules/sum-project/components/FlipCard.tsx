import type { ReactNode } from "react";

// Carte à deux faces : le recto est un bouton (toute la carte se touche), le verso porte un bouton ↩ et son contenu.
// Toutes les cartes d'une grille ont la même hauteur au repos ; seule une carte retournée grandit avec son verso.
type Props = {
  flipped: boolean; onFlip: (next: boolean) => void;
  front: ReactNode; back: ReactNode; backTitle: ReactNode;
  label: string; className?: string; id?: string;
};

export default function FlipCard({ flipped, onFlip, front, back, backTitle, label, className, id }: Props) {
  return (
    <div id={id} className={"fcard" + (flipped ? " flip" : "") + (className ? " " + className : "")}>
      <div className="inner">
        <button type="button" className="face front" inert={flipped} aria-label={`${label} — retourner la carte`} onClick={() => onFlip(true)}>
          {front}
          <div className="hint">Toucher pour retourner ↻</div>
        </button>
        <div className="face back" inert={!flipped}>
          <div className="bhead">
            <h4>{backTitle}</h4>
            <button type="button" className="iconbtn flipback" onClick={() => onFlip(false)} aria-label={`Retourner la carte ${label}`}>↩</button>
          </div>
          {back}
        </div>
      </div>
    </div>
  );
}
