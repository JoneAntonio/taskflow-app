import { TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { Project, Task } from "@/types/database";

type ForecastStatus = "no-data" | "on-track" | "at-risk" | "behind" | "done";

interface Forecast {
  status: ForecastStatus;
  estimatedDate: Date | null;
  weeklyPaceCurrent: number;
  weeklyPaceNeeded: number | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function computeForecast(project: Project, tasks: Task[]): Forecast | null {
  if (!project.target_date || tasks.length === 0) return null;

  const completed = tasks.filter((t) => t.status === "concluida" && t.completed_at);
  if (completed.length === tasks.length) {
    return { status: "done", estimatedDate: null, weeklyPaceCurrent: 0, weeklyPaceNeeded: null };
  }

  const start = new Date(project.created_at).getTime();
  const now = Date.now();
  const daysElapsed = Math.max(1, (now - start) / DAY_MS);
  const velocityPerDay = completed.length / daysElapsed;
  const weeklyPaceCurrent = velocityPerDay * 7;

  const remaining = tasks.length - completed.length;
  const targetDate = new Date(project.target_date + "T23:59:59").getTime();
  const weeksRemaining = Math.max(0.1, (targetDate - now) / (DAY_MS * 7));
  const weeklyPaceNeeded = remaining / weeksRemaining;

  if (velocityPerDay <= 0) {
    return { status: "no-data", estimatedDate: null, weeklyPaceCurrent: 0, weeklyPaceNeeded };
  }

  const daysToFinish = remaining / velocityPerDay;
  const estimatedDate = new Date(now + daysToFinish * DAY_MS);
  const diffDays = (estimatedDate.getTime() - targetDate) / DAY_MS;

  const status: ForecastStatus = diffDays <= 0 ? "on-track" : diffDays <= 7 ? "at-risk" : "behind";
  return { status, estimatedDate, weeklyPaceCurrent, weeklyPaceNeeded };
}

const STATUS_CONFIG: Record<ForecastStatus, { label: string; colorVar: string; icon: typeof CheckCircle2 }> = {
  done: { label: "Concluído", colorVar: "--color-success", icon: CheckCircle2 },
  "on-track": { label: "A tempo", colorVar: "--color-success", icon: CheckCircle2 },
  "at-risk": { label: "Em risco", colorVar: "--color-warning", icon: AlertTriangle },
  behind: { label: "Atrasado", colorVar: "--color-danger", icon: AlertTriangle },
  "no-data": { label: "Ainda sem dados suficientes", colorVar: "--color-ink-muted", icon: TrendingUp },
};

export function ProjectForecastCard({ project, tasks }: { project: Project; tasks: Task[] }) {
  const forecast = computeForecast(project, tasks);
  if (!forecast) return null;

  const config = STATUS_CONFIG[forecast.status];
  const Icon = config.icon;

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
        <TrendingUp className="h-3.5 w-3.5" /> Previsão
      </p>

      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0" style={{ color: `var(${config.colorVar})` }} />
        <span className="text-sm font-medium" style={{ color: `var(${config.colorVar})` }}>
          {config.label}
        </span>
      </div>

      {forecast.status === "no-data" && (
        <p className="text-xs text-[var(--color-ink-muted)]">
          Conclui pelo menos uma tarefa para começarmos a calcular o teu ritmo real.
        </p>
      )}

      {forecast.estimatedDate && forecast.status !== "done" && (
        <p className="text-xs text-[var(--color-ink-muted)]">
          Ao ritmo atual ({forecast.weeklyPaceCurrent.toFixed(1)} tarefas/semana), a conclusão prevista é{" "}
          <span className="font-medium text-[var(--color-ink)]">
            {forecast.estimatedDate.toLocaleDateString("pt-PT", { day: "numeric", month: "long" })}
          </span>
          .
        </p>
      )}

      {forecast.weeklyPaceNeeded !== null && forecast.status !== "on-track" && forecast.status !== "done" && (
        <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
          Precisas de concluir{" "}
          <span className="font-medium text-[var(--color-ink)]">
            {Math.ceil(forecast.weeklyPaceNeeded)} {Math.ceil(forecast.weeklyPaceNeeded) === 1 ? "tarefa" : "tarefas"} por
            semana
          </span>{" "}
          para cumprires o prazo.
        </p>
      )}
    </div>
  );
}
