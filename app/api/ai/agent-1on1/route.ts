import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWithGemini } from "@/lib/gemini";
import { recordAiUsage } from "@/lib/ai-usage";

/**
 * Lê o histórico de notas + avaliações de um agente e ajuda a preparar a
 * próxima conversa 1-para-1: resume a relação recente e sugere pontos de
 * conversa concretos.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: { agentId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  if (!body.agentId) {
    return NextResponse.json({ error: "Falta o ID do agente." }, { status: 400 });
  }

  const { data: agent } = await supabase.from("team_agents").select("*").eq("id", body.agentId).single();
  if (!agent) {
    return NextResponse.json({ error: "Agente não encontrado." }, { status: 404 });
  }

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const [{ data: notes }, { data: evaluations }] = await Promise.all([
    supabase
      .from("agent_notes")
      .select("note, created_at")
      .eq("agent_id", body.agentId)
      .gte("created_at", threeMonthsAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("maturity_evaluations")
      .select("evaluation_date, confirmed_maturity, strength, improvement_point")
      .eq("agent_id", body.agentId)
      .order("evaluation_date", { ascending: false })
      .limit(3),
  ]);

  if ((!notes || notes.length === 0) && (!evaluations || evaluations.length === 0)) {
    return NextResponse.json(
      { error: "Ainda não há notas nem avaliações suficientes para esta pessoa." },
      { status: 400 }
    );
  }

  const notesText = (notes ?? [])
    .map((n) => `- ${new Date(n.created_at).toLocaleDateString("pt-PT")}: ${n.note}`)
    .join("\n");
  const evaluationsText = (evaluations ?? [])
    .map(
      (e) =>
        `- ${e.evaluation_date} (${e.confirmed_maturity}): forte em "${e.strength ?? "n/d"}", a melhorar "${e.improvement_point ?? "n/d"}"`
    )
    .join("\n");

  const prompt = `És um consultor de gestão de pessoas. Ajuda a preparar uma conversa 1-para-1 com ${agent.name}${agent.operation ? ` (${agent.operation})` : ""}.

Notas registadas nos últimos 3 meses (mais recente primeiro):
${notesText || "(sem notas registadas)"}

Últimas avaliações de maturidade:
${evaluationsText || "(sem avaliações registadas)"}

Escreve, em português de Portugal, em duas partes curtas:
1. "Resumo": 2-3 frases sobre como tem corrido a relação/desempenho recente, com base nos dados acima.
2. "Pontos de conversa": 3 sugestões concretas e específicas para abordar no próximo 1-para-1, cada uma numa linha com marcador (•).

Sê específico com base no que foi dito, não genérico. Não uses markdown como títulos com # ou negrito — só "Resumo:" e "Pontos de conversa:" como texto normal, seguidos do conteúdo.`;

  try {
    const content = await generateWithGemini(prompt);
    await recordAiUsage("maturidade");
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível gerar a preparação." },
      { status: 500 }
    );
  }
}
