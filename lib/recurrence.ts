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
    case "semanal": {
      const weekdays = recurrence.by_weekday;
      if (weekdays && weekdays.length > 0) {
        // Com dias específicos escolhidos, avança dia a dia até ao próximo
        // dia da semana marcado — permite "toda a segunda e quinta", por
        // exemplo, em vez de só um único dia fixo.
        for (let i = 0; i < 7; i++) {
          date.setDate(date.getDate() + 1);
          if (weekdays.includes(date.getDay())) break;
        }
        break;
      }
      date.setDate(date.getDate() + 7 * interval);
      break;
    }
    case "mensal": {
      const monthdays = recurrence.by_monthday;
      if (monthdays && monthdays.length > 0) {
        // Avança dia a dia (até 35 tentativas, cobre um mês inteiro) até
        // encontrar o próximo dia do mês escolhido — permite "dia 1 e 15",
        // por exemplo, em vez de só um único dia fixo.
        for (let i = 0; i < 35; i++) {
          date.setDate(date.getDate() + 1);
          if (monthdays.includes(date.getDate())) break;
        }
        break;
      }
      date.setMonth(date.getMonth() + interval);
      break;
    }
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
