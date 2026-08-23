import { Gauge } from "lucide-react";

interface PerformanceInfo {
  message: string;
  colorVar: string;
}

function getPerformanceMessage(weekCompleted: number, overdueCount: number): PerformanceInfo {
  const denominator = weekCompleted + overdueCount;
  const rate = denominator > 0 ? Math.round((weekCompleted / denominator) * 100) : weekCompleted > 0 ? 100 : 0;

  if (overdueCount > 0 && rate < 50) {
    return {
      message: `Tens ${overdueCount} tarefa${overdueCount > 1 ? "s" : ""} atrasada${overdueCount > 1 ? "s" : ""}. Vale a pena reorganizar as prioridades.`,
      colorVar: "--color-danger",
    };
  }
  if (rate >= 80) {
    return {
      message: `Excelente ritmo! Já concluíste ${weekCompleted} tarefas esta semana.`,
      colorVar: "--color-success",
    };
  }
  if (rate >= 50) {
    return {
      message: `Boa cadência! ${weekCompleted} tarefas concluídas esta semana, a manter o ritmo.`,
      colorVar: "--color-accent",
    };
  }
  return {
    message:
      weekCompleted > 0
        ? "Início de semana — ainda há tempo para acelerares o ritmo."
        : "Ainda sem tarefas concluídas esta semana. Bora começar!",
    colorVar: "--color-ink-muted",
  };
}

export function PerformanceCard({ weekCompleted, overdueCount }: { weekCompleted: number; overdueCount: number }) {
  const { message, colorVar } = getPerformanceMessage(weekCompleted, overdueCount);

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
        <Gauge className="h-3.5 w-3.5" /> Desempenho
      </p>
      <p className="text-sm font-medium" style={{ color: `var(${colorVar})` }}>
        {message}
      </p>
    </div>
  );
}
