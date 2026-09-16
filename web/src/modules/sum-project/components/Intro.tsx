import type { Content } from "../lib/types";

// Écran d'entrée : « Vous êtes maire ». Affiché dans le tiroir quand aucun arrêt n'est ouvert
// (le hub *est* l'intro), la carte reste visible à droite. Tout le texte vient de content.journey.intro.
const nb = (s: string) => s.replace(/ ([?!:;])/g, " $1");

type Props = { content: Content; onStart: () => void; onChoose: () => void };

export default function Intro({ content, onStart, onChoose }: Props) {
  const intro = content.journey.intro;
  const script = intro.script || [];
  const first = content.stops[0];
  const event = (content.meta.event?.name || "").split("—")[0].trim();

  return (
    <>
      <header className="sheet-head">
        <div>
          <div className="eyebrow">Bienvenue{event ? " · " + event : ""}</div>
          <h2>{nb(intro.title)}</h2>
          {script[0] && <div className="q">{nb(script[0])}</div>}
        </div>
        {intro.badge?.text && <div className="sticker">{intro.badge.text}</div>}
      </header>
      <div className="sheet-body">
        <div className="intro">
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
        </div>
      </div>
    </>
  );
}
