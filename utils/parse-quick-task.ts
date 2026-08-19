import type { TaskPriority } from "@/types/database";

export interface ParsedQuickTask {
  title: string;
  tagNames: string[];
  priority: TaskPriority | null;
  dueDate: string | null; // YYYY-MM-DD
  dueTime: string | null; // HH:mm
}

const PRIORITY_MAP: Record<string, TaskPriority> = {
  urgente: "urgente",
  alta: "alta",
  media: "media",
  média: "media",
  baixa: "baixa",
};

const WEEKDAYS = [
  "domingo",
  "segunda",
  "terça",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
  "sabado",
];

/**
 * Interpreta texto livre escrito na entrada rápida da Inbox, ex:
 * "Reunião amanhã às 14h #trabalho !alta"
 * → título limpo + etiquetas + prioridade + data/hora quando reconhecíveis.
 *
 * Implementação leve baseada em expressões regulares, pensada para ser
 * substituída futuramente por um serviço de IA (ver arquitetura para IA).
 */
export function parseQuickTask(input: string, referenceDate = new Date()): ParsedQuickTask {
  let text = input.trim();
  const tagNames: string[] = [];
  let priority: TaskPriority | null = null;
  let dueDate: string | null = null;
  let dueTime: string | null = null;

  // Etiquetas: #trabalho, #estudo...
  text = text.replace(/#(\p{L}[\p{L}0-9_-]*)/gu, (_, tag) => {
    tagNames.push(tag.toLowerCase());
    return "";
  });

  // Prioridade: !alta, !urgente...
  text = text.replace(/!(\p{L}+)/gu, (match, word) => {
    const key = word.toLowerCase();
    if (PRIORITY_MAP[key]) {
      priority = PRIORITY_MAP[key];
      return "";
    }
    return match;
  });

  // Hora: "14h", "14h30", "às 14:00"
  const timeMatch = text.match(/\b(\d{1,2})[h:](\d{2})?\b/i);
  if (timeMatch) {
    const hours = timeMatch[1].padStart(2, "0");
    const minutes = (timeMatch[2] ?? "00").padStart(2, "0");
    dueTime = `${hours}:${minutes}`;
    text = text.replace(timeMatch[0], "");
  }

  // Data relativa: hoje / amanhã
  if (/\bhoje\b/i.test(text)) {
    dueDate = toISODate(referenceDate);
    text = text.replace(/\bhoje\b/i, "");
  } else if (/\bamanh[ãa]\b/i.test(text)) {
    const tomorrow = new Date(referenceDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    dueDate = toISODate(tomorrow);
    text = text.replace(/\bamanh[ãa]\b/i, "");
  } else {
    const weekdayMatch = WEEKDAYS.find((day) => new RegExp(`\\b${day}\\b`, "i").test(text));
    if (weekdayMatch) {
      dueDate = toISODate(nextWeekday(referenceDate, weekdayMatch));
      text = text.replace(new RegExp(`\\b${weekdayMatch}(-feira)?\\b`, "i"), "");
    }
  }

  // Limpa conectores soltos ("às", "a", espaços duplicados)
  text = text
    .replace(/\bàs\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return { title: text, tagNames, priority, dueDate, dueTime };
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function nextWeekday(from: Date, weekdayName: string): Date {
  const normalized = weekdayName.replace("ç", "c");
  const index = WEEKDAYS.findIndex((d) => d.replace("ç", "c") === normalized);
  const targetIndex = index >= 7 ? index - 7 : index; // agrupa "terça"/"terca", "sábado"/"sabado"
  const result = new Date(from);
  const diff = (targetIndex + 7 - result.getDay()) % 7 || 7;
  result.setDate(result.getDate() + diff);
  return result;
}
