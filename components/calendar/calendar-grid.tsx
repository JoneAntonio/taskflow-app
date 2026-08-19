"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/database";

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function CalendarGrid({ tasks }: { tasks: Task[] }) {
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((task) => {
      if (!task.due_date) return;
      const list = map.get(task.due_date) ?? [];
      list.push(task);
      map.set(task.due_date, list);
    });
    return map;
  }, [tasks]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay.getDay();
  const todayISO = new Date().toISOString().slice(0, 10);

  const cells: { date: string | null; day: number | null }[] = [];
  for (let i = 0; i < startOffset; i++) cells.push({ date: null, day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ date, day: d });
  }

  const monthLabel = cursor.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
  const selectedTasks = selectedDate ? tasksByDate.get(selectedDate) ?? [] : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-lg font-semibold capitalize text-[var(--color-ink)]">{monthLabel}</p>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            aria-label="Mês seguinte"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="pb-1 text-center text-xs font-medium text-[var(--color-ink-muted)]">
            {label}
          </div>
        ))}
        {cells.map((cell, index) => {
          if (!cell.date) return <div key={index} />;
          const dayTasks = tasksByDate.get(cell.date) ?? [];
          const isToday = cell.date === todayISO;
          const isSelected = cell.date === selectedDate;
          return (
            <button
              key={cell.date}
              onClick={() => setSelectedDate(cell.date)}
              className={cn(
                "flex aspect-square flex-col items-center justify-center rounded-xl border text-sm transition-colors",
                isSelected
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
                  : "border-transparent hover:bg-[var(--color-surface-alt)]",
                isToday && !isSelected && "border-[var(--color-border)]"
              )}
            >
              <span className={cn("font-medium", isToday ? "text-[var(--color-accent)]" : "text-[var(--color-ink)]")}>
                {cell.day}
              </span>
              {dayTasks.length > 0 && (
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[var(--color-secondary)]" />
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="mb-2 text-sm font-medium text-[var(--color-ink)]">
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("pt-PT", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          {selectedTasks.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-muted)]">Sem tarefas neste dia.</p>
          ) : (
            <ul className="space-y-1.5 text-sm text-[var(--color-ink)]">
              {selectedTasks.map((task) => (
                <li key={task.id}>• {task.title}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
