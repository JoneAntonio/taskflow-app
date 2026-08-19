import type { Metadata } from "next";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AgentCard } from "@/components/team/agent-card";
import { AddAgentButton } from "@/components/team/add-agent-button";
import type { TeamAgent } from "@/types/team-maturity";

export const metadata: Metadata = { title: "Maturidade da Equipa — TaskFlow" };

export default async function EquipaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: agents }, { data: evaluations }] = await Promise.all([
    supabase.from("team_agents").select("*").eq("archived", false).order("name"),
    supabase
      .from("maturity_evaluations")
      .select("agent_id, evaluation_date")
      .order("evaluation_date", { ascending: false }),
  ]);

  const lastEvaluationByAgent = new Map<string, string>();
  (evaluations ?? []).forEach((row) => {
    if (!lastEvaluationByAgent.has(row.agent_id)) {
      lastEvaluationByAgent.set(row.agent_id, row.evaluation_date);
    }
  });

  const agentList = (agents ?? []) as TeamAgent[];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">
            Maturidade da Equipa
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Avalia cada agente segundo o modelo M1–M4 e acompanha a evolução ao longo do tempo.
          </p>
        </div>
        <AddAgentButton />
      </div>

      {agentList.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-16 text-center">
          <Users className="h-8 w-8 text-[var(--color-ink-muted)]" />
          <p className="text-sm font-medium text-[var(--color-ink)]">Ainda sem agentes</p>
          <p className="max-w-xs text-sm text-[var(--color-ink-muted)]">
            Adiciona o primeiro membro da tua equipa para começares a registar avaliações de maturidade.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {agentList.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              lastEvaluationDate={lastEvaluationByAgent.get(agent.id) ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
