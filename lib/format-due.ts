const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "Hoje · 10:30", "Amanhã", "Ontem · 17:00", "sex 31 out" — compacto e legível. */
export function formatDueLabel(date?: string | null, time?: string | null, timeEnd?: string | null): string {
  const hhmm = (t?: string | null) => (t ? t.slice(0, 5) : "");
  let label = "";
  if (date) {
    const today = new Date();
    const offset = (n: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() + n);
      return ymd(d);
    };
    if (date === offset(0)) label = "Hoje";
    else if (date === offset(1)) label = "Amanhã";
    else if (date === offset(-1)) label = "Ontem";
    else {
      const [y, m, d] = date.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      label = `${WEEKDAYS[dt.getDay()]} ${d} ${MONTHS[m - 1]}${y !== today.getFullYear() ? ` ${y}` : ""}`;
    }
  }
  if (time) label += `${label ? " · " : ""}${hhmm(time)}${timeEnd ? `–${hhmm(timeEnd)}` : ""}`;
  return label;
}
