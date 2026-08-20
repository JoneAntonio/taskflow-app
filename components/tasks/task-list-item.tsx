import { Circle, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIORITY_COLOR_VAR } from "@/lib/labels";
import { TaskCountdownBadge } from "@/components/tasks/task-countdown-badge";
import type { Task } from "@/types/database";

export function TaskListItem({ task, compact = false }: { task: Task; compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] transition-colors hover:border-[var(--color-accent)]/60",
        compact ? "px-3 py-2" : "px-4 py-3"
      )}
    >
      <Circle
        className="h-4 w-4 shrink-0"
        style={{ color: `var(${PRIORITY_COLOR_VAR[task.priority]})` }}
        strokeWidth={2.5}
      />
      <div className="min-w-0 flex-1">
        <p className={cn("truncate font-medium text-[var(--color-ink)]", compact ? "text-sm" : "text-sm")}>
          {task.title}
        </p>
        {!compact && (task.due_date || task.due_time) && (
          <p className="flex items-center gap-1 text-xs text-[var(--color-ink-muted)]">
            {task.due_date}
            {task.due_time ? ` · ${task.due_time}` : ""}
            {task.due_time_end ? `–${task.due_time_end}` : ""}
            {task.recurrence && <Repeat className="h-3 w-3" />}
          </p>
        )}
      </div>
      <TaskCountdownBadge task={task} />
    </div>
  );
}
