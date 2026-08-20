import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_CRITERIA,
  maturityFromScore,
  type EvaluationScoreEntry,
  type MaturityCriterion,
  type MaturityEvaluation,
  type MaturityLevel,
  type TeamAgent,
} from "@/types/team-maturity";

export const teamMaturityService = {
  async listAgents(): Promise<TeamAgent[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("team_agents")
      .select("*")
      .eq("archived", false)
      .order("name");
    if (error) throw error;
    return (data ?? []) as TeamAgent[];
  },

  async getAgent(agentId: string): Promise<TeamAgent | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from("team_agents").select("*").eq("id", agentId).single();
    if (error) return null;
    return data as TeamAgent;
  },

  async createAgent(input: { name: string; operation?: string }): Promise<TeamAgent> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilizador não autenticado");

    const { data, error } = await supabase
      .from("team_agents")
      .insert({ user_id: user.id, name: input.name, operation: input.operation ?? null })
      .select()
      .single();
    if (error) throw error;
    return data as TeamAgent;
  },

  /**
   * Garante que o utilizador tem critérios de avaliação configurados.
   * Na primeira utilização, semeia os 6 critérios por omissão.
   */
  async ensureCriteria(): Promise<MaturityCriterion[]> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilizador não autenticado");

    const { data: existing, error } = await supabase
      .from("maturity_criteria")
      .select("*")
      .eq("archived", false)
      .order("position");
    if (error) throw error;

    if (existing && existing.length > 0) return existing as MaturityCriterion[];

    const rows = DEFAULT_CRITERIA.map((criterion, index) => ({
      user_id: user.id,
      name: criterion.name,
      weight: criterion.weight,
      inverted: criterion.inverted,
      position: index,
    }));
    const { data: created, error: insertError } = await supabase
      .from("maturity_criteria")
      .insert(rows)
      .select();
    if (insertError) throw insertError;
    return (created ?? []) as MaturityCriterion[];
  },

  async listEvaluations(agentId: string): Promise<MaturityEvaluation[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("maturity_evaluations")
      .select("*")
      .eq("agent_id", agentId)
      .order("evaluation_date", { ascending: true });
    if (error) throw error;
    return (data ?? []) as MaturityEvaluation[];
  },

  async createEvaluation(input: {
    agentId: string;
    scores: EvaluationScoreEntry[];
    confirmedMaturity: MaturityLevel;
    strength?: string;
    improvementPoint?: string;
    recommendedAction?: string;
    goal?: string;
    deadline?: string;
    responsible?: string;
  }): Promise<MaturityEvaluation> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilizador não autenticado");

    const totalWeight = input.scores.reduce((sum, entry) => sum + entry.weight, 0) || 100;
    // Critérios invertidos (ex: TMA) contam ao contrário: uma pontuação alta
    // nesse critério significa mau desempenho, por isso usamos (6 - score).
    const weightedResult =
      input.scores.reduce((sum, entry) => {
        const effectiveScore = entry.inverted ? 6 - entry.score : entry.score;
        return sum + effectiveScore * entry.weight;
      }, 0) / totalWeight;
    const recommendedMaturity = maturityFromScore(weightedResult);

    const { data, error } = await supabase
      .from("maturity_evaluations")
      .insert({
        user_id: user.id,
        agent_id: input.agentId,
        scores: input.scores,
        weighted_result: Number(weightedResult.toFixed(2)),
        recommended_maturity: recommendedMaturity,
        confirmed_maturity: input.confirmedMaturity,
        strength: input.strength ?? null,
        improvement_point: input.improvementPoint ?? null,
        recommended_action: input.recommendedAction ?? null,
        goal: input.goal ?? null,
        deadline: input.deadline ?? null,
        responsible: input.responsible ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data as MaturityEvaluation;
  },
  async updateAgent(agentId: string, input: { name: string; operation?: string | null }): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("team_agents")
      .update({ name: input.name, operation: input.operation ?? null })
      .eq("id", agentId);
    if (error) throw error;
  },

  async archiveAgent(agentId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("team_agents").update({ archived: true }).eq("id", agentId);
    if (error) throw error;
  },
};
