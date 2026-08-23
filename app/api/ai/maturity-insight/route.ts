import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWithGemini } from "@/lib/gemini";

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

  interface EvaluationRow {
    agent_id: string;
    scores: { name: string; score: number }[];
    weighted_result: number;
    strength: string | null;
    improvement_point: string | null;
    evaluation_date: string;
  }

  const { data: evaluations } = await supabase
    .from("maturity_evaluations")
    .select("agent_id, scores, weighted_result, strength, improvement_point, evaluation_date")
    .in(
      "agent_id",
      agents.map((a) => a.id)
    )
    .order("evaluation_date", { ascending: false });

  const evaluationRows = (evaluations ?? []) as unknown as EvaluationRow[];
  const latestByAgent = new Map<string, EvaluationRow>();
  evaluationRows.forEach((evalRow) => {
    if (!latestByAgent.has(evalRow.agent_id)) latestByAgent.set(evalRow.agent_id, evalRow);
  });

  const agentSummaries = agents
    .map((agent) => {
      const latest = latestByAgent.get(agent.id);
      const scoresText = latest?.scores?.map((s) => `${s.name}: ${s.score}/5`).join(", ");
      return `- ${agent.name} (${agent.operation ?? "sem operação"}), nível atual: ${agent.current_maturity ?? "sem avaliação"}${
        latest
          ? `. Última avaliação (${latest.evaluation_date}): ${scoresText}. Ponto forte: ${latest.strength ?? "n/d"}. A melhorar: ${latest.improvement_point ?? "n/d"}.`
          : ""
      }`;
    })
    .join("\n");

  const prompt = `És um consultor de gestão de equipas especialista no modelo de liderança situacional de Hersey-Blanchard (M1-M4).

Analisa os seguintes agentes de uma equipa e os dados da sua última avaliação de maturidade:

${agentSummaries}

Escreve uma análise curta e prática, em português de Portugal, com no máximo 5 frases no total, organizadas em 2-3 pontos com marcadores (•). Foca-te em:
1. Que agente(s) estão mais perto de subir de nível, e em que critério específico devem focar-se.
2. Algum padrão preocupante que valha a pena assinalar (ex: vários agentes estagnados no mesmo nível, ou um ponto fraco recorrente).
3. Uma sugestão concreta de ação para esta semana.

Não repitas os dados que já te dei (nomes, níveis) de forma genérica — sê específico e acionável. Não uses formatação markdown como títulos ou negrito, só os marcadores (•).`;

  try {
    const content = await generateWithGemini(prompt);

    await supabase
      .from("ai_insights")
      .upsert({ user_id: user.id, scope: "maturidade", content, generated_at: new Date().toISOString() }, { onConflict: "user_id,scope" });

    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível gerar a análise." },
      { status: 500 }
    );
  }
}
