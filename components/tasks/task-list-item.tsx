import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIORITY_COLOR_VAR } from "@/lib/labels";
import type { Task } from "@/types/database";

export function TaskListItem({ task }: { task: Task }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 transition-colors hover:border-[var(--color-accent)]/60">
      <Circle
        className="h-4 w-4 shrink-0"
        style={{ color: `var(${PRIORITY_COLOR_VAR[task.priority]})` }}
        strokeWidth={2.5}
      />
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium text-[var(--color-ink)]")}>{task.title}</p>
        {(task.due_date || task.due_time) && (
          <p className="text-xs text-[var(--color-ink-muted)]">
            {task.due_date}
            {task.due_time ? ` · ${task.due_time}` : ""}
          </p>
        )}
      </div>
    </div>
  );
}
