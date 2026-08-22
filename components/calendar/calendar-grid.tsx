"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, CalendarDays, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskListItem } from "@/components/tasks/task-list-item";
import { projectOccurrences } from "@/lib/recurrence";
import { cn, toLocalISODate } from "@/lib/utils";
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

  // Dias em que uma tarefa recorrente também ocorre neste mês, além do seu
  // due_date original — só para pré-visualização (não são linhas reais).
  const projectedByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    const rangeStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const rangeEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
    tasks.forEach((task) => {
      if (!task.due_date || !task.recurrence?.frequency) return;
      const dates = projectOccurrences(task.due_date, task.recurrence, rangeStart, rangeEnd);
      dates.forEach((date) => {
        if (tasksByDate.has(date)) return; // já existe uma ocorrência real nesse dia
        const list = map.get(date) ?? [];
        list.push(task);
        map.set(date, list);
      });
    });
    return map;
  }, [tasks, tasksByDate, year, month, daysInMonth]);

  const cells: { date: string | null; day: number | null }[] = [];
  for (let i = 0; i < startOffset; i++) cells.push({ date: null, day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ date, day: d });
  }

  const monthLabel = cursor.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
  const selectedTasks = selectedDate ? tasksByDate.get(selectedDate) ?? [] : [];
  const selectedProjected = selectedDate ? projectedByDate.get(selectedDate) ?? [] : [];

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
            {selectedTasks.length === 0 && selectedProjected.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--color-ink-muted)]">Sem tarefas neste dia.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {selectedTasks.map((task) => (
                  <div key={task.id}>
                    <TaskListItem task={task} compact />
                    {task.location && (
                      <p className="ml-8 mt-0.5 flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {task.location}
                      </p>
                    )}
                  </div>
                ))}
                {selectedProjected.map((task) => (
                  <div
                    key={`projected-${task.id}`}
                    className="flex items-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-ink-muted)]"
                  >
                    <Repeat className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{task.title}</span>
                    <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wide">Prevista</span>
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
            const dayProjected = projectedByDate.get(cell.date) ?? [];
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
                {dayTasks.length === 0 && dayProjected.length > 0 && (
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full border border-[var(--color-secondary)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
