import { cn, toLocalISODate } from "@/lib/utils";
import type { Task } from "@/types/database";

/**
 * Calcula o tempo até uma tarefa começar (ou o atraso), com código de
 * cores: vermelho (já passou), amarelo (falta menos de 60 min), verde
 * (falta mais de uma hora). Sem hora definida, mostra "Hoje"/"Amanhã"/
 * "Em X dias" em vez de tentar calcular minutos a partir de meia-noite.
 */
export function TaskCountdownBadge({ task }: { task: Task }) {
  if (!task.due_date) return null;

  const hasTime = !!task.due_time;

  if (!hasTime) {
    const todayISO = toLocalISODate(new Date());
    const dayDiff = Math.round(
      (new Date(task.due_date + "T00:00:00").getTime() - new Date(todayISO + "T00:00:00").getTime()) /
        (1000 * 60 * 60 * 24)
    );

    let label: string;
    let colorVar: string;
    if (dayDiff < 0) {
      label = `-${Math.abs(dayDiff)}d`;
      colorVar = "--color-danger";
    } else if (dayDiff === 0) {
      label = "Hoje";
      colorVar = "--color-warning";
    } else if (dayDiff === 1) {
      label = "Amanhã";
      colorVar = "--color-success";
    } else {
      label = `Em ${dayDiff}d`;
      colorVar = "--color-success";
    }

    return <Badge label={label} colorVar={colorVar} />;
  }

  const due = new Date(`${task.due_date}T${task.due_time}:00`);
  if (Number.isNaN(due.getTime())) return null;

  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  let label: string;
  let colorVar: string;

  if (diffMinutes < 0) {
    const overdueMinutes = Math.abs(diffMinutes);
    label = overdueMinutes < 60 ? `-${overdueMinutes}min` : `-${Math.round(overdueMinutes / 60)}h`;
    colorVar = "--color-danger";
  } else if (diffMinutes < 60) {
    label = `${diffMinutes}min`;
    colorVar = "--color-warning";
  } else if (diffMinutes < 24 * 60) {
    label = `${Math.round(diffMinutes / 60)}h`;
    colorVar = "--color-success";
  } else {
    label = `${Math.round(diffMinutes / (60 * 24))}d`;
    colorVar = "--color-success";
  }

  return <Badge label={label} colorVar={colorVar} />;
}

function Badge({ label, colorVar }: { label: string; colorVar: string }) {
  return (
    <span
      className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold")}
      style={{ color: `var(${colorVar})`, backgroundColor: `color-mix(in srgb, var(${colorVar}) 15%, transparent)` }}
    >
      {label}
    </span>
  );
}
