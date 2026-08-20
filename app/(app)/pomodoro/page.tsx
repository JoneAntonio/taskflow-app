import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PomodoroTimer } from "@/components/pomodoro/pomodoro-timer";

export const metadata: Metadata = { title: "Pomodoro — JAFLOW" };

export default async function PomodoroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title")
    .in("status", ["pendente", "em_progresso"])
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Pomodoro</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          25 minutos de foco, 5 de pausa. Ajusta os tempos como preferires, e associa a uma tarefa se quiseres.
        </p>
      </div>
      <PomodoroTimer tasks={tasks ?? []} />
    </div>
  );
}
