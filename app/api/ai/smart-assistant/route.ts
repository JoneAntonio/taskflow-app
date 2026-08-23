import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateJSONWithGemini } from "@/lib/gemini";
import { recordAiUsage } from "@/lib/ai-usage";

interface SmartSuggestion {
  objective: string;
  successMetric: string;
  unit: string;
  actionPlan: string;
  explanation: string;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: { ideaText?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const ideaText = body.ideaText?.trim();
  if (!ideaText) {
    return NextResponse.json({ error: "Escreve primeiro uma ideia, mesmo que solta." }, { status: 400 });
  }

  const prompt = `És um assistente que ajuda pessoas SEM experiência em gestão de projetos a transformar uma ideia solta num objetivo SMART (Específico, Mensurável, Atingível, Relevante, com Prazo).

A pessoa escreveu isto sobre o que quer alcançar: "${ideaText}"

Responde APENAS em JSON válido, sem texto antes ou depois, exatamente neste formato:
{
  "objective": "uma frase clara do objetivo (o quê e porquê), em português de Portugal",
  "successMetric": "uma métrica concreta e mensurável para saber se foi alcançado",
  "unit": "a unidade da métrica, escolhe UMA entre: %, min, horas, dias, €, Kz, $, unidades, pontos — ou deixa vazio se não for numérica",
  "actionPlan": "2-3 passos concretos e curtos para lá chegar, separados por ponto e vírgula",
  "explanation": "1-2 frases simples a explicar porque isto agora é SMART, escritas para alguém que nunca usou este método antes"
}

Não inventes números de meta ou ponto de partida — a pessoa preenche isso à parte. Sê concreto, nunca genérico.`;

  try {
    const suggestion = await generateJSONWithGemini<SmartSuggestion>(prompt);
    await recordAiUsage("smart");
    return NextResponse.json(suggestion);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível gerar a sugestão." },
      { status: 500 }
    );
  }
}
