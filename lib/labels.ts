import type { TaskPriority, TaskStatus } from "@/types/database";

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  sem_prioridade: "Sem prioridade",
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

export const PRIORITY_COLOR_VAR: Record<TaskPriority, string> = {
  sem_prioridade: "--color-priority-none",
  baixa: "--color-priority-baixa",
  media: "--color-priority-media",
  alta: "--color-priority-alta",
  urgente: "--color-priority-urgente",
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pendente: "Pendente",
  em_progresso: "Em progresso",
  concluida: "Concluída",
  arquivada: "Arquivada",
};
