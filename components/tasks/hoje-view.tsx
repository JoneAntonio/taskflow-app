"use client";

import { useState } from "react";
import { List, CalendarClock } from "lucide-react";
import { AgendaTimeline } from "@/components/pomodoro/agenda-timeline";
import { TaskListItem } from "@/components/tasks/task-list-item";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/database";

function groupByPeriod(tasks: Task[]) {
  const groups = { manha: [] as Task[], tarde: [] as Task[], noite: [] as Task[], semHora: [] as Task[] };
  for (const task of tasks) {
    if (!task.due_time) {
      groups.semHora.push(task);
      continue;
    }
    const hour = Number(task.due_time.slice(0, 2));
    if (hour < 12) groups.manha.push(task);
    else if (hour < 18) groups.tarde.push(task);
    else groups.noite.push(task);
  }
  return groups;
}

export function HojeView({ todayTasks, overdueTasks }: { todayTasks: Task[]; overdueTasks: Task[] }) {
  const [view, setView] = useState<"lista" | "agenda">("lista");
  const groups = groupByPeriod(todayTasks);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="flex gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-1">
          <button
            onClick={() => setView("lista")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              view === "lista"
                ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-[var(--shadow-sm)]"
                : "text-[var(--color-ink-muted)]"
            )}
          >
            <List className="h-3.5 w-3.5" /> Lista
          </button>
          <button
            onClick={() => setView("agenda")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              view === "agenda"
                ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-[var(--shadow-sm)]"
                : "text-[var(--color-ink-muted)]"
            )}
          >
            <CalendarClock className="h-3.5 w-3.5" /> Agenda
          </button>
        </div>
      </div>

      {view === "agenda" ? (
        <AgendaTimeline tasks={todayTasks} />
      ) : (
        <>
          {overdueTasks.length > 0 && <TaskGroup title="Atrasadas" tasks={overdueTasks} tone="danger" />}
          <TaskGroup title="Sem hora definida" tasks={groups.semHora} />
          <TaskGroup title="Manhã" tasks={groups.manha} />
          <TaskGroup title="Tarde" tasks={groups.tarde} />
          <TaskGroup title="Noite" tasks={groups.noite} />

          {todayTasks.length === 0 && overdueTasks.length === 0 && (
            <p className="rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-16 text-center text-sm text-[var(--color-ink-muted)]">
              Sem tarefas para hoje. Bom trabalho — ou boa oportunidade para planear amanhã.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function TaskGroup({ title, tasks, tone }: { title: string; tasks: Task[]; tone?: "danger" }) {
  if (tasks.length === 0) return null;
  return (
    <div>
      <p
        className="mb-2 text-xs font-semibold uppercase tracking-wider"
        style={{ color: tone === "danger" ? "var(--color-danger)" : "var(--color-ink-muted)" }}
      >
        {title}
      </p>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskListItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
