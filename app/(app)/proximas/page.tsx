import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getTodayISO } from "@/lib/server-date";
import { ProximasView } from "@/components/tasks/proximas-view";
import type { Task, Project } from "@/types/database";

export const metadata: Metadata = { title: "Próximas — JAFLOW" };

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function ProximasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const todayISO = await getTodayISO();
  const today = new Date(todayISO + "T00:00:00");
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + (7 - today.getDay()));
  const endOfNextWeek = new Date(endOfWeek);
  endOfNextWeek.setDate(endOfNextWeek.getDate() + 7);
  const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);

  const [{ data: tasks }, { data: projects }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .gte("due_date", toISODate(tomorrow))
      .lte("due_date", toISODate(endOfNextMonth))
      .in("status", ["pendente", "em_progresso"])
      .order("due_date", { ascending: true }),
    supabase.from("projects").select("*"),
  ]);

  const all = (tasks ?? []) as Task[];
  const dateGroups = [
    { label: "Amanhã", tasks: all.filter((t) => t.due_date === toISODate(tomorrow)) },
    {
      label: "Esta semana",
      tasks: all.filter((t) => t.due_date! > toISODate(tomorrow) && t.due_date! <= toISODate(endOfWeek)),
    },
    {
      label: "Próxima semana",
      tasks: all.filter((t) => t.due_date! > toISODate(endOfWeek) && t.due_date! <= toISODate(endOfNextWeek)),
    },
    {
      label: "Próximo mês",
      tasks: all.filter((t) => t.due_date! > toISODate(endOfNextWeek) && t.due_date! <= toISODate(endOfNextMonth)),
    },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Próximas tarefas</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">O que vem a seguir, organizado por período.</p>
      </div>

      <ProximasView allTasks={all} dateGroups={dateGroups} projects={(projects ?? []) as Project[]} />
    </div>
  );
}
