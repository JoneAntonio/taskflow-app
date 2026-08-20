"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn, toLocalISODate } from "@/lib/utils";

const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

export function MiniCalendar({
  selectedDate,
  onSelect,
}: {
  selectedDate: string | null;
  onSelect: (date: string) => void;
}) {
  const [cursor, setCursor] = useState(() => (selectedDate ? new Date(selectedDate + "T00:00:00") : new Date()));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay.getDay();
  const todayISO = toLocalISODate(new Date());

  const cells: { date: string | null; day: number | null }[] = [];
  for (let i = 0; i < startOffset; i++) cells.push({ date: null, day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`, day: d });
  }

  const monthLabel = cursor.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium capitalize text-[var(--color-ink)]">{monthLabel}</p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="rounded-md p-1 text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-alt)]"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="rounded-md p-1 text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-alt)]"
            aria-label="Mês seguinte"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((label, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-[var(--color-ink-muted)]">
            {label}
          </div>
        ))}
        {cells.map((cell, index) => {
          if (!cell.date) return <div key={index} />;
          const isToday = cell.date === todayISO;
          const isSelected = cell.date === selectedDate;
          return (
            <button
              key={cell.date}
              type="button"
              onClick={() => onSelect(cell.date!)}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs transition-colors",
                isSelected
                  ? "bg-[var(--color-accent)] font-semibold text-[var(--color-accent-ink)]"
                  : isToday
                    ? "border border-[var(--color-accent)] text-[var(--color-ink)]"
                    : "text-[var(--color-ink)] hover:bg-[var(--color-surface-alt)]"
              )}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
