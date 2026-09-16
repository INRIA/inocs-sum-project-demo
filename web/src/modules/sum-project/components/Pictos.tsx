// Pictogrammes au trait, dans le style des icônes de la carte (viewBox 24, trait 2, bouts ronds).
const P: Record<string, JSX.Element> = {
  prevoir: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /><path d="M2.5 12H1M23 12h-1.5" /></>,                       // une horloge : « dans une heure »
  gerer: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2.5" /><path d="M12 3v6.5M4.2 16.5l5.6-3.2M19.8 16.5l-5.6-3.2" /></>,  // un volant : la flotte se pilote
  connecter: <><path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h13A2.5 2.5 0 0 1 21 8.5v1a2 2 0 0 0 0 4v1a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 15.5v-1a2 2 0 0 0 0-4Z" /><path d="M12 6v2M12 11v2M12 16v2" strokeDasharray="1 3" /></>,  // un billet
  coconcevoir: <><circle cx="7" cy="7" r="2.5" /><circle cx="17" cy="7" r="2.5" /><path d="M2.5 15a4.5 4.5 0 0 1 9 0M12.5 15a4.5 4.5 0 0 1 9 0" /><path d="M4 20h16" /></>,  // deux personnes autour d'une table
  tarifer: <><path d="M3 12.5V5a2 2 0 0 1 2-2h7.5L21 11.5 12.5 20Z" /><circle cx="7.5" cy="7.5" r="1.3" /></>,  // une étiquette de prix
};

export default function Picto({ name, size = 34 }: { name: string; size?: number }) {
  const d = P[name];
  if (!d) return null;
  return (
    <svg className="picto" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d}
    </svg>
  );
}
