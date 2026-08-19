import { EisenhowerTaskRow } from "@/components/eisenhower/eisenhower-task-row";
import type { Task } from "@/types/database";

export function QuadrantCard({
  title,
  subtitle,
  accentVar,
  tasks,
}: {
  title: string;
  subtitle: string;
  accentVar: string;
  tasks: Task[];
}) {
  return (
    <div
      className="flex flex-col rounded-2xl border p-4"
      style={{ borderColor: `var(${accentVar})`, backgroundColor: `color-mix(in srgb, var(${accentVar}) 6%, transparent)` }}
    >
      <div className="mb-3">
        <p className="font-display text-sm font-semibold" style={{ color: `var(${accentVar})` }}>
          {title}
        </p>
        <p className="text-xs text-[var(--color-ink-muted)]">{subtitle}</p>
      </div>
      <div className="flex-1 space-y-1.5">
        {tasks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--color-border)] px-3 py-4 text-center text-xs text-[var(--color-ink-muted)]">
            Sem tarefas aqui.
          </p>
        ) : (
          tasks.map((task) => <EisenhowerTaskRow key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}
