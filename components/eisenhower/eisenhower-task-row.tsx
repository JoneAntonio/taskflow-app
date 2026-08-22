"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Check, Trash2, Repeat } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { taskActionsService } from "@/services/task-actions.service";
import type { Task } from "@/types/database";

export function EisenhowerTaskRow({ task }: { task: Task }) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  const isCompleted = task.status === "concluida";

  async function handleToggleImportant() {
    setIsPending(true);
    try {
      await taskActionsService.toggleImportant(task.id, !task.is_important);
      router.refresh();
    } catch {
      toast.error("Não foi possível atualizar a tarefa.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleToggleComplete() {
    setIsPending(true);
    try {
      if (isCompleted) {
        await taskActionsService.reopenTask(task.id);
      } else {
        const result = await taskActionsService.markComplete(task);
        toast.success(
          result.recurred && result.nextDate
            ? `Concluída — próxima ocorrência em ${new Date(result.nextDate + "T00:00:00").toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" })}`
            : "Tarefa concluída"
        );
      }
      router.refresh();
    } catch {
      toast.error("Não foi possível atualizar a tarefa.");
      setIsPending(false);
    }
  }

  async function handleDeletePermanently() {
    if (!confirm("Eliminar esta tarefa definitivamente? Não é possível desfazer.")) return;
    setIsPending(true);
    try {
      await taskActionsService.deletePermanently(task.id);
      toast.success("Tarefa eliminada");
      router.refresh();
    } catch {
      toast.error("Não foi possível eliminar a tarefa.");
      setIsPending(false);
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
        isCompleted ? "bg-[var(--color-surface-alt)]" : "bg-[var(--color-surface)]"
      )}
    >
      <button
        onClick={handleToggleComplete}
        disabled={isPending}
        aria-label={isCompleted ? "Reabrir tarefa" : "Concluir"}
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
          isCompleted
            ? "border-[var(--color-success)] bg-[var(--color-success)]"
            : "border-[var(--color-border)] hover:border-[var(--color-accent)]"
        )}
      >
        {isCompleted && <Check className="h-3 w-3 text-white" />}
      </button>
      <span
        className={cn(
          "min-w-0 flex-1 truncate",
          isCompleted ? "text-[var(--color-ink-muted)] line-through" : "text-[var(--color-ink)]"
        )}
      >
        {task.title}
      </span>
      {(task.due_date || task.due_time) && !isCompleted && (
        <span className="hidden shrink-0 items-center gap-1 text-xs text-[var(--color-ink-muted)] sm:flex">
          {task.due_date && new Date(task.due_date + "T00:00:00").toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" })}
          {task.due_time ? ` · ${task.due_time}` : ""}
          {task.due_time_end ? `–${task.due_time_end}` : ""}
          {task.recurrence && <Repeat className="h-3 w-3" />}
        </span>
      )}
      {!isCompleted && (
        <button
          onClick={handleToggleImportant}
          disabled={isPending}
          aria-label="Marcar como importante"
          className="shrink-0"
        >
          <Star
            className={cn(
              "h-3.5 w-3.5 transition-colors",
              task.is_important ? "fill-[var(--color-warning)] text-[var(--color-warning)]" : "text-[var(--color-ink-muted)]"
            )}
          />
        </button>
      )}
      <button
        onClick={handleDeletePermanently}
        disabled={isPending}
        aria-label="Eliminar definitivamente"
        className="shrink-0 text-[var(--color-ink-muted)] hover:text-[var(--color-danger)]"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
