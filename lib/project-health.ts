import { computeSmartProgress } from "@/lib/smart-metrics";
import type { Project } from "@/types/database";

export type ProjectHealth = "no-prazo" | "em-risco" | "atrasado" | "sem-dados";

export const HEALTH_LABELS: Record<ProjectHealth, string> = {
  "no-prazo": "No prazo",
  "em-risco": "Em risco",
  atrasado: "Atrasado",
  "sem-dados": "Sem dados",
};

export const HEALTH_COLOR_VAR: Record<ProjectHealth, string> = {
  "no-prazo": "--color-success",
  "em-risco": "--color-warning",
  atrasado: "--color-danger",
  "sem-dados": "--color-ink-muted",
};

/**
 * Compara o tempo já decorrido do prazo com o progresso já feito, para
 * classificar a "saúde" do objetivo — a mesma lógica usada nos alertas
 * automáticos do cron, exposta aqui para o Dashboard também a usar.
 */
export function getProjectHealth(project: Project): { health: ProjectHealth; progress: number | null } {
  const progress = computeSmartProgress(
    project.current_value,
    project.target_value,
    project.actual_value,
    project.lower_is_better
  );

  if (progress === null || !project.target_date) return { health: "sem-dados", progress };
  if (progress >= 100) return { health: "no-prazo", progress };

  const start = new Date(project.created_at).getTime();
  const end = new Date(project.target_date + "T23:59:59").getTime();
  const now = Date.now();
  if (now > end) return { health: "atrasado", progress };

  const totalDuration = end - start;
  if (totalDuration <= 0) return { health: "sem-dados", progress };

  const elapsedRatio = (now - start) / totalDuration;
  const progressRatio = progress / 100;
  const behindBy = elapsedRatio - progressRatio;

  if (behindBy < 0.05) return { health: "no-prazo", progress };
  if (behindBy < 0.2) return { health: "em-risco", progress };
  return { health: "atrasado", progress };
}
