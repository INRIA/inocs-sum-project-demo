import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

// Fenêtre modale commune : fil d'Ariane (arrêt › carte › élément), bouton Fermer, clic sur le fond.
// Échap est géré par les parents (Journey / CityCards) via le routage par hash.
// className : variante (ex. « embed » pour l'outil en iframe) ; closeLabel : le bouton Fermer écrit en toutes lettres (téléphone, cadre visible).
type Props = { crumbs: ReactNode[]; onClose: () => void; children: ReactNode; className?: string; closeLabel?: string };

export default function Modal({ crumbs, onClose, children, className, closeLabel }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => { document.body.style.overflow = prev; };
  }, []);

  if (typeof document === "undefined") return null;
  const last = crumbs.length - 1;
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div ref={ref} className={"modal" + (className ? " " + className : "")} role="dialog" aria-modal="true" aria-label={typeof crumbs[last] === "string" ? (crumbs[last] as string) : "Détail"}
           tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <nav className="crumbs" aria-label="Vous êtes ici">
            {crumbs.map((c, i) => (
              <span key={i} className={i === last ? "cur" : ""}>
                {i > 0 && <span className="sep" aria-hidden="true">›</span>}
                {c}
              </span>
            ))}
          </nav>
          <button type="button" className={"iconbtn close" + (closeLabel ? " text" : "")} aria-label="Fermer" onClick={onClose}>{closeLabel ? <>{closeLabel} ×</> : "×"}</button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
