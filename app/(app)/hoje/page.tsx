import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { InlineQuickAdd } from "@/components/tasks/inline-quick-add";
import { TaskListItem } from "@/components/tasks/task-list-item";
import type { Task } from "@/types/database";

export const metadata: Metadata = { title: "Hoje — JAFLOW" };

function groupByPeriod(tasks: Task[]) {
  const groups = { manha: [] as Task[], tarde: [] as Task[], noite: [] as Task[], semHora: [] as Task[] };

  for (const task of tasks) {
    if (!task.due_time) {
      groups.semHora.push(task);
      continue;
    }
    const hour = Number(task.due_time.slice(0, 2));
    if (hour < 12) groups.manha.push(task);
    else if (hour < 18) groups.tarde.push(task);
    else groups.noite.push(task);
  }

  return groups;
}

export default async function HojePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date().toISOString().slice(0, 10);

  const [{ data: todayTasks }, { data: overdueTasks }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("due_date", today)
      .in("status", ["pendente", "em_progresso"])
      .order("due_time", { ascending: true, nullsFirst: false }),
    supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .lt("due_date", today)
      .in("status", ["pendente", "em_progresso"])
      .order("due_date", { ascending: true }),
  ]);

  const groups = groupByPeriod(todayTasks ?? []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Hoje</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          {new Date().toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      <InlineQuickAdd placeholder="Adicionar tarefa para hoje" />

      {overdueTasks && overdueTasks.length > 0 && (
        <TaskGroup title="Atrasadas" tasks={overdueTasks} tone="danger" />
      )}
      <TaskGroup title="Sem hora definida" tasks={groups.semHora} />
      <TaskGroup title="Manhã" tasks={groups.manha} />
      <TaskGroup title="Tarde" tasks={groups.tarde} />
      <TaskGroup title="Noite" tasks={groups.noite} />

      {(!todayTasks || todayTasks.length === 0) && (!overdueTasks || overdueTasks.length === 0) && (
        <p className="rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-16 text-center text-sm text-[var(--color-ink-muted)]">
          Sem tarefas para hoje. Bom trabalho — ou boa oportunidade para planear amanhã.
        </p>
      )}
    </div>
  );
}

function TaskGroup({
  title,
  tasks,
  tone,
}: {
  title: string;
  tasks: Task[];
  tone?: "danger";
}) {
  if (tasks.length === 0) return null;
  return (
    <div>
      <p
        className="mb-2 text-xs font-semibold uppercase tracking-wider"
        style={{ color: tone === "danger" ? "var(--color-danger)" : "var(--color-ink-muted)" }}
      >
        {title}
      </p>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskListItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
