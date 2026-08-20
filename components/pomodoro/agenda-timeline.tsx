"use client";

import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import { PRIORITY_COLOR_VAR } from "@/lib/labels";
import type { Task } from "@/types/database";

export function AgendaTimeline({ tasks }: { tasks: Task[] }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const sorted = [...tasks]
    .filter((t) => t.due_time)
    .sort((a, b) => (a.due_time ?? "").localeCompare(b.due_time ?? ""));

  let nowInsertIndex = sorted.length;
  for (let i = 0; i < sorted.length; i++) {
    const [h, m] = sorted[i].due_time!.split(":").map(Number);
    if (h * 60 + m > nowMinutes) {
      nowInsertIndex = i;
      break;
    }
  }

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[var(--color-border)] px-4 py-10 text-center">
        <CalendarClock className="h-6 w-6 text-[var(--color-ink-muted)]" />
        <p className="text-sm text-[var(--color-ink-muted)]">Sem tarefas com hora marcada para hoje.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
        Agenda de hoje
      </p>
      <div className="space-y-0.5">
        {sorted.map((task, index) => (
          <div key={task.id}>
            {index === nowInsertIndex && <NowLine time={now} />}
            <div className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-[var(--color-surface-alt)]">
              <span className="w-10 shrink-0 font-mono-data text-xs text-[var(--color-ink-muted)]">
                {task.due_time}
              </span>
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: `var(${PRIORITY_COLOR_VAR[task.priority]})` }}
              />
              <span className="truncate text-sm text-[var(--color-ink)]">{task.title}</span>
            </div>
          </div>
        ))}
        {nowInsertIndex === sorted.length && <NowLine time={now} />}
      </div>
    </div>
  );
}

function NowLine({ time }: { time: Date }) {
  const label = time.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <span className="font-mono-data text-[10px] font-semibold text-[var(--color-danger)]">{label}</span>
      <div className="h-0.5 flex-1 rounded-full bg-[var(--color-danger)]" />
    </div>
  );
}
