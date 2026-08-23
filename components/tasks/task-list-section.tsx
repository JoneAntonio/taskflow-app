"use client";

import { useState } from "react";
import { TaskViewSwitcher, type TaskViewMode } from "@/components/tasks/task-view-switcher";
import { TaskListItem } from "@/components/tasks/task-list-item";
import { ChecklistView } from "@/components/tasks/checklist-view";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import type { Task } from "@/types/database";

export function TaskListSection({ tasks }: { tasks: Task[] }) {
  const [view, setView] = useState<TaskViewMode>("lista");
  const pending = tasks.filter((t) => t.status !== "concluida");
  const completed = tasks.filter((t) => t.status === "concluida");

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <TaskViewSwitcher value={view} onChange={setView} />
      </div>

      {view === "kanban" && <KanbanBoard tasks={tasks} />}

      {view === "checklist" && (
        <div className="space-y-4">
          <ChecklistView tasks={pending} />
          {completed.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
                Concluídas
              </p>
              <ChecklistView tasks={completed} />
            </div>
          )}
        </div>
      )}

      {view === "lista" && (
        <div className="space-y-2">
          {pending.map((task) => (
            <TaskListItem key={task.id} task={task} />
          ))}
          {completed.length > 0 && (
            <div className="pt-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
                Concluídas ({completed.length})
              </p>
              <div className="space-y-2">
                {completed.map((task) => (
                  <TaskListItem key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tasks.length === 0 && (
        <p className="rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-10 text-center text-sm text-[var(--color-ink-muted)]">
          Ainda sem tarefas.
        </p>
      )}
    </div>
  );
}
