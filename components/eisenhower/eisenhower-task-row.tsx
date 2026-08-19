"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { taskActionsService } from "@/services/task-actions.service";
import type { Task } from "@/types/database";

export function EisenhowerTaskRow({ task }: { task: Task }) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

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

  async function handleComplete() {
    setIsPending(true);
    try {
      await taskActionsService.markComplete(task.id);
      toast.success("Tarefa concluída");
      router.refresh();
    } catch {
      toast.error("Não foi possível concluir a tarefa.");
      setIsPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-lg bg-[var(--color-surface)] px-3 py-2 text-sm">
      <button
        onClick={handleComplete}
        disabled={isPending}
        aria-label="Concluir"
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] hover:border-[var(--color-accent)]"
      >
        <Check className="h-3 w-3 opacity-0 hover:opacity-60" />
      </button>
      <span className="min-w-0 flex-1 truncate text-[var(--color-ink)]">{task.title}</span>
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
    </div>
  );
}
