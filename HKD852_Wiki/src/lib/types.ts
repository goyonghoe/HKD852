export interface Agent {
  slug: string;
  name: string;
  role: string;
  division: "ceo-direct" | "game" | "business" | "support";
  path: string;
  skillCount: number;
  description: string;
  skills: Skill[];
}

export interface Skill {
  name: string;
  agent: string;
  description: string;
  model: "opus" | "sonnet" | "haiku";
}

export interface Guide {
  slug: string;
  title: string;
  description: string;
}
