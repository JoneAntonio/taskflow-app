import { PieChart } from "lucide-react";

const BAR_COLORS = ["#F2A93B", "#3F6FA8", "#3F9E6D", "#8B5CF6", "#E2504C", "#0EA5A5"];

export function CategoryDistributionWidget({ entries }: { entries: { label: string; count: number }[] }) {
  if (entries.length === 0) return null;
  const total = entries.reduce((sum, e) => sum + e.count, 0);
  if (total === 0) return null;

  const sorted = [...entries].sort((a, b) => b.count - a.count).slice(0, 6);

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
        <PieChart className="h-3.5 w-3.5" /> Onde o tempo está a ser gasto
      </p>
      <div className="space-y-2.5">
        {sorted.map((entry, index) => {
          const percentage = Math.round((entry.count / total) * 100);
          return (
            <div key={entry.label}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="truncate text-[var(--color-ink)]">{entry.label}</span>
                <span className="shrink-0 text-[var(--color-ink-muted)]">
                  {entry.count} · {percentage}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-alt)]">
                <div
                  className="h-full rounded-full transition-[width]"
                  style={{ width: `${percentage}%`, backgroundColor: BAR_COLORS[index % BAR_COLORS.length] }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
