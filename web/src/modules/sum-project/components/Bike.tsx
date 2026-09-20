import { forwardRef } from "react";

// Le vélo de la carte et de la route de l'histoire : un seul dessin, deux roues bleues, un cadre vert.
// Le parent le déplace en posant l'attribut transform sur le <g> (voir lib/road.ts, placeMarker).
const Bike = forwardRef<SVGGElement, { scale?: number }>(function Bike({ scale = 1.35 }, ref) {
  return (
    <g ref={ref} aria-hidden="true">
      <g transform={`scale(${scale})`}>
        <circle cx="-13" cy="18" r="11" fill="none" stroke="var(--sum-blue-deep)" strokeWidth="3.5" />
        <circle cx="17" cy="18" r="11" fill="none" stroke="var(--sum-blue-deep)" strokeWidth="3.5" />
        <path d="M-13 18 L-3 2 H11 L17 18 M-3 2 L4 18 L-13 18 M4 18 L11 2 M-8 -2 H-1 M14 -1 L11 2" fill="none" stroke="var(--sum-green)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M-1 2 L2 -8 L10 -10 M2 -8 L1 -1" fill="none" stroke="var(--sum-blue-deep)" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="4" cy="-14" r="4.5" fill="var(--sum-blue-deep)" />
      </g>
    </g>
  );
});
export default Bike;
