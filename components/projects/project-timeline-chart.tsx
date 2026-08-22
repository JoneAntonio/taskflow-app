import { PRIORITY_COLOR_VAR } from "@/lib/labels";
import type { Project, Task } from "@/types/database";

export function ProjectTimelineChart({ project, tasks }: { project: Project; tasks: Task[] }) {
  const hasSmart = project.objective || project.success_metric || project.target_date;
  if (!hasSmart) return null;

  const startDate = new Date(project.created_at);
  const endDate = project.target_date ? new Date(project.target_date + "T23:59:59") : new Date();
  const totalMs = endDate.getTime() - startDate.getTime();

  const completedTasks = tasks
    .filter((t) => t.status === "concluida" && t.completed_at)
    .map((t) => ({ task: t, completedAt: new Date(t.completed_at as string) }))
    .sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime());

  const trackWidth = 640;
  const dots = completedTasks.map(({ task, completedAt }) => {
    const ratio = totalMs > 0 ? (completedAt.getTime() - startDate.getTime()) / totalMs : 0;
    const clamped = Math.max(0, Math.min(1, ratio));
    return {
      task,
      x: 20 + clamped * (trackWidth - 40),
      label: `${task.title} — concluída em ${completedAt.toLocaleString("pt-PT", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      color: `var(${PRIORITY_COLOR_VAR[task.priority]})`,
    };
  });

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
        Linha temporal do objetivo
      </p>
      <p className="mb-4 text-xs text-[var(--color-ink-muted)]">
        Cada ponto é uma tarefa concluída, posicionada no exato momento em que a terminaste.
      </p>

      {completedTasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-sm text-[var(--color-ink-muted)]">
          Ainda sem tarefas concluídas neste projeto.
        </p>
      ) : (
        <svg viewBox={`0 0 ${trackWidth} 70`} className="w-full" role="img" aria-label="Linha temporal de tarefas concluídas">
          <line x1={20} y1={35} x2={trackWidth - 20} y2={35} stroke="var(--color-border)" strokeWidth={2} />
          {dots.map(({ task, x, label, color }) => (
            <circle key={task.id} cx={x} cy={35} r={6} fill={color} stroke="var(--color-surface)" strokeWidth={2}>
              <title>{label}</title>
            </circle>
          ))}
        </svg>
      )}

      <div className="mt-2 flex justify-between text-[11px] text-[var(--color-ink-muted)]">
        <span>{startDate.toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}</span>
        <span>
          {project.target_date
            ? `Prazo: ${endDate.toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}`
            : "Hoje"}
        </span>
      </div>
    </div>
  );
}
