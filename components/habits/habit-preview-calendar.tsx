"use client";

import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

export function HabitPreviewCalendar({ selectedDays, color }: { selectedDays: number[]; color: string }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay.getDay();
  const monthLabel = now.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });

  const cells: { day: number | null; weekday: number | null }[] = [];
  for (let i = 0; i < startOffset; i++) cells.push({ day: null, weekday: null });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, weekday: new Date(year, month, d).getDay() });
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
      <p className="mb-2 text-center text-xs font-medium capitalize text-[var(--color-ink)]">{monthLabel}</p>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((label, i) => (
          <div key={i} className="text-center text-[10px] text-[var(--color-ink-muted)]">
            {label}
          </div>
        ))}
        {cells.map((cell, index) => {
          if (!cell.day) return <div key={index} />;
          const isActive = cell.weekday !== null && selectedDays.includes(cell.weekday);
          return (
            <div
              key={index}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-[11px]",
                isActive ? "font-semibold text-white" : "text-[var(--color-ink-muted)]"
              )}
              style={isActive ? { backgroundColor: color } : undefined}
            >
              {cell.day}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-center text-[10px] text-[var(--color-ink-muted)]">
        Assim vai ficar marcado o hábito este mês
      </p>
    </div>
  );
}
