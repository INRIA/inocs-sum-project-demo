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

export type Stop = {
  id: string; order: number; place: string; title: string; question: string;
  mode: "passive" | "animated" | "selfservice"; animator: string | null; position?: string;
  capacity: number | null; durationMin: number | null; researchOnly?: boolean;
  tableTent: { headline: string; subline: string };
  instructions: Instruction[]; rule?: string; materials: string[];
  questions?: { id: string; text: string }[];
  game?: { mapNote?: string; note?: string; stationsToPlace?: number; tablet?: { url: string; note: string } };
  reveal: { title: string; lines: string[]; source?: Source } | null;
  featured?: string[];
  images?: Img[];
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
