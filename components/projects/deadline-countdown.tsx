import { toLocalISODate } from "@/lib/utils";

const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

export function DeadlineCountdown({ targetDate }: { targetDate: string }) {
  const today = new Date();
  const todayISO = toLocalISODate(today);
  const target = new Date(targetDate + "T00:00:00");
  const daysLeft = Math.ceil((target.getTime() - new Date(todayISO + "T00:00:00").getTime()) / (1000 * 60 * 60 * 24));

  const year = target.getFullYear();
  const month = target.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay.getDay();
  const monthLabel = target.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });

  const cells: { day: number | null; date: string | null }[] = [];
  for (let i = 0; i < startOffset; i++) cells.push({ day: null, date: null });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, date: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
  }

  const isOverdue = daysLeft < 0;

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="mb-3 text-center">
        <p
          className="font-display text-3xl font-semibold"
          style={{ color: isOverdue ? "var(--color-danger)" : "var(--color-accent)" }}
        >
          {isOverdue ? `${Math.abs(daysLeft)}d atraso` : daysLeft === 0 ? "Hoje" : `${daysLeft} dias`}
        </p>
        <p className="text-xs text-[var(--color-ink-muted)]">{isOverdue ? "desde o prazo" : "até ao prazo do projeto"}</p>
      </div>
      <p className="mb-2 text-center text-xs font-medium capitalize text-[var(--color-ink)]">{monthLabel}</p>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((label, i) => (
          <div key={i} className="text-center text-[10px] text-[var(--color-ink-muted)]">
            {label}
          </div>
        ))}
        {cells.map((cell, index) => {
          if (!cell.day) return <div key={index} />;
          const isTarget = cell.date === targetDate;
          const isToday = cell.date === todayISO;
          return (
            <div
              key={index}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[11px]"
              style={
                isTarget
                  ? { backgroundColor: "var(--color-accent)", color: "var(--color-accent-ink)", fontWeight: 600 }
                  : isToday
                    ? { border: "1px solid var(--color-accent)", color: "var(--color-ink)" }
                    : { color: "var(--color-ink-muted)" }
              }
            >
              {cell.day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
