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
  position: number;
  archived: boolean;
  created_at: string;
}

export interface EvaluationScoreEntry {
  criterion_id: string;
  name: string;
  weight: number;
  score: number; // 1-5
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

export const DEFAULT_CRITERIA: Array<{ name: string; weight: number }> = [
  { name: "Qualidade", weight: 25 },
  { name: "Produtividade", weight: 20 },
  { name: "TMA", weight: 15 },
  { name: "Conhecimento de processos", weight: 15 },
  { name: "Autonomia", weight: 15 },
  { name: "Comunicação", weight: 10 },
];

export const MATURITY_DESCRIPTIONS: Record<MaturityLevel, { title: string; description: string }> = {
  M1: {
    title: "Baixa competência / baixa experiência",
    description: "Necessita de orientação próxima e instruções claras e específicas.",
  },
  M2: {
    title: "Alguma competência / em desenvolvimento",
    description: "Já conhece parte da operação, mas ainda precisa de acompanhamento e feedback.",
  },
  M3: {
    title: "Boa competência / autonomia",
    description: "Domina os processos e trabalha com pouca supervisão.",
  },
  M4: {
    title: "Elevada competência / elevada autonomia",
    description: "Trabalha de forma independente e pode apoiar e mentorizar outros agentes.",
  },
};

/**
 * Calcula a maturidade recomendada a partir do resultado ponderado (escala 1-5).
 */
export function maturityFromScore(weightedResult: number): MaturityLevel {
  if (weightedResult >= 4.5) return "M4";
  if (weightedResult >= 3.5) return "M3";
  if (weightedResult >= 2.5) return "M2";
  return "M1";
}
