"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EisenhowerTaskRow } from "@/components/eisenhower/eisenhower-task-row";
import { QuadrantQuickAdd } from "@/components/eisenhower/quadrant-quick-add";
import { taskActionsService } from "@/services/task-actions.service";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/database";

export function QuadrantCard({
  title,
  subtitle,
  accentVar,
  tasks,
  important,
  urgent,
  projectId,
}: {
  title: string;
  subtitle: string;
  accentVar: string;
  tasks: Task[];
  important: boolean;
  urgent: boolean;
  projectId?: string | null;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const router = useRouter();

  async function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setIsDragOver(false);
    const taskId = event.dataTransfer.getData("text/task-id");
    if (!taskId) return;

    try {
      await taskActionsService.moveToQuadrant(taskId, important, urgent);
      router.refresh();
    } catch {
      toast.error("Não foi possível mover a tarefa.");
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={cn("flex flex-col rounded-2xl border-2 p-4 transition-colors", isDragOver && "border-dashed")}
      style={{
        borderColor: isDragOver ? `var(${accentVar})` : `var(${accentVar})`,
        backgroundColor: isDragOver
          ? `color-mix(in srgb, var(${accentVar}) 14%, transparent)`
          : `color-mix(in srgb, var(${accentVar}) 6%, transparent)`,
      }}
    >
      <div className="mb-3">
        <p className="font-display text-sm font-semibold" style={{ color: `var(${accentVar})` }}>
          {title}
        </p>
        <p className="text-xs text-[var(--color-ink-muted)]">{subtitle}</p>
      </div>
      <div className="mb-2">
        <QuadrantQuickAdd important={important} urgent={urgent} placeholder="Adicionar tarefa aqui" projectId={projectId} />
      </div>
      <div className="flex-1 space-y-1.5">
        {tasks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--color-border)] px-3 py-4 text-center text-xs text-[var(--color-ink-muted)]">
            Sem tarefas aqui. Arrasta uma tarefa de outro quadrante para aqui.
          </p>
        ) : (
          tasks.map((task) => <EisenhowerTaskRow key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}
