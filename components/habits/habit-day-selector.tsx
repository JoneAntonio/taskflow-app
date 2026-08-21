"use client";

import { cn } from "@/lib/utils";

const DAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

export function HabitDaySelector({
  selectedDays,
  onChange,
}: {
  selectedDays: number[];
  onChange: (days: number[]) => void;
}) {
  function toggleDay(day: number) {
    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter((d) => d !== day));
    } else {
      onChange([...selectedDays, day].sort());
    }
  }

  return (
    <div>
      <div className="flex gap-1.5">
        {DAY_LABELS.map((label, day) => (
          <button
            key={day}
            type="button"
            onClick={() => toggleDay(day)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
              selectedDays.includes(day)
                ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-ink)]"
                : "border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onChange([0, 1, 2, 3, 4, 5, 6])}
          className="rounded-full bg-[var(--color-surface-alt)] px-2.5 py-1 text-[11px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
        >
          Todos os dias
        </button>
        <button
          type="button"
          onClick={() => onChange([1, 2, 3, 4, 5])}
          className="rounded-full bg-[var(--color-surface-alt)] px-2.5 py-1 text-[11px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
        >
          Dias úteis
        </button>
        <button
          type="button"
          onClick={() => onChange([0, 6])}
          className="rounded-full bg-[var(--color-surface-alt)] px-2.5 py-1 text-[11px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
        >
          Fim de semana
        </button>
      </div>
      <p className="mt-2 text-xs text-[var(--color-ink-muted)]">
        {selectedDays.length} {selectedDays.length === 1 ? "dia" : "dias"} por semana
      </p>
    </div>
  );
}
