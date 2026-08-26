"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Repeat, FileText, AlarmClock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIORITY_TO_CATEGORY_COLOR, CATEGORY_COLOR_HEX, formatDurationText } from "@/lib/dark-productivity";
import { PRIORITY_LABELS } from "@/lib/labels";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { taskActionsService } from "@/services/task-actions.service";
import type { Task } from "@/types/database";

export function TaskDetailedRow({ task }: { task: Task }) {
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
    const next = !isCompleted;
    setIsCompleted(next);
    try {
      if (next) {
        const result = await taskActionsService.markComplete(task);
        toast.success(result.recurred ? "Concluída — próxima ocorrência criada" : "Tarefa concluída");
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
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-accent)]/60">
      <div className="flex items-start gap-3">
        <button
          onClick={handleToggleComplete}
          disabled={isPending}
          aria-label={isCompleted ? "Reabrir tarefa" : "Concluir tarefa"}
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ease-out",
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
                "font-medium hover:underline",
                isCompleted ? "text-[var(--color-ink-muted)] line-through" : "text-[var(--color-ink)]"
              )}
            >
              {task.title}
            </p>
          </button>

          {task.description && (
            <p className="mt-1 line-clamp-2 text-sm text-[var(--color-ink-muted)]">{task.description}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[var(--color-ink-muted)]">
            {(task.due_date || task.due_time) && (
              <span>
                {task.due_date}
                {task.due_time ? ` · ${task.due_time}` : ""}
                {task.due_time_end ? `–${task.due_time_end}` : ""}
              </span>
            )}
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ color: categoryHex, backgroundColor: `${categoryHex}20` }}
            >
              {PRIORITY_LABELS[task.priority]}
            </span>
            {task.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {task.location}
              </span>
            )}
            {task.recurrence?.frequency && (
              <span className="flex items-center gap-1">
                <Repeat className="h-3 w-3" /> Recorrente
              </span>
            )}
            {task.reminder_at && (
              <span className="flex items-center gap-1">
                <AlarmClock className="h-3 w-3" /> Lembrete
              </span>
            )}
            {durationText && <span className="font-mono-data">{durationText}</span>}
          </div>
        </div>

        {task.description && <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-ink-muted)]" />}
      </div>

      <TaskDetailDialog task={task} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </div>
  );
}
