import type { TaskPriority, Recurrence, RecurrenceFrequency } from "@/types/database";

export interface ParsedQuickTask {
  title: string;
  tagNames: string[];
  priority: TaskPriority | null;
  dueDate: string | null; // YYYY-MM-DD
  dueTime: string | null; // HH:mm
  dueTimeEnd: string | null; // HH:mm
  recurrence: Recurrence | null;
  /** Posições (no texto original) reconhecidas, para realce visual em tempo real. */
  segments: QuickTaskSegment[];
}

export type QuickTaskSegmentType = "tag" | "priority" | "date" | "time" | "recurrence";

export interface QuickTaskSegment {
  start: number;
  end: number;
  type: QuickTaskSegmentType;
}

const PRIORITY_MAP: Record<string, TaskPriority> = {
  urgente: "urgente",
  alta: "alta",
  media: "media",
  média: "media",
  baixa: "baixa",
};

const WEEKDAYS = ["domingo", "segunda", "terça", "terca", "quarta", "quinta", "sexta", "sábado", "sabado"];
const WEEKDAY_INDEX: Record<string, number> = {
  domingo: 0,
  segunda: 1,
  terça: 2,
  terca: 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sábado: 6,
  sabado: 6,
};

interface RawMatch {
  start: number;
  end: number;
  type: QuickTaskSegmentType;
  apply: (state: ParserState) => void;
}

interface ParserState {
  tagNames: string[];
  priority: TaskPriority | null;
  dueDate: string | null;
  dueTime: string | null;
  dueTimeEnd: string | null;
  recurrence: Recurrence | null;
}

/**
 * Interpreta texto livre escrito na entrada rápida, ao estilo TickTick:
 * "Reunião das 14h às 16h toda sexta-feira #trabalho !alta"
 * → título limpo + etiquetas + prioridade + data/hora/intervalo + recorrência.
 *
 * Devolve também `segments` com as posições reconhecidas no texto ORIGINAL,
 * para permitir realçar visualmente enquanto o utilizador escreve.
 */
export function parseQuickTask(input: string, referenceDate = new Date()): ParsedQuickTask {
  const matches: RawMatch[] = [];

  function addMatch(start: number, end: number, type: QuickTaskSegmentType, apply: (s: ParserState) => void) {
    // Evita sobreposição com um match já aceite
    const overlaps = matches.some((m) => start < m.end && end > m.start);
    if (!overlaps) matches.push({ start, end, type, apply });
  }

  // --- Etiquetas: #trabalho, #estudo ---
  for (const m of input.matchAll(/#(\p{L}[\p{L}0-9_-]*)/gu)) {
    const tag = m[1].toLowerCase();
    addMatch(m.index!, m.index! + m[0].length, "tag", (s) => s.tagNames.push(tag));
  }

  // --- Prioridade: !alta, !urgente ---
  for (const m of input.matchAll(/!(\p{L}+)/gu)) {
    const key = m[1].toLowerCase();
    if (PRIORITY_MAP[key]) {
      addMatch(m.index!, m.index! + m[0].length, "priority", (s) => (s.priority = PRIORITY_MAP[key]));
    }
  }

  // --- Recorrência por texto ---
  const recurrenceRules: { regex: RegExp; build: (m: RegExpMatchArray) => Recurrence }[] = [
    {
      regex: /\btodos\s+os\s+dias\s+úteis\b|\bdias\s+úteis\b/giu,
      build: () => ({ frequency: "dias_uteis", interval: 1, by_weekday: null, until: null }),
    },
    {
      regex: /\btodos\s+os\s+dias\b|\bdiariamente\b/giu,
      build: () => ({ frequency: "diaria", interval: 1, by_weekday: null, until: null }),
    },
    {
      regex: /\btod[ao]s?\s+(?:as\s+)?(domingo|segunda|terça|terca|quarta|quinta|sexta|sábado|sabado)s?(?:-feiras?)?\b/giu,
      build: (m) => ({
        frequency: "semanal",
        interval: 1,
        by_weekday: [WEEKDAY_INDEX[m[1].toLowerCase()]],
        until: null,
      }),
    },
    {
      regex: /\btodas\s+as\s+semanas\b|\bsemanalmente\b/giu,
      build: () => ({ frequency: "semanal", interval: 1, by_weekday: null, until: null }),
    },
    {
      regex: /\btodos\s+os\s+meses\b|\bmensalmente\b/giu,
      build: () => ({ frequency: "mensal", interval: 1, by_weekday: null, until: null }),
    },
    {
      regex: /\btodos\s+os\s+anos\b|\banualmente\b/giu,
      build: () => ({ frequency: "anual", interval: 1, by_weekday: null, until: null }),
    },
  ];
  for (const rule of recurrenceRules) {
    for (const m of input.matchAll(rule.regex)) {
      const recurrence = rule.build(m);
      addMatch(m.index!, m.index! + m[0].length, "recurrence", (s) => (s.recurrence = recurrence));
    }
  }

  // --- Intervalo de horário: "das 14h às 16h", "14h-16h" ---
  const rangeRegex = /\bdas?\s*(\d{1,2})[h:](\d{2})?\s*(?:às|as|-)\s*(\d{1,2})[h:](\d{2})?\b/giu;
  for (const m of input.matchAll(rangeRegex)) {
    const startTime = `${m[1].padStart(2, "0")}:${(m[2] ?? "00").padStart(2, "0")}`;
    const endTime = `${m[3].padStart(2, "0")}:${(m[4] ?? "00").padStart(2, "0")}`;
    addMatch(m.index!, m.index! + m[0].length, "time", (s) => {
      s.dueTime = startTime;
      s.dueTimeEnd = endTime;
    });
  }

  // --- Hora única: "14h", "14h30", "às 14:00" ---
  for (const m of input.matchAll(/\b(\d{1,2})[h:](\d{2})?\b/giu)) {
    const time = `${m[1].padStart(2, "0")}:${(m[2] ?? "00").padStart(2, "0")}`;
    addMatch(m.index!, m.index! + m[0].length, "time", (s) => {
      if (!s.dueTime) s.dueTime = time;
    });
  }

  // --- Datas relativas: "daqui a 3 dias", "em 2 semanas" ---
  for (const m of input.matchAll(/\b(?:daqui\s+a|em)\s+(\d+)\s+(dias?|semanas?|meses)\b/giu)) {
    const amount = Number(m[1]);
    const unit = m[2].toLowerCase();
    const date = new Date(referenceDate);
    if (unit.startsWith("dia")) date.setDate(date.getDate() + amount);
    else if (unit.startsWith("semana")) date.setDate(date.getDate() + amount * 7);
    else date.setMonth(date.getMonth() + amount);
    const iso = toISODate(date);
    addMatch(m.index!, m.index! + m[0].length, "date", (s) => (s.dueDate = iso));
  }

  // --- Hoje / amanhã ---
  for (const m of input.matchAll(/\bhoje\b/giu)) {
    const iso = toISODate(referenceDate);
    addMatch(m.index!, m.index! + m[0].length, "date", (s) => (s.dueDate = iso));
  }
  for (const m of input.matchAll(/(?<![\p{L}\d])amanh[ãa](?![\p{L}\d])/giu)) {
    const tomorrow = new Date(referenceDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const iso = toISODate(tomorrow);
    addMatch(m.index!, m.index! + m[0].length, "date", (s) => (s.dueDate = iso));
  }

  // --- "próxima sexta" / "sexta que vem" / dia da semana simples ---
  const weekdayPattern = new RegExp(
    `\\b(?:pr[oó]xim[ao]\\s+)?(${WEEKDAYS.join("|")})(?:-feira)?(?:\\s+que\\s+vem)?\\b`,
    "giu"
  );
  for (const m of input.matchAll(weekdayPattern)) {
    const iso = toISODate(nextWeekday(referenceDate, m[1].toLowerCase()));
    addMatch(m.index!, m.index! + m[0].length, "date", (s) => (s.dueDate = iso));
  }

  // Aplica os matches (ordenados) ao estado
  const state: ParserState = {
    tagNames: [],
    priority: null,
    dueDate: null,
    dueTime: null,
    dueTimeEnd: null,
    recurrence: null,
  };
  const ordered = [...matches].sort((a, b) => a.start - b.start);
  ordered.forEach((m) => m.apply(state));

  // Constrói o título removendo os trechos reconhecidos, de trás para a frente
  let title = input;
  [...ordered].sort((a, b) => b.start - a.start).forEach((m) => {
    title = title.slice(0, m.start) + title.slice(m.end);
  });
  title = title
    .replace(/(?<![\p{L}\d])às(?![\p{L}\d])/giu, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return {
    title,
    tagNames: state.tagNames,
    priority: state.priority,
    dueDate: state.dueDate,
    dueTime: state.dueTime,
    dueTimeEnd: state.dueTimeEnd,
    recurrence: state.recurrence,
    segments: ordered.map(({ start, end, type }) => ({ start, end, type })),
  };
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function nextWeekday(from: Date, weekdayName: string): Date {
  const normalized = weekdayName.replace("ç", "c");
  const index = WEEKDAYS.findIndex((d) => d.replace("ç", "c") === normalized);
  const targetIndex = index >= 7 ? index - 7 : index;
  const result = new Date(from);
  const diff = (targetIndex + 7 - result.getDay()) % 7 || 7;
  result.setDate(result.getDate() + diff);
  return result;
}

export const RECURRENCE_LABELS: Record<NonNullable<RecurrenceFrequency>, string> = {
  diaria: "Todos os dias",
  dias_uteis: "Dias úteis",
  semanal: "Semanalmente",
  mensal: "Mensalmente",
  anual: "Anualmente",
  personalizada: "Personalizado",
};
