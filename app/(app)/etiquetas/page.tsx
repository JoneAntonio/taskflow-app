import type { Metadata } from "next";
import { Tag as TagIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTodayISO } from "@/lib/server-date";
import { NewTagForm } from "@/components/tags/new-tag-form";
import { TagCard } from "@/components/tags/tag-card";
import type { Tag } from "@/types/database";

export const metadata: Metadata = { title: "Etiquetas — JAFLOW" };

export default async function EtiquetasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = await getTodayISO();

  const [{ data: tags }, { data: taskTags }] = await Promise.all([
    supabase.from("tags").select("*").order("name"),
    supabase
      .from("task_tags")
      .select("tag_id, tasks!inner(status, due_date)")
      .in("tasks.status", ["pendente", "em_progresso"]),
  ]);

  const totalCounts = new Map<string, number>();
  const overdueCounts = new Map<string, number>();
  (taskTags ?? []).forEach((row) => {
    totalCounts.set(row.tag_id, (totalCounts.get(row.tag_id) ?? 0) + 1);
    const task = row.tasks as unknown as { due_date: string | null };
    if (task?.due_date && task.due_date < today) {
      overdueCounts.set(row.tag_id, (overdueCounts.get(row.tag_id) ?? 0) + 1);
    }
  });

  const tagList = (tags ?? []) as Tag[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Etiquetas</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Cria etiquetas para classificar e filtrar as tuas tarefas. Uma etiqueta com tarefas atrasadas mostra um
          alerta ⚠️.
        </p>
      </div>

      <NewTagForm />

      {tagList.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-16 text-center">
          <TagIcon className="h-8 w-8 text-[var(--color-ink-muted)]" />
          <p className="text-sm font-medium text-[var(--color-ink)]">Ainda sem etiquetas</p>
          <p className="max-w-xs text-sm text-[var(--color-ink-muted)]">
            Cria a primeira etiqueta acima, ou usa <code>#etiqueta</code> ao criares uma tarefa.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tagList.map((tag) => (
            <TagCard
              key={tag.id}
              tag={tag}
              taskCount={totalCounts.get(tag.id) ?? 0}
              overdueCount={overdueCounts.get(tag.id) ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
