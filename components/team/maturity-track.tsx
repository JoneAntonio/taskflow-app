import { MATURITY_LEVELS, type MaturityLevel } from "@/types/team-maturity";
import { cn } from "@/lib/utils";

export function MaturityTrack({ current }: { current: MaturityLevel | null }) {
  const currentIndex = current ? MATURITY_LEVELS.indexOf(current) : -1;

  return (
    <div className="flex items-center">
      {MATURITY_LEVELS.map((level, index) => {
        const isActive = level === current;
        const isPast = currentIndex >= 0 && index < currentIndex;
        return (
          <div key={level} className="flex flex-1 items-center last:flex-none">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                isActive &&
                  "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-ink)]",
                isPast &&
                  !isActive &&
                  "border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-ink-muted)]",
                !isActive && !isPast && "border-[var(--color-border)] text-[var(--color-ink-muted)]"
              )}
            >
              {level}
            </div>
            {index < MATURITY_LEVELS.length - 1 && (
              <div
                className={cn(
                  "mx-1.5 h-0.5 flex-1 rounded-full",
                  isPast ? "bg-[var(--color-accent)]/40" : "bg-[var(--color-border)]"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
