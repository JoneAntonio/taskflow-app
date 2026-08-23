import { Flame } from "lucide-react";
import { TaskListItem } from "@/components/tasks/task-list-item";
import type { Task } from "@/types/database";

const PRIORITY_WEIGHT: Record<Task["priority"], number> = {
  urgente: 4,
  alta: 3,
  media: 2,
  baixa: 1,
  sem_prioridade: 0,
};

export function TopPriorityWidget({ tasks }: { tasks: Task[] }) {
  const top3 = [...tasks]
    .sort((a, b) => {
      const weightDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      if (weightDiff !== 0) return weightDiff;
      return (a.due_time ?? "99:99").localeCompare(b.due_time ?? "99:99");
    })
    .slice(0, 3);

  if (top3.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5 p-4">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]">
        <Flame className="h-3.5 w-3.5" /> Top 3 do dia — resolver primeiro
      </p>
      <div className="space-y-2">
        {top3.map((task) => (
          <TaskListItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
