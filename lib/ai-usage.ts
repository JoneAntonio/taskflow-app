import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export const AI_DAILY_ESTIMATE = 1500; // estimativa do limite gratuito do Gemini Flash — não garantido pela Google

export async function recordAiUsage(scope: "smart" | "maturidade"): Promise<void> {
  try {
    const supabase = createAdminClient();
    const today = new Date().toISOString().slice(0, 10);

    const { data: existing } = await supabase
      .from("ai_usage")
      .select("id, count")
      .eq("scope", scope)
      .eq("used_date", today)
      .maybeSingle();

    if (existing) {
      await supabase.from("ai_usage").update({ count: existing.count + 1 }).eq("id", existing.id);
    } else {
      await supabase.from("ai_usage").insert({ scope, used_date: today, count: 1 });
    }
  } catch {
    // Nunca deve impedir a resposta da IA de chegar por causa disto.
  }
}
