"use client";

import { useEffect, useState } from "react";

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Painel de estado no fundo da barra lateral: relógio vivo e sincronização. */
export function SystemStatus() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="nx-panel mx-3 mb-4 rounded-xl border border-[var(--color-border)] px-3.5 py-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[11px] text-[var(--color-ink-muted)]">
          <span className="nx-live-dot" />
          Sincronizado
        </span>
        <span className="font-mono-data text-[11px] text-[var(--color-ink-muted)]">
          {now ? `${WEEKDAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]}` : "—"}
        </span>
      </div>
      <p className="font-mono-data mt-1.5 text-[22px] font-medium leading-none text-[var(--color-ink)]">
        {now ? `${pad(now.getHours())}:${pad(now.getMinutes())}` : "--:--"}
        <span className="text-[var(--color-ink-muted)]">{now ? `:${pad(now.getSeconds())}` : ""}</span>
      </p>
    </div>
  );
}
