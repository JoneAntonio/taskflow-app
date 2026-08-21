"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { MaturityBadge } from "@/components/team/maturity-badge";
import { NewAgentDialog } from "@/components/team/new-agent-dialog";
import { Card } from "@/components/ui/card";
import { teamMaturityService } from "@/services/team-maturity.service";
import { getOperationColor } from "@/lib/operation-colors";
import type { TeamAgent, TeamOperation } from "@/types/team-maturity";

export function AgentCard({
  agent,
  lastEvaluationDate,
  operations = [],
}: {
  agent: TeamAgent;
  lastEvaluationDate: string | null;
  operations?: TeamOperation[];
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();
  const operationColor = getOperationColor(agent.operation, operations);

  const initials = agent.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleDelete(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setMenuOpen(false);
    if (!confirm(`Eliminar o agente "${agent.name}"? O histórico de avaliações também é removido.`)) return;
    try {
      await teamMaturityService.archiveAgent(agent.id);
      toast.success("Agente eliminado");
      router.refresh();
    } catch {
      toast.error("Não foi possível eliminar o agente.");
    }
  }

  return (
    <div className="relative">
      <Link href={`/equipa/${agent.id}`}>
        <Card
          className="border-l-4 p-4 pr-10 transition-colors hover:border-[var(--color-accent)]/60"
          style={{ borderLeftColor: operationColor }}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface-alt)] font-display text-sm font-semibold text-[var(--color-ink)]">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--color-ink)]">{agent.name}</p>
              {agent.operation && (
                <span
                  className="mt-0.5 inline-block truncate rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{ backgroundColor: `color-mix(in srgb, ${operationColor} 16%, transparent)`, color: operationColor }}
                >
                  {agent.operation}
                </span>
              )}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <MaturityBadge level={agent.current_maturity} />
            <p className="text-xs text-[var(--color-ink-muted)]">
              {lastEvaluationDate ? `Última avaliação: ${lastEvaluationDate}` : "Ainda sem avaliações"}
            </p>
          </div>
        </Card>
      </Link>

      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setMenuOpen((prev) => !prev);
        }}
        aria-label="Mais ações"
        className="absolute right-3 top-3 rounded-md p-1 text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-ink)]"
      >
        <MoreVertical className="h-3.5 w-3.5" />
      </button>

      {menuOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-3 top-10 z-20 w-40 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-[var(--shadow-md)]"
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen(false);
              setEditOpen(true);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-[var(--color-ink)] hover:bg-[var(--color-surface-alt)]"
          >
            <Pencil className="h-3.5 w-3.5" /> Editar
          </button>
          <button
            onClick={handleDelete}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-[var(--color-danger)] hover:bg-[var(--color-surface-alt)]"
          >
            <Trash2 className="h-3.5 w-3.5" /> Eliminar
          </button>
        </div>
      )}

      <NewAgentDialog open={editOpen} onClose={() => setEditOpen(false)} agent={agent} operations={operations} />
    </div>
  );
}
