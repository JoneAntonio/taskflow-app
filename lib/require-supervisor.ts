import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Usado no topo de páginas exclusivas de Supervisor (Método SMART, Equipas,
 * Maturidade). Contas do tipo "agente" são reencaminhadas para o Dashboard —
 * mesmo que tentem aceder diretamente pelo endereço.
 */
export async function requireSupervisor(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("account_type").eq("id", user.id).single();
  if (profile?.account_type === "agente") redirect("/dashboard");
}
