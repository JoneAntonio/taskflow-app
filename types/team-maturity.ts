export type MaturityLevel = "M1" | "M2" | "M3" | "M4";

export const MATURITY_LEVELS: MaturityLevel[] = ["M1", "M2", "M3", "M4"];

export interface TeamAgent {
  id: string;
  user_id: string;
  name: string;
  operation: string | null;
  avatar_url: string | null;
  current_maturity: MaturityLevel | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaturityCriterion {
  id: string;
  user_id: string;
  name: string;
  weight: number; // 0-100
  /** Quando true, uma pontuação mais alta significa pior desempenho (ex: TMA). */
  inverted: boolean;
  position: number;
  archived: boolean;
  created_at: string;
}

export interface EvaluationScoreEntry {
  criterion_id: string;
  name: string;
  weight: number;
  inverted: boolean;
  score: number; // 1-5, valor bruto atribuído pelo supervisor
}

export interface MaturityEvaluation {
  id: string;
  user_id: string;
  agent_id: string;
  evaluation_date: string; // YYYY-MM-DD
  scores: EvaluationScoreEntry[];
  weighted_result: number;
  recommended_maturity: MaturityLevel;
  confirmed_maturity: MaturityLevel;
  strength: string | null;
  improvement_point: string | null;
  recommended_action: string | null;
  goal: string | null;
  deadline: string | null;
  responsible: string | null;
  created_at: string;
}

export const DEFAULT_CRITERIA: Array<{ name: string; weight: number; inverted: boolean }> = [
  { name: "Qualidade", weight: 25, inverted: false },
  { name: "Produtividade", weight: 20, inverted: false },
  { name: "TMA", weight: 15, inverted: true },
  { name: "Conhecimento de processos", weight: 15, inverted: false },
  { name: "Autonomia", weight: 15, inverted: false },
  { name: "Comunicação", weight: 10, inverted: false },
];

export const MATURITY_DESCRIPTIONS: Record<MaturityLevel, { title: string; description: string; leadershipStyle: string }> = {
  M1: {
    title: "Baixa maturidade",
    description: "Pouca competência e pouca experiência; necessita de orientação próxima.",
    leadershipStyle: "Liderança Autocrática",
  },
  M2: {
    title: "Maturidade baixa a moderada",
    description: "Começa a desenvolver competências, mas ainda precisa de acompanhamento e motivação.",
    leadershipStyle: "Liderança Persuasiva",
  },
  M3: {
    title: "Maturidade moderada a alta",
    description: "Possui competência, mas pode apresentar alguma insegurança ou necessitar de apoio pontual.",
    leadershipStyle: "Liderança Democrática",
  },
  M4: {
    title: "Alta maturidade",
    description: "Elevada competência, autonomia e confiança; consegue executar as tarefas praticamente sem supervisão.",
    leadershipStyle: "Liderança Liberal",
  },
};

export interface TeamOperation {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export const OPERATION_COLORS = [
  "#3F6FA8",
  "#F2A93B",
  "#E2504C",
  "#3F9E6D",
  "#8B5CF6",
  "#EC4899",
  "#0EA5A5",
  "#6B7280",
];

/**
 * Calcula a maturidade recomendada a partir do resultado ponderado (escala 1-5).
 */
export function maturityFromScore(weightedResult: number): MaturityLevel {
  if (weightedResult >= 4.5) return "M4";
  if (weightedResult >= 3.5) return "M3";
  if (weightedResult >= 2.5) return "M2";
  return "M1";
}
