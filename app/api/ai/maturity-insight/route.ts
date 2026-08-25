import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWithGemini } from "@/lib/gemini";
import { recordAiUsage } from "@/lib/ai-usage";

interface EvaluationRow {
  agent_id: string;
  scores: { name: string; score: number }[];
  weighted_result: number;
  strength: string | null;
  improvement_point: string | null;
  evaluation_date: string;
  confirmed_maturity: string;
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: agents } = await supabase
    .from("team_agents")
    .select("id, name, operation, current_maturity")
    .eq("archived", false);

  if (!agents || agents.length === 0) {
    return NextResponse.json({ error: "Ainda sem agentes para analisar." }, { status: 400 });
  }

  // Histórico completo (até 5 avaliações por agente), não só a última —
  // permite à IA detetar tendências reais ao longo do tempo, não só uma foto.
  const { data: evaluations } = await supabase
    .from("maturity_evaluations")
    .select("agent_id, scores, weighted_result, strength, improvement_point, evaluation_date, confirmed_maturity")
    .in(
      "agent_id",
      agents.map((a) => a.id)
    )
    .order("evaluation_date", { ascending: false });

  const evaluationRows = (evaluations ?? []) as unknown as EvaluationRow[];
  const historyByAgent = new Map<string, EvaluationRow[]>();
  evaluationRows.forEach((evalRow) => {
    const list = historyByAgent.get(evalRow.agent_id) ?? [];
    if (list.length < 5) list.push(evalRow);
    historyByAgent.set(evalRow.agent_id, list);
  });

  interface AgentRow {
    id: string;
    name: string;
    operation: string | null;
    current_maturity: string | null;
  }

  const agentSummary = (agent: AgentRow) => {
    const history = historyByAgent.get(agent.id) ?? [];
    if (history.length === 0) {
      return `- ${agent.name}: sem avaliações ainda.`;
    }
    const progression = [...history].reverse().map((h) => h.confirmed_maturity).join(" → ");
    const latest = history[0];
    const scoresText = latest.scores?.map((s) => `${s.name}: ${s.score}/5`).join(", ");
    const historyLines = history
      .map((h) => `    · ${h.evaluation_date} (${h.confirmed_maturity}): ${h.scores?.map((s) => `${s.name}=${s.score}`).join(", ")}`)
      .join("\n");
    return `- ${agent.name}, nível atual: ${agent.current_maturity ?? "n/d"}. Progressão: ${progression}.
  Última avaliação (${latest.evaluation_date}): ${scoresText}. Ponto forte: ${latest.strength ?? "n/d"}. A melhorar: ${latest.improvement_point ?? "n/d"}.
  Histórico (mais recente primeiro):
${historyLines}`;
  };

  // Agrupa por operação — cada equipa/operação é um grupo à parte, para a IA
  // nunca comparar ou misturar agentes de operações diferentes como se
  // fossem a mesma equipa.
  const groups = new Map<string, AgentRow[]>();
  (agents as AgentRow[]).forEach((agent) => {
    const key = agent.operation?.trim() || "Sem operação atribuída";
    const list = groups.get(key) ?? [];
    list.push(agent);
    groups.set(key, list);
  });

  const groupedText = [...groups.entries()]
    .map(([operation, groupAgents]) => `### Operação: ${operation}\n${groupAgents.map(agentSummary).join("\n\n")}`)
    .join("\n\n");

  const prompt = `És um consultor de gestão de equipas especialista no modelo de liderança situacional de Hersey-Blanchard (M1-M4).

Analisa os agentes abaixo, JÁ ORGANIZADOS POR OPERAÇÃO (cada "### Operação: X" é uma equipa distinta e independente). Inclui o histórico completo de avaliações de cada um (não só a mais recente).

${groupedText}

Escreve uma análise curta e prática, em português de Portugal, organizada por operação (usa o nome de cada operação como um pequeno cabeçalho antes dos pontos dessa operação). Para cada operação, no máximo 3 frases com marcadores (•), focando-te em:
1. Que agente(s) dessa operação estão mais perto de subir de nível, e em que critério específico.
2. Tendências reais ao longo do tempo, ou um padrão preocupante nessa operação.
3. Uma sugestão concreta de ação para essa operação esta semana.

IMPORTANTE: nunca compares ou misturas agentes de operações diferentes como se fossem a mesma equipa — cada operação é independente. Não repitas os dados de forma genérica — sê específico. Não uses markdown como títulos com # ou negrito, só o nome da operação seguido de dois pontos, e marcadores (•) para os pontos.`;

  try {
    const content = await generateWithGemini(prompt);
    await recordAiUsage("maturidade");

    await supabase.from("ai_insights").upsert(
      { user_id: user.id, scope: "maturidade", content, generated_at: new Date().toISOString() },
      { onConflict: "user_id,scope" }
    );

    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível gerar a análise." },
      { status: 500 }
    );
  }
}
