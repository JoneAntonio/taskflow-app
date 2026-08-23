import { Target, User, Flag, Wrench } from "lucide-react";
import { PRIORITY_LABELS, PRIORITY_COLOR_VAR } from "@/lib/labels";
import { computeSmartProgress } from "@/lib/smart-metrics";
import type { Project } from "@/types/database";

export function ProjectSmartCard({
  project,
  taskProgress,
}: {
  project: Project;
  taskProgress: { total: number; completed: number };
}) {
  const hasSmart = project.objective || project.success_metric || project.target_date;
  if (!hasSmart) return null;

  const valueProgress = computeSmartProgress(
    project.current_value,
    project.target_value,
    project.actual_value,
    project.lower_is_better
  );
  const unit = project.metric_unit ? ` ${project.metric_unit}` : "";
  const actualDisplay = project.actual_value ?? project.current_value;
  const taskPercentage = taskProgress.total > 0 ? Math.round((taskProgress.completed / taskProgress.total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
        🎯 Objetivo SMART
      </p>
      {project.objective && <p className="mb-3 text-sm font-medium text-[var(--color-ink)]">{project.objective}</p>}

      {project.success_metric && (
        <div className="mb-3 rounded-xl bg-[var(--color-surface-alt)] p-3">
          <p className="mb-1 flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <Target className="h-3.5 w-3.5" /> Métrica de sucesso
          </p>
          <p className="text-sm text-[var(--color-ink)]">{project.success_metric}</p>
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        {project.responsible && (
          <span className="flex items-center gap-1.5 rounded-full bg-[var(--color-surface-alt)] px-2.5 py-1 text-[var(--color-ink)]">
            <User className="h-3 w-3" /> {project.responsible}
          </span>
        )}
        {project.smart_priority && project.smart_priority !== "sem_prioridade" && (
          <span
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{
              backgroundColor: `color-mix(in srgb, var(${PRIORITY_COLOR_VAR[project.smart_priority]}) 15%, transparent)`,
              color: `var(${PRIORITY_COLOR_VAR[project.smart_priority]})`,
            }}
          >
            <Flag className="h-3 w-3" /> {PRIORITY_LABELS[project.smart_priority]}
          </span>
        )}
      </div>

      {project.action_plan && (
        <div className="mb-3 rounded-xl bg-[var(--color-surface-alt)] p-3">
          <p className="mb-1 flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <Wrench className="h-3.5 w-3.5" /> Plano de ação
          </p>
          <p className="text-sm text-[var(--color-ink)]">{project.action_plan}</p>
        </div>
      )}

      <div className="space-y-3">
        {valueProgress !== null && (
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-[var(--color-ink-muted)]">
                📍 {project.current_value}
                {unit} → 📈 {actualDisplay}
                {unit} → 🏆 {project.target_value}
                {unit}
              </span>
              <span className="font-mono-data font-medium text-[var(--color-ink)]">{valueProgress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-alt)]">
              <div
                className="h-full rounded-full bg-[var(--color-accent)] transition-[width]"
                style={{ width: `${valueProgress}%` }}
              />
            </div>
          </div>
        )}

        {taskProgress.total > 0 && (
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-[var(--color-ink-muted)]">
                Tarefas concluídas ({taskProgress.completed} de {taskProgress.total})
              </span>
              <span className="font-mono-data font-medium text-[var(--color-ink)]">{taskPercentage}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-alt)]">
              <div
                className="h-full rounded-full bg-[var(--color-secondary)] transition-[width]"
                style={{ width: `${taskPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
