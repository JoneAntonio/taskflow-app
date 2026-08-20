"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Pause, Play, X } from "lucide-react";
import { usePomodoroStore, POMODORO_LABELS } from "@/lib/pomodoro-store";

export function PomodoroMiniWidget() {
  const store = usePomodoroStore();
  const pathname = usePathname();

  if (!store.isActive || pathname === "/pomodoro") return null;

  const minutes = Math.floor(store.secondsLeft / 60);
  const seconds = store.secondsLeft % 60;
  const totalSeconds =
    (store.plan ? store.plan[store.segmentIndex]?.minutes ?? 0 : store.customDurations[store.sessionType]) * 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - store.secondsLeft) / totalSeconds) * 100 : 0;

  return (
    <div className="fixed bottom-20 right-4 z-30 flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] py-1.5 pl-1.5 pr-3 shadow-[var(--shadow-lg)] lg:bottom-4">
      <Link href="/pomodoro" className="relative flex h-10 w-10 shrink-0 items-center justify-center">
        <svg viewBox="0 0 40 40" className="h-10 w-10 -rotate-90">
          <circle cx="20" cy="20" r="17" fill="none" stroke="var(--color-surface-alt)" strokeWidth="3" />
          <circle
            cx="20"
            cy="20"
            r="17"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 17}
            strokeDashoffset={2 * Math.PI * 17 * (1 - progress / 100)}
          />
        </svg>
        <span className="absolute font-mono-data text-[9px] font-semibold text-[var(--color-ink)]">
          {String(minutes).padStart(2, "0")}
        </span>
      </Link>
      <Link href="/pomodoro" className="flex flex-col leading-tight">
        <span className="font-mono-data text-sm font-semibold text-[var(--color-ink)]">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
        <span className="text-[10px] text-[var(--color-ink-muted)]">
          {POMODORO_LABELS[store.sessionType]}
          {store.selectedTaskTitle ? ` · ${store.selectedTaskTitle}` : ""}
        </span>
      </Link>
      <button
        onClick={() => (store.isRunning ? store.pause() : store.start())}
        aria-label={store.isRunning ? "Pausar" : "Continuar"}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-alt)] text-[var(--color-ink)] hover:bg-[var(--color-border)]"
      >
        {store.isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </button>
      <button
        onClick={() => store.reset()}
        aria-label="Terminar"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-danger)]"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
