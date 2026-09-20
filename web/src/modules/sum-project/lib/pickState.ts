// L'état du jeu de cartes (« Belvédère »), gardé par appareil : les idées choisies, le retournement,
// et « ce qui m'a le plus surpris ». Le préfixe « sum-sort: » est volontaire : « Nouvelle partie »
// (Journey.tsx) efface déjà toutes les clés qui commencent par là.
// Lu par PickGame (le jeu), Conseil et Ticket (les deux souvenirs rejoués à la fin du trajet).
export type PickSaved = { picked: string[]; revealed: boolean };

const KEY = (id: string) => `sum-sort:${id}`;
const RKEY = (id: string) => `sum-sort:reflect:${id}`;

// Paramètre d'essai (captures d'écran, démonstration) lu une seule fois par arrêt et par page :
//   ?pick=bus-appel,prix-heure            les cartes déjà choisies
//   ?pick=…&revealed=1                    les cartes déjà retournées
// Sans ces paramètres, rien ne change : inoffensif en production.
const seeded = new Set<string>();
const seed = (stopId: string) => {
  if (typeof window === "undefined" || seeded.has(stopId)) return;
  seeded.add(stopId);
  const qs = new URLSearchParams(location.search);
  const p = qs.get("pick");
  if (p === null) return;
  const picked = p.split(",").map((x) => x.trim()).filter(Boolean);
  savePick(stopId, { picked, revealed: qs.get("revealed") === "1" });
};

export const loadPick = (stopId: string): PickSaved => {
  seed(stopId);
  try {
    const raw = sessionStorage.getItem(KEY(stopId));
    if (raw) {
      const s = JSON.parse(raw);
      if (s && Array.isArray(s.picked)) return { picked: s.picked, revealed: !!s.revealed };
    }
  } catch {}
  return { picked: [], revealed: false };
};

export const savePick = (stopId: string, s: PickSaved) => {
  try { sessionStorage.setItem(KEY(stopId), JSON.stringify(s)); } catch {}
};

export const loadReflect = (stopId: string): string | null => {
  try { return sessionStorage.getItem(RKEY(stopId)); } catch { return null; }
};

export const saveReflect = (stopId: string, v: string | null) => {
  try { if (v) sessionStorage.setItem(RKEY(stopId), v); else sessionStorage.removeItem(RKEY(stopId)); } catch {}
};
