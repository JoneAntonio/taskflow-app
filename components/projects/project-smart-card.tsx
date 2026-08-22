import { Target } from "lucide-react";
import type { Project } from "@/types/database";

function calculateProgress(project: Project): number | null {
  if (project.current_value == null || project.target_value == null) return null;
  const { current_value: current, target_value: target, lower_is_better: lowerIsBetter } = project;

  if (lowerIsBetter) {
    // Ex: TMA atual 6.2, alvo 4 → progresso conforme te aproximas do alvo, a partir de um ponto de partida indefinido.
    // Sem "valor inicial" guardado, aproximamos: 0% se ainda estás no valor atual (>=target já seria 100%).
    if (current <= target) return 100;
    if (current <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((target / current) * 100)));
  }
  if (target === 0) return current > 0 ? 100 : 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

export function ProjectSmartCard({
  project,
  taskProgress,
}: {
  project: Project;
  taskProgress: { total: number; completed: number };
}) {
  const hasSmart = project.objective || project.success_metric || project.target_date;
  if (!hasSmart) return null;

  const valueProgress = calculateProgress(project);
  const taskPercentage = taskProgress.total > 0 ? Math.round((taskProgress.completed / taskProgress.total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
        Objetivo SMART
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

      <div className="space-y-3">
        {valueProgress !== null && (
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-[var(--color-ink-muted)]">
                Progresso do valor ({project.current_value} → {project.target_value})
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
