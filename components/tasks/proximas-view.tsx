"use client";

import { useMemo, useState } from "react";
import { FileText, ListFilter } from "lucide-react";
import { TaskListItem } from "@/components/tasks/task-list-item";
import { TaskDetailedRow } from "@/components/tasks/task-detailed-row";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { TaskDisplayModeSwitcher } from "@/components/tasks/task-display-mode-switcher";
import { useTaskDisplayMode } from "@/lib/use-task-display-mode";
import { cn } from "@/lib/utils";
import type { Task, Project } from "@/types/database";

type GroupByOption = "dueDate" | "priority" | "category" | "project" | "none";

const GROUP_LABELS: Record<GroupByOption, string> = {
  dueDate: "Por data de vencimento",
  priority: "Por prioridade",
  category: "Por categoria/etiqueta",
  project: "Por projeto",
  none: "Sem agrupamento",
};

const PRIORITY_GROUP_ORDER = ["Alta prioridade", "Média prioridade", "Baixa prioridade"];

function priorityGroupLabel(priority: Task["priority"]): string {
  if (priority === "urgente" || priority === "alta") return "Alta prioridade";
  if (priority === "media") return "Média prioridade";
  return "Baixa prioridade";
}

export function ProximasView({
  allTasks,
  dateGroups,
  projects,
}: {
  allTasks: Task[];
  dateGroups: { label: string; tasks: Task[] }[];
  projects: Project[];
}) {
  const [groupBy, setGroupBy] = useState<GroupByOption>("dueDate");
  const [showNotes, setShowNotes] = useState(false);
  const [displayMode, setDisplayMode] = useTaskDisplayMode();

  const groups = useMemo(() => {
    if (groupBy === "dueDate") return dateGroups;

    if (groupBy === "none") {
      return [{ label: "Todas", tasks: allTasks }];
    }

    if (groupBy === "priority") {
      const map = new Map<string, Task[]>();
      allTasks.forEach((task) => {
        const label = priorityGroupLabel(task.priority);
        const list = map.get(label) ?? [];
        list.push(task);
        map.set(label, list);
      });
      return PRIORITY_GROUP_ORDER.filter((label) => map.has(label)).map((label) => ({
        label,
        tasks: map.get(label)!,
      }));
    }

    if (groupBy === "category") {
      const map = new Map<string, Task[]>();
      allTasks.forEach((task) => {
        const tags = task.tags ?? [];
        if (tags.length === 0) {
          const list = map.get("Sem etiqueta") ?? [];
          list.push(task);
          map.set("Sem etiqueta", list);
          return;
        }
        tags.forEach((tag) => {
          const list = map.get(tag.name) ?? [];
          list.push(task);
          map.set(tag.name, list);
        });
      });
      const names = [...map.keys()].sort((a, b) => a.localeCompare(b, "pt"));
      return names.map((name) => ({ label: name, tasks: map.get(name)! }));
    }

    // project
    const projectNameById = new Map(projects.map((p) => [p.id, p.name]));
    const map = new Map<string, Task[]>();
    allTasks.forEach((task) => {
      const key = task.project_id ? (projectNameById.get(task.project_id) ?? "Projeto removido") : "Sem projeto";
      const list = map.get(key) ?? [];
      list.push(task);
      map.set(key, list);
    });
    const names = [...map.keys()].sort((a, b) => a.localeCompare(b, "pt"));
    return names.map((name) => ({ label: name, tasks: map.get(name)! }));
  }, [groupBy, allTasks, dateGroups, projects]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
          <ListFilter className="h-3.5 w-3.5 shrink-0 text-[var(--color-ink-muted)]" />
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupByOption)}
            className="bg-transparent text-sm text-[var(--color-ink)] outline-none"
          >
            {(Object.keys(GROUP_LABELS) as GroupByOption[]).map((option) => (
              <option key={option} value={option}>
                {GROUP_LABELS[option]}
              </option>
            ))}
          </select>
        </label>

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

        <TaskDisplayModeSwitcher value={displayMode} onChange={setDisplayMode} />
      </div>

      {allTasks.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-16 text-center text-sm text-[var(--color-ink-muted)]">
          Sem tarefas agendadas nos próximos tempos.
        </p>
      ) : displayMode === "grelha" ? (
        <KanbanBoard tasks={allTasks} />
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
                    <div key={`${group.label}-${task.id}`}>
                      {displayMode === "detalhada" ? <TaskDetailedRow task={task} /> : <TaskListItem task={task} />}
                      {showNotes && displayMode !== "detalhada" && task.description && (
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
