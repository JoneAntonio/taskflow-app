import { toLocalISODate } from "@/lib/utils";
import type { Recurrence } from "@/types/database";

/**
 * Calcula a data da PRÓXIMA ocorrência a partir de uma data-base, segundo o
 * padrão de recorrência. Usado tanto para avançar uma tarefa recorrente ao
 * ser concluída, como para desenhar as ocorrências futuras no calendário.
 */
export function getNextOccurrenceDate(fromDate: string, recurrence: Recurrence): string {
  const date = new Date(fromDate + "T00:00:00");
  const interval = recurrence.interval && recurrence.interval > 0 ? recurrence.interval : 1;

  switch (recurrence.frequency) {
    case "diaria":
      date.setDate(date.getDate() + interval);
      break;
    case "dias_uteis": {
      let added = 0;
      while (added < interval) {
        date.setDate(date.getDate() + 1);
        const day = date.getDay();
        if (day !== 0 && day !== 6) added++;
      }
      break;
    }
    case "semanal":
      date.setDate(date.getDate() + 7 * interval);
      break;
    case "mensal":
      date.setMonth(date.getMonth() + interval);
      break;
    case "anual":
      date.setFullYear(date.getFullYear() + interval);
      break;
    case "personalizada": {
      const days = recurrence.by_weekday;
      if (!days || days.length === 0) return fromDate;
      // Avança dia a dia (até 7 tentativas) até encontrar o próximo dia da semana escolhido.
      for (let i = 0; i < 7; i++) {
        date.setDate(date.getDate() + 1);
        if (days.includes(date.getDay())) break;
      }
      break;
    }
    default:
      // Frequência desconhecida/não suportada — não avança, evita ciclos.
      return fromDate;
  }
  return toLocalISODate(date);
}

/**
 * Gera as datas em que uma tarefa recorrente também ocorre dentro de um
 * intervalo [rangeStart, rangeEnd] (inclusive, formato YYYY-MM-DD),
 * SEM criar linhas novas na base de dados — só para pré-visualização
 * (ex: pontos no calendário mostrando dias futuros da mesma recorrência).
 */
export function projectOccurrences(
  baseDate: string,
  recurrence: Recurrence,
  rangeStart: string,
  rangeEnd: string
): string[] {
  const dates: string[] = [];
  let current = baseDate;
  const until = recurrence.until;
  let guard = 0;

  while (current <= rangeEnd && guard < 400) {
    guard++;
    if (until && current > until) break;
    if (current >= rangeStart && current !== baseDate) {
      dates.push(current);
    }
    current = getNextOccurrenceDate(current, recurrence);
  }
  return dates;
}
