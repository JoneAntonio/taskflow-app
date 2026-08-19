export function CriteriaBar({ label, value, max = 5 }: { label: string; value: number; max?: number }) {
  const percentage = Math.round((value / max) * 100);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-[var(--color-ink)]">{label}</span>
        <span className="font-mono-data text-[var(--color-ink-muted)]">
          {value.toFixed(1)} / {max}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-alt)]">
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-[width]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
