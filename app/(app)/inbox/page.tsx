import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { InlineQuickAdd } from "@/components/tasks/inline-quick-add";
import { TaskListWithModes } from "@/components/tasks/task-list-with-modes";
import type { Task } from "@/types/database";

export const metadata: Metadata = { title: "Inbox — I.D.I.O.T.A." };

export default async function InboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .is("project_id", null)
    .in("status", ["pendente", "em_progresso"])
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="font-display text-[26px] sm:text-[30px] font-semibold leading-tight text-[var(--color-ink)]">Inbox</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Captura tudo rapidamente. Organiza mais tarde.
        </p>
      </div>

      <InlineQuickAdd placeholder="Preparar relatório mensal" />

      <TaskListWithModes
        tasks={(tasks ?? []) as Task[]}
        emptyMessage="A tua Inbox está vazia. Escreve acima para adicionares a tua primeira tarefa."
      />
    </div>
  );
}
