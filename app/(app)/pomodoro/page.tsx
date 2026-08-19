import type { Metadata } from "next";
import { PomodoroTimer } from "@/components/pomodoro/pomodoro-timer";

export const metadata: Metadata = { title: "Pomodoro — JAFLOW" };

export default function PomodoroPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Pomodoro</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          25 minutos de foco, 5 de pausa. Ajusta os tempos como preferires.
        </p>
      </div>
      <PomodoroTimer />
    </div>
  );
}
