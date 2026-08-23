import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AI_DAILY_ESTIMATE } from "@/lib/ai-usage";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase.from("ai_usage").select("scope, count").eq("used_date", today);

  const smart = data?.find((row) => row.scope === "smart")?.count ?? 0;
  const maturidade = data?.find((row) => row.scope === "maturidade")?.count ?? 0;

  return NextResponse.json({ smart, maturidade, limit: AI_DAILY_ESTIMATE });
}
