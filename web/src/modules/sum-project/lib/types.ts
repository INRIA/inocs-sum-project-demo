export type Source = { report?: string; task?: string; partner?: string; livingLab?: string };
export type Fact = { label: string; value: string };
export type Img = { src: string; caption: string; suggestedSource?: string; alt?: string; credit?: string };
export type Link = { label: string; url: string };
export type Item = { title: string; text: string; partner?: string; source?: string };

export type Resource = {
  id: string; title: string; teaser: string; kind: string;
  body?: string[]; facts?: Fact[]; items?: Item[]; images?: Img[]; links?: Link[];
  table?: { columns: string[]; rows: string[][] }; legend?: string; source?: Source;
};

export type Instruction = { step: number; title?: string; text: string };

// Carte d'information : recto = un chiffre et une accroche, verso = 3–5 lignes, puis « En savoir plus » (fiche en modale).
export type InfoCard = {
  id: string; accent?: boolean; wide?: boolean;
  front: { value?: string; label: string; teaser?: string; image?: Img };  // image : bandeau photo en haut du recto
  back: { title?: string; lines?: string[]; image?: Img };
  link?: Link;        // action externe (ex. ouvrir la plateforme)
  resource?: string;  // id d'une ressource de l'arrêt, ouverte en modale
};

// Jeu de tri (« Belvédère ») : des cartes « innovation » à poser sur trois tapis, puis on retourne tout.
export type SortBin = { id: string; emoji: string; label: string; short: string; tone: "green" | "amber" | "red"; hint?: string };
export type SortCard = {
  id: string; n: number; title: string; pitch: string; question?: string; image?: Img | null;
  verdict: string;                          // id du tapis où la carte va vraiment
  stamp?: string;                           // texte du tampon au verso (défaut : label du tapis)
  why: string[]; partner?: string; livingLab?: string;
  see?: { stop: string; res?: string } | null;  // « Pour le voir : arrêt X » → route interne #/<stop>/<res>
  source?: string;
};
export type SortGameDef = {
  message?: string; howto?: string; bins: SortBin[]; cards: SortCard[];
  debrief?: string;   // ce que l'animateur fait remarquer après le retournement
  bulletin?: string;  // texte du bulletin pour le conseil municipal (affiché, pas saisi)
};

export type Stop = {
  id: string; order: number; place: string; title: string; question: string;
  mode: "passive" | "animated" | "selfservice"; animator: string | null; position?: string;
  capacity: number | null; durationMin: number | null;
  badge?: string;          // étiquette à côté du titre (ex. « Recherche et innovation »)
  tableTent: { headline: string; subline: string };
  instructions: Instruction[]; rule?: string; materials: string[];
  questions?: { id: string; text: string }[];
  game?: { mapNote?: string; note?: string; stationsToPlace?: number; tablet?: { url: string; note: string }; sort?: SortGameDef };
  reveal: { title: string; lines: string[]; source?: Source } | null;
  featured?: string[];
  images?: Img[];
  challenge?: { eyebrow?: string; question: string; hint?: string; cta: Link };  // une seule question, un seul bouton
  cityStrip?: { title: string; lead?: string };  // bandeau des villes (photo, drapeau, nom) → #/destination/<ville>
  cards?: InfoCard[];      // mode « cartes » : recto / verso / fiche
  cities?: boolean;        // affiche les cartes Villes (bloc `cities`) après `cards`
  moreCards?: InfoCard[];  // cartes « pour aller plus loin », après les villes
  moreTitle?: string;      // titre de la section moreCards (défaut : « Pour aller plus loin »)
  resources: Resource[];
};

export type MeasureType = "push" | "pull";
export type Split = { before: number; after: number };
export type ModalSplit = {
  years: number[];
  nsm?: Split | null; pt?: Split | null; car?: Split | null; note?: string;
};
export type CityMeasure = {
  id: string; type: MeasureType; title: string; summary: string;
  details?: string[]; keyFigure?: { value: string; label: string } | null; images?: Img[]; source?: string;
};
export type CityItem = {
  id: string; name: string; country: string; flag: string; role: string;
  tagline: string; context?: string; odpUrl?: string;
  hero?: Img;  // la photo qui représente la ville (bandeau de l'arrêt 1)
  modalSplit?: ModalSplit | null; measures: CityMeasure[]; results?: string[]; notDone?: string[];
};
export type CitiesBlock = {
  title: string; intro: string;
  measureTypes: Record<MeasureType, { label: string; description: string; color: string }>;
  source: { odp: string; presentations: string };
  items: CityItem[];
};

export type Content = {
  meta: { title: string; subtitle: string; event: { name: string; date: string; time: string; venue: string; audience: string };
    project: { name: string; programme: string; grant: string; period: string; website: string; odp: string; demo: string };
    brand: Record<string, string>; sourceReport: string; logo?: { src: string; alt: string } };
  journey: { metaphor: string; intro: { title: string; durationMin: number; script: string[] }; conclusion: { title: string; atMinute: number; durationMin: number; steps: string[]; messages: string[] } };
  stops: Stop[];
  cities: CitiesBlock;
  glossary: { term: string; definition: string }[];
};
