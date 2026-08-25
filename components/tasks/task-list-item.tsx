"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Repeat, FileText, AlarmClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIORITY_TO_CATEGORY_COLOR, CATEGORY_COLOR_HEX, formatDurationText } from "@/lib/dark-productivity";
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

  const categoryHex = CATEGORY_COLOR_HEX[PRIORITY_TO_CATEGORY_COLOR[task.priority]];
  const durationText = formatDurationText(task.estimated_duration_minutes);

  async function handleToggleComplete(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setIsPending(true);

    // Tarefas recorrentes nunca ficam "concluídas" de vez — avançam para a
    // próxima ocorrência, por isso não têm um estado de "desmarcar".
    if (task.recurrence?.frequency && !isCompleted) {
      try {
        const result = await taskActionsService.markComplete(task);
        toast.success(
          result.recurred && result.nextDate
            ? `Concluída — próxima ocorrência em ${new Date(result.nextDate + "T00:00:00").toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" })}`
            : "Tarefa concluída"
        );
        router.refresh();
      } catch {
        toast.error("Não foi possível atualizar a tarefa.");
      } finally {
        setIsPending(false);
      }
      return;
    }

    const next = !isCompleted;
    setIsCompleted(next);
    try {
      if (next) {
        await taskActionsService.markComplete(task);
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
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ease-out",
          isCompleted ? "scale-105 border-[var(--color-success)] bg-[var(--color-success)]" : "hover:scale-110"
        )}
        style={!isCompleted ? { borderColor: categoryHex } : undefined}
      >
        <Check
          className={cn(
            "h-3 w-3 text-white transition-all duration-200",
            isCompleted ? "scale-100 opacity-100" : "scale-50 opacity-0"
          )}
          strokeWidth={3}
        />
      </button>

      <div className="min-w-0 flex-1">
        <button type="button" onClick={() => setDetailOpen(true)} className="text-left">
          <p
            className={cn(
              "truncate font-medium hover:underline",
              isCompleted ? "text-[var(--color-ink-muted)] line-through" : "text-[var(--color-ink)]",
              compact ? "text-sm" : "text-sm"
            )}
          >
            {task.title}
          </p>
        </button>
        {!compact && (task.due_date || task.due_time) && (
          <p className="text-xs text-[var(--color-ink-muted)]">
            {task.due_date}
            {task.due_time ? ` · ${task.due_time}` : ""}
            {task.due_time_end ? `–${task.due_time_end}` : ""}
          </p>
        )}
      </div>

      {!isCompleted && (
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          {task.description && <FileText className="h-3.5 w-3.5 text-[var(--color-ink-muted)]" aria-label="Tem nota" />}
          {task.recurrence?.frequency && (
            <Repeat className="h-3.5 w-3.5 text-[var(--color-ink-muted)]" aria-label="Recorrente" />
          )}
          {task.reminder_at && <AlarmClock className="h-3.5 w-3.5 text-[var(--color-ink-muted)]" aria-label="Com lembrete" />}
          {durationText && (
            <span className="font-mono-data text-[11px] text-[var(--color-ink-muted)]">{durationText}</span>
          )}
        </div>
      )}
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
