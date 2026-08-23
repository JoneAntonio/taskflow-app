"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { taskActionsService } from "@/services/task-actions.service";
import type { Task } from "@/types/database";

export function ChecklistView({ tasks }: { tasks: Task[] }) {
  return (
    <div className="space-y-1.5">
      {tasks.map((task) => (
        <ChecklistRow key={task.id} task={task} />
      ))}
    </div>
  );
}

function ChecklistRow({ task }: { task: Task }) {
  const [isPending, setIsPending] = useState(false);
  const [isCompleted, setIsCompleted] = useState(task.status === "concluida");
  const router = useRouter();

  async function handleToggle() {
    setIsPending(true);
    const next = !isCompleted;
    setIsCompleted(next);
    try {
      if (next) {
        const result = await taskActionsService.markComplete(task);
        if (result.recurred) setIsCompleted(false);
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
    <button
      onClick={handleToggle}
      disabled={isPending}
      className="flex w-full items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 text-left transition-colors hover:border-[var(--color-accent)]/60"
    >
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors",
          isCompleted ? "border-[var(--color-success)] bg-[var(--color-success)]" : "border-[var(--color-border)]"
        )}
      >
        {isCompleted && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
      </span>
      <span
        className={cn(
          "flex-1 truncate text-sm",
          isCompleted ? "text-[var(--color-ink-muted)] line-through" : "font-medium text-[var(--color-ink)]"
        )}
      >
        {task.title}
      </span>
    </button>
  );
}
