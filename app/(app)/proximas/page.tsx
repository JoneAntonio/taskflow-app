import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { toLocalISODate } from "@/lib/utils";
import { TaskListItem } from "@/components/tasks/task-list-item";
import type { Task } from "@/types/database";

export const metadata: Metadata = { title: "Próximas — JAFLOW" };

function toISODate(date: Date) {
  return toLocalISODate(date);
}

export default async function ProximasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + (7 - today.getDay()));
  const endOfNextWeek = new Date(endOfWeek);
  endOfNextWeek.setDate(endOfNextWeek.getDate() + 7);
  const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .gte("due_date", toISODate(tomorrow))
    .lte("due_date", toISODate(endOfNextMonth))
    .in("status", ["pendente", "em_progresso"])
    .order("due_date", { ascending: true });

  const all = (tasks ?? []) as Task[];
  const groups: { label: string; tasks: Task[] }[] = [
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

      {all.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-16 text-center text-sm text-[var(--color-ink-muted)]">
          Sem tarefas agendadas nos próximos tempos.
        </p>
      ) : (
        groups.map(
          (group) =>
            group.tasks.length > 0 && (
              <div key={group.label}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
                  {group.label}
                </p>
                <div className="space-y-2">
                  {group.tasks.map((task) => (
                    <TaskListItem key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )
        )
      )}
    </div>
  );
}
