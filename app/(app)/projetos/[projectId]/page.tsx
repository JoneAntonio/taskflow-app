import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Folder } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TaskListItem } from "@/components/tasks/task-list-item";
import { InlineQuickAdd } from "@/components/tasks/inline-quick-add";
import { ProjectHeaderActions } from "@/components/projects/project-header-actions";
import type { Project, Task } from "@/types/database";

export const metadata: Metadata = { title: "Projeto — JAFLOW" };

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: project } = await supabase.from("projects").select("*").eq("id", projectId).single();
  if (!project) notFound();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("status")
    .order("created_at", { ascending: false });

  const projectData = project as Project;
  const taskList = (tasks ?? []) as Task[];
  const pending = taskList.filter((t) => t.status !== "concluida" && t.status !== "arquivada");
  const completed = taskList.filter((t) => t.status === "concluida");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/projetos"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
      >
        <ArrowLeft className="h-4 w-4" /> Projetos
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `color-mix(in srgb, ${projectData.color} 18%, transparent)` }}
          >
            <Folder className="h-5 w-5" style={{ color: projectData.color }} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">{projectData.name}</h1>
            {projectData.description && (
              <p className="mt-0.5 text-sm text-[var(--color-ink-muted)]">{projectData.description}</p>
            )}
          </div>
        </div>
        <ProjectHeaderActions project={projectData} />
      </div>

      <InlineQuickAdd placeholder="Adicionar tarefa a este projeto" projectId={projectId} />

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
          Pendentes ({pending.length})
        </p>
        <div className="space-y-2">
          {pending.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-6 text-center text-sm text-[var(--color-ink-muted)]">
              Sem tarefas pendentes neste projeto.
            </p>
          ) : (
            pending.map((task) => <TaskListItem key={task.id} task={task} />)
          )}
        </div>
      </div>

      {completed.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
            Concluídas ({completed.length})
          </p>
          <div className="space-y-2">
            {completed.map((task) => (
              <TaskListItem key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

