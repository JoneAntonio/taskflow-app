import "server-only";

/**
 * Chama o Gemini (Google AI Studio) para gerar texto. Servidor apenas —
 * nunca deve ser importado em código de cliente (browser).
 *
 * Requer a variável de ambiente GEMINI_API_KEY na Vercel (gratuita, sem
 * cartão — gerada em aistudio.google.com).
 */
export async function generateWithGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("A análise por IA não está configurada (falta GEMINI_API_KEY).");
  }

  const maxAttempts = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 2000 },
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("O Gemini não devolveu texto na resposta.");
      return trimToCompleteSentence(text.trim());
    }

    // 429 (limite atingido) e 503 (sobrecarregado) são temporários — vale a
    // pena tentar de novo com uma pequena pausa antes de desistir.
    const isTransient = response.status === 429 || response.status === 503;
    const errorBody = await response.text().catch(() => "");
    lastError = new Error(`Gemini devolveu um erro (${response.status}): ${errorBody.slice(0, 200)}`);

    if (!isTransient || attempt === maxAttempts) break;
    await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
  }

  throw new Error(
    lastError?.message.includes("503") || lastError?.message.includes("429")
      ? "O Gemini está com muita procura neste momento. Espera um minuto e tenta gerar a análise outra vez."
      : (lastError?.message ?? "Não foi possível gerar a análise.")
  );
}

/**
 * Se o texto ficar cortado a meio de uma frase (limite de tokens atingido
 * antes do modelo terminar), corta no fim da última frase completa em vez
 * de mostrar algo pela metade, como "...para consolidar a".
 */
function trimToCompleteSentence(text: string): string {
  const lastPunctuation = Math.max(text.lastIndexOf("."), text.lastIndexOf("!"), text.lastIndexOf("?"));
  // Sem pontuação nenhuma (raro) — devolve tudo, não há onde cortar.
  if (lastPunctuation === -1) return text;
  return text.slice(0, lastPunctuation + 1).trim();
}
