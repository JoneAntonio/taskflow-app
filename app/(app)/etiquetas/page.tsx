import type { Metadata } from "next";
import { Tag as TagIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NewTagForm } from "@/components/tags/new-tag-form";
import { TagChip } from "@/components/tags/tag-chip";
import type { Tag } from "@/types/database";

export const metadata: Metadata = { title: "Etiquetas — JAFLOW" };

export default async function EtiquetasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: tags }, { data: taskTags }] = await Promise.all([
    supabase.from("tags").select("*").order("name"),
    supabase.from("task_tags").select("tag_id"),
  ]);

  const counts = new Map<string, number>();
  (taskTags ?? []).forEach((row) => counts.set(row.tag_id, (counts.get(row.tag_id) ?? 0) + 1));

  const tagList = (tags ?? []) as Tag[];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Etiquetas</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          Cria etiquetas para classificar e filtrar as tuas tarefas.
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
        <div className="flex flex-wrap gap-2">
          {tagList.map((tag) => (
            <TagChip key={tag.id} tag={tag} taskCount={counts.get(tag.id) ?? 0} />
          ))}
        </div>
      )}
    </div>
  );
}
