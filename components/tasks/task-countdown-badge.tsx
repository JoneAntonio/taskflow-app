import { cn } from "@/lib/utils";
import type { Task } from "@/types/database";

/**
 * Calcula o tempo até uma tarefa começar (ou o atraso), com código de
 * cores: vermelho (já passou), amarelo (falta menos de 60 min), verde
 * (falta mais de uma hora).
 */
export function TaskCountdownBadge({ task }: { task: Task }) {
  if (!task.due_date) return null;

  const due = new Date(`${task.due_date}T${task.due_time ?? "23:59"}:00`);
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

  return (
    <span
      className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold")}
      style={{ color: `var(${colorVar})`, backgroundColor: `color-mix(in srgb, var(${colorVar}) 15%, transparent)` }}
    >
      {label}
    </span>
  );
}
