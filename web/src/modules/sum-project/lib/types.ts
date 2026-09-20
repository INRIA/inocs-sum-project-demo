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

// Petits graphiques dessinés depuis les données (barres, frise, grille d'émojis) : modifiables sans toucher au code.
export type Chart =
  | { type: "bars"; unit?: string; items: { label: string; value: number }[] }
  | { type: "timeline"; horizontal?: boolean; items: { when: string; text: string }[] }   // horizontal : une frise en ligne (grand écran), verticale sur téléphone
  | { type: "matrix"; columns: string[]; rows: string[][]; legend?: string; headCols?: number }  // headCols : colonnes de gauche fusionnées en en-tête de ligne
  | { type: "delta"; unit?: string; items: { label: string; before: number; after: number; beforeText?: string; afterText?: string }[] };  // avant / après : deux barres par ligne

// Carte d'information : recto = un chiffre et une accroche, verso = 3–5 lignes, puis « En savoir plus » (fiche en modale).
export type InfoCard = {
  id: string; accent?: boolean; wide?: boolean;
  front: { value?: string; label: string; teaser?: string; image?: Img; icons?: string[] };  // image : bandeau photo ; icons : pictogrammes (Pictos.tsx)
  back: { title?: string; lines?: string[]; image?: Img; chart?: Chart };
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

// Histoire d'un arrêt (« la route de SUM ») : une route à gauche, un chapitre à droite, lecture automatique possible.
export type StoryExample = { city: string; measure?: string; caption?: string };   // photo, drapeau, chiffre clé lus dans le bloc `cities`
export type StoryChapter = {
  id: string; kicker: string; kickerShort?: string;   // « Pourquoi ? » à côté du disque ; version courte sous la route (téléphone)
  stamp: string;                                      // ce qui s'écrit dans le disque : « 70 % », « 5 », « 🙂 »…
  title: string; figure?: string; figureLabel?: string; teaser?: string;
  lines?: string[]; charts?: Chart[]; icons?: { name: string; label: string }[];   // pictos (Pictos.tsx) avec leur mot
  image?: Img; examples?: StoryExample[]; cities?: boolean;                        // cities : la rangée des neuf villes
  links?: Link[]; resource?: string;                                                // fiche « En savoir plus » (modale)
};
export type Story = { autoplaySec?: number; chapters: StoryChapter[] };

// Mission d'un arrêt (« Station de vélos ») : le texte du maire, des questions dont la réponse se déplie, un outil externe ouvert en modale.
export type MissionQuestion = { id: string; icon: string; q: string; answer?: { title: string; lines: string[]; link?: Link } };  // icon : croquis CIVITAS (Sketch.tsx)
export type Mission = { eyebrow: string; text: string; lead?: string; questions: MissionQuestion[]; tool: { label: string; url: string; note?: string } };

// Bloc « héros » d'un arrêt (arrêt Destination) : une capture, un chiffre, ce qu'on y trouve, les liens externes,
// et à côté une tuile chiffre (le nombre de répondants). `resource` ouvre la fiche en modale.
export type HeroStat = { value: string; label: string; teaser?: string; resource?: string };
export type Hero = {
  kicker: string; figure: string; label: string; text?: string; lines?: string[];
  image?: Img; links?: Link[]; resource?: string; stat?: HeroStat;
};

// « Ce qu'on retient » (arrêt Destination) : quatre panneaux colorés, une liste de constats.
// Un constat qui porte une ville montre son drapeau : le clic ouvre l'histoire de la ville.
export type TakeawayItem = { city?: string; text: string };
export type TakeawayPanel = {
  id: string; tone: "green" | "red" | "blue" | "paper"; title: string;
  items: TakeawayItem[]; resource?: string; link?: Link;   // link : une route interne (#/…) ou un lien externe
};
export type Takeaways = { title: string; panels: TakeawayPanel[] };

export type Stop = {
  id: string; order: number; place: string; title: string; question: string;
  mode: "passive" | "animated" | "selfservice"; animator: string | null; position?: string;
  capacity: number | null; durationMin: number | null;
  badge?: string;          // étiquette à côté du titre (ex. « Recherche et innovation »)
  brief?: string;          // une ligne : « Ici, vous allez … », affichée sous le titre pour qui arrive par QR
  tableTent: { headline: string; subline: string };
  instructions: Instruction[]; rule?: string; materials: string[];
  questions?: { id: string; text: string }[];
  game?: { mapNote?: string; note?: string; stationsToPlace?: number; tablet?: { url: string; note: string }; sort?: SortGameDef };
  reveal: { title: string; lines: string[]; source?: Source } | null;
  featured?: string[];
  images?: Img[];
  challenge?: { eyebrow?: string; question: string; hint?: string; cta: Link };  // une seule question, un seul bouton
  cityStrip?: { title: string; lead?: string };  // bandeau des villes (photo, drapeau, nom) → #/destination/<ville>
  story?: Story;           // mode « histoire » : remplace les cartes (arrêt 1)
  mission?: Mission;       // mode « mission » : texte du maire, questions, outil en modale (arrêt 3)
  cards?: InfoCard[];      // mode « cartes » : recto / verso / fiche
  hero?: Hero;             // bandeau bleu en tête de l'arrêt (arrêt 5 : la plateforme de données)
  cities?: boolean;        // affiche les cartes Villes (bloc `cities`) après `cards`
  moreCards?: InfoCard[];  // cartes « pour aller plus loin », après les villes
  moreTitle?: string;      // titre de la section moreCards (défaut : « Pour aller plus loin »)
  takeaways?: Takeaways;   // « Ce qu'on retient » : quatre panneaux, après les villes (arrêt 5)
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
  modalSplit?: ModalSplit | null; measures: CityMeasure[]; results?: string[];
  keep?: string;  // la leçon qu'un maire rapporte chez lui, une phrase
  notDone?: string[];
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
  journey: {
    metaphor: string;
    intro: { title: string; durationMin: number; script: string[]; repeatable?: boolean; badge?: { text: string; note?: string } };
    conclusion: { title: string; atMinute: number; durationMin: number; steps: string[]; messages: string[] };
  };
  stops: Stop[];
  cities: CitiesBlock;
  glossary: { term: string; definition: string }[];
};
