import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { toLocalISODate } from "@/lib/utils";
import { QuadrantCard } from "@/components/eisenhower/quadrant-card";
import type { Task } from "@/types/database";

export const metadata: Metadata = { title: "Matriz de Eisenhower — JAFLOW" };

/**
 * Urgência é derivada da prioridade e da data: consideramos urgente uma
 * tarefa com prioridade "alta"/"urgente", ou com data de vencimento hoje
 * ou já ultrapassada. Importância é uma marcação manual (is_important),
 * ativada/desativada com a estrela em cada tarefa.
 */
function isUrgent(task: Task): boolean {
  if (task.priority === "urgente" || task.priority === "alta") return true;
  if (task.due_date) {
    const today = toLocalISODate(new Date());
    if (task.due_date <= today) return true;
  }
  return false;
}

function sortWithCompletedLast(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const aDone = a.status === "concluida" ? 1 : 0;
    const bDone = b.status === "concluida" ? 1 : 0;
    return aDone - bDone;
  });
}

export default async function MatrizPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [{ data: activeTasks }, { data: recentlyCompleted }] = await Promise.all([
    supabase.from("tasks").select("*").in("status", ["pendente", "em_progresso"]).order("created_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("*")
      .eq("status", "concluida")
      .gte("completed_at", thirtyDaysAgo.toISOString())
      .order("completed_at", { ascending: false }),
  ]);

  const all = [...((activeTasks ?? []) as Task[]), ...((recentlyCompleted ?? []) as Task[])];

  const doQuadrant = sortWithCompletedLast(all.filter((t) => isUrgent(t) && t.is_important));
  const scheduleQuadrant = sortWithCompletedLast(all.filter((t) => !isUrgent(t) && t.is_important));
  const delegateQuadrant = sortWithCompletedLast(all.filter((t) => isUrgent(t) && !t.is_important));
  const eliminateQuadrant = sortWithCompletedLast(all.filter((t) => !isUrgent(t) && !t.is_important));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Matriz de Eisenhower</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          A urgência vem da prioridade e da data; marca a estrela ⭐ numa tarefa para a definires como importante.
          Tarefas concluídas ficam riscadas aqui durante 30 dias, com opção de eliminar em definitivo.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <QuadrantCard
          title="Fazer"
          subtitle="Urgente e importante"
          accentVar="--color-danger"
          tasks={doQuadrant}
          important
          urgent
        />
        <QuadrantCard
          title="Agendar"
          subtitle="Importante, não urgente"
          accentVar="--color-secondary"
          tasks={scheduleQuadrant}
          important
          urgent={false}
        />
        <QuadrantCard
          title="Delegar"
          subtitle="Urgente, não importante"
          accentVar="--color-warning"
          tasks={delegateQuadrant}
          important={false}
          urgent
        />
        <QuadrantCard
          title="Eliminar"
          subtitle="Nem urgente, nem importante"
          accentVar="--color-ink-muted"
          tasks={eliminateQuadrant}
          important={false}
          urgent={false}
        />
      </div>
    </div>
  );
}
