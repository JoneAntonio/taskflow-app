import { cn } from "@/lib/utils";
import type { MaturityLevel } from "@/types/team-maturity";

const MATURITY_COLORS: Record<MaturityLevel, string> = {
  M1: "var(--color-danger)",
  M2: "var(--color-warning)",
  M3: "var(--color-secondary)",
  M4: "var(--color-success)",
};

export function MaturityBadge({
  level,
  size = "md",
}: {
  level: MaturityLevel | null;
  size?: "sm" | "md" | "lg";
}) {
  if (!level) {
    return (
      <span className="inline-flex items-center rounded-full bg-[var(--color-surface-alt)] px-2.5 py-1 text-xs font-medium text-[var(--color-ink-muted)]">
        Sem avaliação
      </span>
    );
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3.5 py-1.5 text-sm",
  }[size];

  return (
    <span
      className={cn("inline-flex items-center rounded-full font-semibold", sizeClasses)}
      style={{
        backgroundColor: `color-mix(in srgb, ${MATURITY_COLORS[level]} 16%, transparent)`,
        color: MATURITY_COLORS[level],
      }}
    >
      {level}
    </span>
  );
}
