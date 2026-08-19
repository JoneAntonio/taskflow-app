import type { Metadata } from "next";
import { Inbox as InboxIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { InlineQuickAdd } from "@/components/tasks/inline-quick-add";
import { TaskListItem } from "@/components/tasks/task-list-item";

export const metadata: Metadata = { title: "Inbox — JAFLOW" };

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
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Inbox</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Captura tudo rapidamente. Organiza mais tarde.
        </p>
      </div>

      <InlineQuickAdd placeholder="Preparar relatório mensal" />

      <div className="space-y-2">
        {!tasks || tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-16 text-center">
            <InboxIcon className="h-8 w-8 text-[var(--color-ink-muted)]" />
            <p className="text-sm font-medium text-[var(--color-ink)]">A tua Inbox está vazia</p>
            <p className="text-sm text-[var(--color-ink-muted)]">
              Escreve acima para adicionares a tua primeira tarefa.
            </p>
          </div>
        ) : (
          tasks.map((task) => <TaskListItem key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}
