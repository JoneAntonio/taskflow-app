import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getTodayISO } from "@/lib/server-date";
import { PomodoroTimer } from "@/components/pomodoro/pomodoro-timer";
import { AgendaTimeline } from "@/components/pomodoro/agenda-timeline";
import type { Task } from "@/types/database";

export const metadata: Metadata = { title: "Pomodoro — JAFLOW" };

export default async function PomodoroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = await getTodayISO();

  const [{ data: tasks }, { data: todayTasks }] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, due_time, due_time_end, estimated_duration_minutes")
      .in("status", ["pendente", "em_progresso"])
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("tasks")
      .select("*")
      .eq("due_date", today)
      .in("status", ["pendente", "em_progresso"]),
  ]);

  return (
    <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Pomodoro</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Trabalho focado + pausa, calculados a partir da duração da tua atividade.
          </p>
        </div>
        <PomodoroTimer tasks={tasks ?? []} />
      </div>

      <div className="lg:pt-14">
        <AgendaTimeline tasks={(todayTasks ?? []) as Task[]} />
      </div>
    </div>
  );
}
