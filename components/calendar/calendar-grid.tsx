"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin, CalendarDays, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, toLocalISODate } from "@/lib/utils";
import { PRIORITY_COLOR_VAR } from "@/lib/labels";
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
    map.forEach((list) => list.sort((a, b) => (a.due_time ?? "99:99").localeCompare(b.due_time ?? "99:99")));
    return map;
  }, [tasks]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay.getDay();
  const todayISO = toLocalISODate(new Date());

  const cells: { date: string | null; day: number | null }[] = [];
  for (let i = 0; i < startOffset; i++) cells.push({ date: null, day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ date, day: d });
  }

  const monthLabel = cursor.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
  const selectedTasks = selectedDate ? tasksByDate.get(selectedDate) ?? [] : [];

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row md:items-start">
      {/* Painel de detalhe do dia — à esquerda em ecrãs largos */}
      <div className="w-full shrink-0 md:sticky md:top-20 md:w-64">
        {!selectedDate ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[var(--color-border)] px-4 py-10 text-center">
            <CalendarDays className="h-6 w-6 text-[var(--color-ink-muted)]" />
            <p className="text-sm text-[var(--color-ink-muted)]">Clica num dia para veres os detalhes aqui.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="font-display text-sm font-semibold capitalize text-[var(--color-ink)]">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("pt-PT", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            {selectedTasks.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--color-ink-muted)]">Sem tarefas neste dia.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {selectedTasks.map((task) => (
                  <div key={task.id} className="rounded-xl bg-[var(--color-surface-alt)] p-3">
                    <div className="flex items-start gap-2">
                      <span
                        className="mt-1 h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: `var(${PRIORITY_COLOR_VAR[task.priority]})` }}
                      />
                      <p className="text-sm font-medium text-[var(--color-ink)]">{task.title}</p>
                    </div>
                    <div className="mt-1.5 space-y-1 pl-4 text-xs text-[var(--color-ink-muted)]">
                      {task.due_time && (
                        <p className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 shrink-0" />
                          {task.due_time}
                          {task.due_time_end ? ` – ${task.due_time_end}` : ""}
                        </p>
                      )}
                      {task.location && (
                        <p className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {task.location}
                        </p>
                      )}
                      {task.recurrence && (
                        <p className="flex items-center gap-1.5">
                          <Repeat className="h-3 w-3 shrink-0" />
                          Recorrente
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grelha do calendário */}
      <div className="min-w-0 flex-1 space-y-4">
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
      </div>
    </div>
  );
}
