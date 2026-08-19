import Link from "next/link";
import { MaturityBadge } from "@/components/team/maturity-badge";
import { Card } from "@/components/ui/card";
import type { TeamAgent } from "@/types/team-maturity";

export function AgentCard({ agent, lastEvaluationDate }: { agent: TeamAgent; lastEvaluationDate: string | null }) {
  const initials = agent.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Link href={`/equipa/${agent.id}`}>
      <Card className="p-4 transition-colors hover:border-[var(--color-accent)]/60">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface-alt)] font-display text-sm font-semibold text-[var(--color-ink)]">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--color-ink)]">{agent.name}</p>
              {agent.operation && (
                <p className="truncate text-xs text-[var(--color-ink-muted)]">{agent.operation}</p>
              )}
            </div>
          </div>
          <MaturityBadge level={agent.current_maturity} />
        </div>
        <p className="mt-3 text-xs text-[var(--color-ink-muted)]">
          {lastEvaluationDate ? `Última avaliação: ${lastEvaluationDate}` : "Ainda sem avaliações"}
        </p>
      </Card>
    </Link>
  );
}
