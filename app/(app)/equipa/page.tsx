import type { Metadata } from "next";
import Link from "next/link";
import { Users, SlidersHorizontal, LayoutGrid } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AgentCard } from "@/components/team/agent-card";
import { AddAgentButton } from "@/components/team/add-agent-button";
import { MaturityRecommendations } from "@/components/team/maturity-recommendations";
import { getOperationColor } from "@/lib/operation-colors";
import type { TeamAgent, TeamOperation } from "@/types/team-maturity";

export const metadata: Metadata = { title: "Maturidade da Equipa — JAFLOW" };

export default async function EquipaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: agents }, { data: evaluations }, { data: operations }] = await Promise.all([
    supabase.from("team_agents").select("*").eq("archived", false).order("name"),
    supabase
      .from("maturity_evaluations")
      .select("agent_id, evaluation_date")
      .order("evaluation_date", { ascending: false }),
    supabase.from("team_operations").select("*").order("name"),
  ]);

  const lastEvaluationByAgent = new Map<string, string>();
  (evaluations ?? []).forEach((row) => {
    if (!lastEvaluationByAgent.has(row.agent_id)) {
      lastEvaluationByAgent.set(row.agent_id, row.evaluation_date);
    }
  });

  const agentList = (agents ?? []) as TeamAgent[];
  const operationList = (operations ?? []) as TeamOperation[];

  // Agrupa por operação/equipa, para deixar claro quando estás a gerir agentes
  // de equipas diferentes da tua, mas que continuam sob a tua responsabilidade.
  const groups = new Map<string, TeamAgent[]>();
  agentList.forEach((agent) => {
    const key = agent.operation?.trim() || "Sem operação atribuída";
    const list = groups.get(key) ?? [];
    list.push(agent);
    groups.set(key, list);
  });
  const sortedGroupNames = [...groups.keys()].sort((a, b) => a.localeCompare(b, "pt"));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">
            Maturidade da Equipa
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Avalia cada agente segundo o modelo M1–M4 e acompanha a evolução ao longo do tempo. A cor à esquerda de
            cada cartão identifica logo a operação a que o agente pertence.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href="/equipa/operacoes"
            className="flex h-10 items-center gap-1.5 rounded-xl border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-alt)]"
          >
            <LayoutGrid className="h-4 w-4" />
            Operações
          </Link>
          <Link
            href="/equipa/criterios"
            className="flex h-10 items-center gap-1.5 rounded-xl border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-alt)]"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Critérios
          </Link>
          <AddAgentButton operations={operationList} />
        </div>
      </div>

      <MaturityRecommendations
        groups={sortedGroupNames.map((groupName) => ({
          name: groupName,
          color: getOperationColor(groupName === "Sem operação atribuída" ? null : groupName, operationList),
          agents: groups.get(groupName)!,
        }))}
      />

      {agentList.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-16 text-center">
          <Users className="h-8 w-8 text-[var(--color-ink-muted)]" />
          <p className="text-sm font-medium text-[var(--color-ink)]">Ainda sem agentes</p>
          <p className="max-w-xs text-sm text-[var(--color-ink-muted)]">
            Adiciona o primeiro membro da tua equipa para começares a registar avaliações de maturidade.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedGroupNames.map((groupName, index) => {
            const groupColor = getOperationColor(
              groupName === "Sem operação atribuída" ? null : groupName,
              operationList
            );
            return (
              <div key={groupName}>
                {index > 0 && <div className="mb-8 h-px bg-[var(--color-border)]" />}
                <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: groupColor }} />
                  {groupName} · {groups.get(groupName)!.length}{" "}
                  {groups.get(groupName)!.length === 1 ? "agente" : "agentes"}
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {groups.get(groupName)!.map((agent) => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      lastEvaluationDate={lastEvaluationByAgent.get(agent.id) ?? null}
                      operations={operationList}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
