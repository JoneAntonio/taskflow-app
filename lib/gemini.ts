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

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 1000 },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Gemini devolveu um erro (${response.status}): ${errorBody.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("O Gemini não devolveu texto na resposta.");
  return text.trim();
}
