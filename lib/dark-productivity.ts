import type { TaskPriority } from "@/types/database";

export type CategoryColor = "orange" | "blue" | "red";

/**
 * Mapeia a prioridade da tarefa para uma das 3 cores de categoria do
 * estilo "Dark Productivity": laranja (formação/estratégia/prioridade
 * média), azul (processos/administrativo), vermelho (crítico/urgente).
 */
export const PRIORITY_TO_CATEGORY_COLOR: Record<TaskPriority, CategoryColor> = {
  urgente: "red",
  alta: "orange",
  media: "blue",
  baixa: "blue",
  sem_prioridade: "blue",
};

export const CATEGORY_COLOR_HEX: Record<CategoryColor, string> = {
  orange: "#F59E0B",
  blue: "#3B82F6",
  red: "#EF4444",
};

/** Formata minutos como "43M", "2H" ou "2H30M", para o texto de duração. */
export function formatDurationText(minutes: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  if (minutes < 60) return `${minutes}M`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}H` : `${hours}H${rest}M`;
}
