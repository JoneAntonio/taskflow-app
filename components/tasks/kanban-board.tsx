"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GripVertical } from "lucide-react";
import { taskActionsService } from "@/services/task-actions.service";
import { PRIORITY_COLOR_VAR } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types/database";

const COLUMNS: { status: TaskStatus; label: string; colorVar: string }[] = [
  { status: "pendente", label: "A Fazer", colorVar: "--color-ink-muted" },
  { status: "em_progresso", label: "Em Progresso", colorVar: "--color-secondary" },
  { status: "concluida", label: "Concluído", colorVar: "--color-success" },
];

export function KanbanBoard({ tasks }: { tasks: Task[] }) {
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const router = useRouter();

  async function handleDrop(status: TaskStatus, taskId: string) {
    setDragOverStatus(null);
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === status) return;

    setIsMoving(true);
    try {
      if (status === "concluida") {
        const result = await taskActionsService.markComplete(task);
        if (result.recurred) {
          toast.success("Concluída — próxima ocorrência criada");
        }
      } else {
        await taskActionsService.updateStatus(taskId, status);
      }
      router.refresh();
    } catch {
      toast.error("Não foi possível mover a tarefa.");
    } finally {
      setIsMoving(false);
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {COLUMNS.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.status);
        return (
          <div
            key={column.status}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStatus(column.status);
            }}
            onDragLeave={() => setDragOverStatus((prev) => (prev === column.status ? null : prev))}
            onDrop={(e) => {
              e.preventDefault();
              const taskId = e.dataTransfer.getData("text/task-id");
              if (taskId) handleDrop(column.status, taskId);
            }}
            className={cn(
              "min-h-[120px] rounded-2xl border-2 border-dashed p-3 transition-colors",
              dragOverStatus === column.status
                ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5"
                : "border-transparent bg-[var(--color-surface-alt)]"
            )}
          >
            <p
              className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider"
              style={{ color: `var(${column.colorVar})` }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: `var(${column.colorVar})` }} />
              {column.label} · {columnTasks.length}
            </p>
            <div className="space-y-2">
              {columnTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/task-id", task.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className={cn(
                    "flex cursor-grab items-start gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-ink)] shadow-[var(--shadow-sm)] active:cursor-grabbing",
                    isMoving && "opacity-70"
                  )}
                >
                  <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-ink-muted)]" />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate",
                        task.status === "concluida" && "text-[var(--color-ink-muted)] line-through"
                      )}
                    >
                      {task.title}
                    </p>
                    {task.due_date && (
                      <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
                        {new Date(task.due_date + "T00:00:00").toLocaleDateString("pt-PT", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: `var(${PRIORITY_COLOR_VAR[task.priority]})` }}
                  />
                </div>
              ))}
              {columnTasks.length === 0 && (
                <p className="rounded-lg border border-dashed border-[var(--color-border)] px-2 py-4 text-center text-xs text-[var(--color-ink-muted)]">
                  Arrasta uma tarefa para aqui
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
