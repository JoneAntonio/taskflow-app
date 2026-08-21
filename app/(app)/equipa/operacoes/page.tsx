import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { OperationsManager } from "@/components/team/operations-manager";
import { OperationStatsCard } from "@/components/team/operation-stats-card";
import { getOperationColor } from "@/lib/operation-colors";
import type { TeamAgent, TeamOperation } from "@/types/team-maturity";

export const metadata: Metadata = { title: "Operações — JAFLOW" };

export default async function OperacoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: operations }, { data: agents }] = await Promise.all([
    supabase.from("team_operations").select("*").order("name"),
    supabase.from("team_agents").select("*").eq("archived", false),
  ]);

  const operationList = (operations ?? []) as TeamOperation[];
  const agentList = (agents ?? []) as TeamAgent[];

  const agentsByOperation = new Map<string, TeamAgent[]>();
  agentList.forEach((agent) => {
    const key = agent.operation?.trim() || "Sem operação atribuída";
    const list = agentsByOperation.get(key) ?? [];
    list.push(agent);
    agentsByOperation.set(key, list);
  });
  const operationNames = [...agentsByOperation.keys()].sort((a, b) => a.localeCompare(b, "pt"));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/equipa"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
      >
        <ArrowLeft className="h-4 w-4" /> Maturidade da Equipa
      </Link>

      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Operações</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Personaliza a cor de cada operação/equipa que supervisionas, e acompanha a distribuição de maturidade em
          cada uma.
        </p>
      </div>

      <OperationsManager initialOperations={operationList} />

      {operationNames.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
            Panorama por operação
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {operationNames.map((name) => (
              <OperationStatsCard
                key={name}
                name={name}
                color={getOperationColor(name === "Sem operação atribuída" ? null : name, operationList)}
                agents={agentsByOperation.get(name)!}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
