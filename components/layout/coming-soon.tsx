import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  icon: Icon,
  title,
  description,
  phase,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface-alt)]">
        <Icon className="h-6 w-6 text-[var(--color-accent)]" />
      </div>
      <h1 className="font-display text-xl font-semibold text-[var(--color-ink)]">{title}</h1>
      <p className="mt-2 max-w-sm text-sm text-[var(--color-ink-muted)]">{description}</p>
      <span className="mt-4 rounded-full bg-[var(--color-surface-alt)] px-3 py-1 text-xs font-medium text-[var(--color-ink-muted)]">
        Chega na {phase}
      </span>
    </div>
  );
}
