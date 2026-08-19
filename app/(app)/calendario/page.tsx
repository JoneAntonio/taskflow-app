import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import type { Task } from "@/types/database";

export const metadata: Metadata = { title: "Calendário — JAFLOW" };

export default async function CalendarioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .not("due_date", "is", null)
    .in("status", ["pendente", "em_progresso"]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Calendário</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">Clica num dia para veres as tarefas agendadas.</p>
      </div>
      <CalendarGrid tasks={(tasks ?? []) as Task[]} />
    </div>
  );
}
