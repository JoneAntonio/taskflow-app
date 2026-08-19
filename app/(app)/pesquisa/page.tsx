import type { Metadata } from "next";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TaskListItem } from "@/components/tasks/task-list-item";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Folder, Tag as TagIcon } from "lucide-react";
import type { Task, Project, Tag } from "@/types/database";

export const metadata: Metadata = { title: "Pesquisa — JAFLOW" };

export default async function PesquisaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let tasks: Task[] = [];
  let projects: Project[] = [];
  let tags: Tag[] = [];

  if (query) {
    const [taskRes, projectRes, tagRes] = await Promise.all([
      supabase.from("tasks").select("*").ilike("title", `%${query}%`).limit(20),
      supabase.from("projects").select("*").ilike("name", `%${query}%`).limit(10),
      supabase.from("tags").select("*").ilike("name", `%${query}%`).limit(10),
    ]);
    tasks = (taskRes.data ?? []) as Task[];
    projects = (projectRes.data ?? []) as Project[];
    tags = (tagRes.data ?? []) as Tag[];
  }

  const hasResults = tasks.length > 0 || projects.length > 0 || tags.length > 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Pesquisa</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          {query ? `Resultados para "${query}"` : "Usa a barra de pesquisa no topo para procurar."}
        </p>
      </div>

      {query && !hasResults && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-16 text-center">
          <Search className="h-8 w-8 text-[var(--color-ink-muted)]" />
          <p className="text-sm text-[var(--color-ink-muted)]">Sem resultados para &quot;{query}&quot;.</p>
        </div>
      )}

      {projects.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">Projetos</p>
          <div className="space-y-2">
            {projects.map((p) => (
              <Link key={p.id} href={`/projetos/${p.id}`}>
                <Card className="flex items-center gap-2 p-3 hover:border-[var(--color-accent)]/60">
                  <Folder className="h-4 w-4" style={{ color: p.color }} />
                  <span className="text-sm text-[var(--color-ink)]">{p.name}</span>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {tags.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">Etiquetas</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm"
                style={{ backgroundColor: `color-mix(in srgb, ${t.color} 16%, transparent)`, color: t.color }}
              >
                <TagIcon className="h-3 w-3" /> #{t.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {tasks.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">Tarefas</p>
          <div className="space-y-2">
            {tasks.map((t) => (
              <TaskListItem key={t.id} task={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
