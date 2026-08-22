"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Repeat, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIORITY_COLOR_VAR } from "@/lib/labels";
import { TaskCountdownBadge } from "@/components/tasks/task-countdown-badge";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { taskActionsService } from "@/services/task-actions.service";
import type { Task } from "@/types/database";

export function TaskListItem({
  task,
  compact = false,
  assigneeName,
}: {
  task: Task;
  compact?: boolean;
  assigneeName?: string | null;
}) {
  const [isPending, setIsPending] = useState(false);
  const [isCompleted, setIsCompleted] = useState(task.status === "concluida");
  const [detailOpen, setDetailOpen] = useState(false);
  const router = useRouter();

  async function handleToggleComplete(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setIsPending(true);
    const next = !isCompleted;
    setIsCompleted(next);
    try {
      if (next) {
        await taskActionsService.markComplete(task.id);
        toast.success("Tarefa concluída");
      } else {
        await taskActionsService.reopenTask(task.id);
      }
      router.refresh();
    } catch {
      toast.error("Não foi possível atualizar a tarefa.");
      setIsCompleted(!next);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] transition-colors hover:border-[var(--color-accent)]/60",
        compact ? "px-3 py-2" : "px-4 py-3"
      )}
    >
      <button
        onClick={handleToggleComplete}
        disabled={isPending}
        aria-label={isCompleted ? "Reabrir tarefa" : "Concluir tarefa"}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          isCompleted ? "border-[var(--color-success)] bg-[var(--color-success)]" : "hover:border-[var(--color-accent)]"
        )}
        style={!isCompleted ? { borderColor: `var(${PRIORITY_COLOR_VAR[task.priority]})` } : undefined}
      >
        {isCompleted && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <button type="button" onClick={() => setDetailOpen(true)} className="text-left">
          <p
            className={cn(
              "flex items-center gap-1.5 truncate font-medium hover:underline",
              isCompleted ? "text-[var(--color-ink-muted)] line-through" : "text-[var(--color-ink)]",
              compact ? "text-sm" : "text-sm"
            )}
          >
            {task.title}
            {task.description && (
              <FileText className="h-3 w-3 shrink-0 text-[var(--color-ink-muted)]" aria-label="Tem nota" />
            )}
          </p>
        </button>
        {!compact && (task.due_date || task.due_time) && (
          <p className="flex items-center gap-1 text-xs text-[var(--color-ink-muted)]">
            {task.due_date}
            {task.due_time ? ` · ${task.due_time}` : ""}
            {task.due_time_end ? `–${task.due_time_end}` : ""}
            {task.recurrence && <Repeat className="h-3 w-3" />}
          </p>
        )}
      </div>
      {!isCompleted && assigneeName && (
        <span className="hidden shrink-0 rounded-full bg-[var(--color-surface-alt)] px-2 py-0.5 text-[11px] text-[var(--color-ink-muted)] sm:inline">
          {assigneeName}
        </span>
      )}
      {!isCompleted && <TaskCountdownBadge task={task} />}
      <TaskDetailDialog task={task} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </div>
  );
}
