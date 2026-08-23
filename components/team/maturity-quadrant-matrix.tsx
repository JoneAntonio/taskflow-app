import { LayoutGrid } from "lucide-react";
import type { TeamAgent } from "@/types/team-maturity";

const QUADRANTS: { level: "M1" | "M2" | "M3" | "M4"; label: string; verb: string; colorVar: string }[] = [
  { level: "M1", label: "M1", verb: "Dirigir", colorVar: "--color-danger" },
  { level: "M2", label: "M2", verb: "Guiar / Treinar", colorVar: "--color-warning" },
  { level: "M3", label: "M3", verb: "Apoiar", colorVar: "--color-secondary" },
  { level: "M4", label: "M4", verb: "Delegar", colorVar: "--color-success" },
];

export function MaturityQuadrantMatrix({ agents }: { agents: TeamAgent[] }) {
  const total = agents.length;
  if (total === 0) return null;

  const counts = QUADRANTS.map((q) => ({
    ...q,
    count: agents.filter((a) => a.current_maturity === q.level).length,
  }));

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
        <LayoutGrid className="h-3.5 w-3.5" /> Distribuição por quadrante
      </p>
      <div className="grid grid-cols-2 gap-2">
        {counts.map((q) => {
          const percentage = total > 0 ? Math.round((q.count / total) * 100) : 0;
          return (
            <div
              key={q.level}
              className="rounded-xl p-3 text-center"
              style={{ backgroundColor: `color-mix(in srgb, var(${q.colorVar}) 10%, transparent)` }}
            >
              <p className="font-display text-lg font-semibold" style={{ color: `var(${q.colorVar})` }}>
                {q.label}
              </p>
              <p className="text-xs font-medium text-[var(--color-ink)]">{q.verb}</p>
              <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                {q.count} {q.count === 1 ? "agente" : "agentes"} · {percentage}%
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
