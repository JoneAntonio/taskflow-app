import { MATURITY_LEVELS } from "@/types/team-maturity";
import type { TeamAgent, MaturityLevel } from "@/types/team-maturity";

export function OperationStatsCard({
  name,
  color,
  agents,
}: {
  name: string;
  color: string;
  agents: TeamAgent[];
}) {
  const counts: Record<MaturityLevel, number> = { M1: 0, M2: 0, M3: 0, M4: 0 };
  let withoutEvaluation = 0;
  agents.forEach((agent) => {
    if (agent.current_maturity) counts[agent.current_maturity] += 1;
    else withoutEvaluation += 1;
  });

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <p className="truncate text-sm font-medium text-[var(--color-ink)]">{name}</p>
        <span className="ml-auto shrink-0 text-xs text-[var(--color-ink-muted)]">
          {agents.length} {agents.length === 1 ? "agente" : "agentes"}
        </span>
      </div>

      <div className="mt-3 flex gap-1.5">
        {MATURITY_LEVELS.map((level) => {
          const count = counts[level];
          const percentage = agents.length > 0 ? (count / agents.length) * 100 : 0;
          return (
            <div key={level} className="flex-1">
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-alt)]">
                <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: color }} />
              </div>
              <p className="mt-1 text-center text-[10px] text-[var(--color-ink-muted)]">
                {level} · {count}
              </p>
            </div>
          );
        })}
      </div>
      {withoutEvaluation > 0 && (
        <p className="mt-2 text-[11px] text-[var(--color-ink-muted)]">{withoutEvaluation} sem avaliação ainda</p>
      )}
    </div>
  );
}
