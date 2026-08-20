"use client";

import { useState } from "react";
import { CalendarRange, FolderKanban, FileText } from "lucide-react";
import { TaskListItem } from "@/components/tasks/task-list-item";
import { cn } from "@/lib/utils";
import type { Task, Project } from "@/types/database";

type ViewMode = "data" | "projeto";

export function ProximasView({
  allTasks,
  dateGroups,
  projects,
}: {
  allTasks: Task[];
  dateGroups: { label: string; tasks: Task[] }[];
  projects: Project[];
}) {
  const [view, setView] = useState<ViewMode>("data");
  const [showNotes, setShowNotes] = useState(false);

  const projectNameById = new Map(projects.map((p) => [p.id, p.name]));
  const projectGroups = new Map<string, Task[]>();
  allTasks.forEach((task) => {
    const key = task.project_id ? projectNameById.get(task.project_id) ?? "Projeto removido" : "Sem projeto";
    const list = projectGroups.get(key) ?? [];
    list.push(task);
    projectGroups.set(key, list);
  });
  const sortedProjectGroupNames = [...projectGroups.keys()].sort((a, b) => a.localeCompare(b, "pt"));

  const groups =
    view === "data" ? dateGroups : sortedProjectGroupNames.map((name) => ({ label: name, tasks: projectGroups.get(name)! }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-1">
          <button
            onClick={() => setView("data")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              view === "data"
                ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-[var(--shadow-sm)]"
                : "text-[var(--color-ink-muted)]"
            )}
          >
            <CalendarRange className="h-3.5 w-3.5" /> Por data
          </button>
          <button
            onClick={() => setView("projeto")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              view === "projeto"
                ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-[var(--shadow-sm)]"
                : "text-[var(--color-ink-muted)]"
            )}
          >
            <FolderKanban className="h-3.5 w-3.5" /> Por projeto
          </button>
        </div>

        <button
          onClick={() => setShowNotes((prev) => !prev)}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            showNotes
              ? "border-[var(--color-accent)] text-[var(--color-accent)]"
              : "border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
          )}
        >
          <FileText className="h-3.5 w-3.5" /> Mostrar notas
        </button>
      </div>

      {allTasks.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-16 text-center text-sm text-[var(--color-ink-muted)]">
          Sem tarefas agendadas nos próximos tempos.
        </p>
      ) : (
        groups.map(
          (group) =>
            group.tasks.length > 0 && (
              <div key={group.label}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
                  {group.label} · {group.tasks.length}
                </p>
                <div className="space-y-2">
                  {group.tasks.map((task) => (
                    <div key={task.id}>
                      <TaskListItem task={task} />
                      {showNotes && task.description && (
                        <p className="ml-7 mt-1 rounded-lg bg-[var(--color-surface-alt)] px-3 py-2 text-xs text-[var(--color-ink-muted)]">
                          {task.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
        )
      )}
    </div>
  );
}
