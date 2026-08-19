import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
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
    const today = new Date().toISOString().slice(0, 10);
    if (task.due_date <= today) return true;
  }
  return false;
}

export default async function MatrizPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .in("status", ["pendente", "em_progresso"])
    .order("created_at", { ascending: false });

  const all = (tasks ?? []) as Task[];

  const doQuadrant = all.filter((t) => isUrgent(t) && t.is_important);
  const scheduleQuadrant = all.filter((t) => !isUrgent(t) && t.is_important);
  const delegateQuadrant = all.filter((t) => isUrgent(t) && !t.is_important);
  const eliminateQuadrant = all.filter((t) => !isUrgent(t) && !t.is_important);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Matriz de Eisenhower</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          A urgência vem da prioridade e da data; marca a estrela ⭐ numa tarefa para a definires como importante.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <QuadrantCard
          title="Fazer"
          subtitle="Urgente e importante"
          accentVar="--color-danger"
          tasks={doQuadrant}
        />
        <QuadrantCard
          title="Agendar"
          subtitle="Importante, não urgente"
          accentVar="--color-secondary"
          tasks={scheduleQuadrant}
        />
        <QuadrantCard
          title="Delegar"
          subtitle="Urgente, não importante"
          accentVar="--color-warning"
          tasks={delegateQuadrant}
        />
        <QuadrantCard
          title="Eliminar"
          subtitle="Nem urgente, nem importante"
          accentVar="--color-ink-muted"
          tasks={eliminateQuadrant}
        />
      </div>
    </div>
  );
}
