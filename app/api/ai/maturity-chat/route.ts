import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWithGemini } from "@/lib/gemini";
import { recordAiUsage } from "@/lib/ai-usage";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: { question?: string; history?: { role: "user" | "model"; text: string }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const question = body.question?.trim();
  if (!question) {
    return NextResponse.json({ error: "Escreve uma pergunta." }, { status: 400 });
  }

  const { data: insight } = await supabase
    .from("ai_insights")
    .select("content")
    .eq("user_id", user.id)
    .eq("scope", "maturidade")
    .maybeSingle();

  const history = (body.history ?? []).slice(-6); // mantém o pedido pequeno, só as últimas trocas
  const historyText = history.map((h) => `${h.role === "user" ? "Pergunta" : "Resposta"}: ${h.text}`).join("\n");

  const prompt = `És um consultor de gestão de equipas especialista no modelo de liderança situacional de Hersey-Blanchard (M1-M4).

Já geraste esta análise sobre a equipa do utilizador:
"${insight?.content ?? "(sem análise prévia)"}"

${historyText ? `Conversa até agora:\n${historyText}\n` : ""}
O utilizador pergunta agora: "${question}"

Responde de forma curta e direta (máximo 4 frases), em português de Portugal, com base na análise e no contexto da conversa. Não repitas a pergunta. Não uses markdown.`;

  try {
    const answer = await generateWithGemini(prompt);
    await recordAiUsage("maturidade");
    return NextResponse.json({ answer });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível responder." },
      { status: 500 }
    );
  }
}
