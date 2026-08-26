"use client";

import { useTaskDisplayMode } from "@/lib/use-task-display-mode";
import { TaskDisplayModeSwitcher } from "@/components/tasks/task-display-mode-switcher";
import { TaskListItem } from "@/components/tasks/task-list-item";
import { TaskDetailedRow } from "@/components/tasks/task-detailed-row";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import type { Task } from "@/types/database";

export function TaskListWithModes({ tasks, emptyMessage }: { tasks: Task[]; emptyMessage: string }) {
  const [mode, setMode] = useTaskDisplayMode();

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <TaskDisplayModeSwitcher value={mode} onChange={setMode} />
      </div>

      {tasks.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-16 text-center text-sm text-[var(--color-ink-muted)]">
          {emptyMessage}
        </p>
      ) : mode === "grelha" ? (
        <KanbanBoard tasks={tasks} />
      ) : mode === "detalhada" ? (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskDetailedRow key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskListItem key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
