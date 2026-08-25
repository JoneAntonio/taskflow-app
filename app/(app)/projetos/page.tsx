import type { Metadata } from "next";
import { FolderKanban } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireSupervisor } from "@/lib/require-supervisor";
import { ProjectCard } from "@/components/projects/project-card";
import { NewProjectButton } from "@/components/projects/new-project-button";
import type { Project, Team } from "@/types/database";

export const metadata: Metadata = { title: "Método SMART — JAFLOW" };

export default async function ProjetosPage() {
  await requireSupervisor();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: projects }, { data: tasks }, { data: adminMemberships }, { data: allMyTeams }] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("tasks").select("id, project_id, status"),
    supabase.from("team_memberships").select("team:teams(*)").eq("user_id", user.id).eq("role", "admin"),
    supabase.from("teams").select("id, name"),
  ]);

  const teamNameById = new Map((allMyTeams ?? []).map((t) => [t.id, t.name]));

  const adminTeams = (adminMemberships ?? [])
    .map((m) => (m as unknown as { team: Team | null }).team)
    .filter((t): t is Team => !!t);

  const projectList = (projects ?? []) as Project[];
  const taskCounts = new Map<string, { total: number; completed: number }>();
  (tasks ?? []).forEach((task) => {
    if (!task.project_id) return;
    const entry = taskCounts.get(task.project_id) ?? { total: 0, completed: 0 };
    entry.total += 1;
    if (task.status === "concluida") entry.completed += 1;
    taskCounts.set(task.project_id, entry);
  });

  const topLevel = projectList.filter((p) => !p.parent_id);
  const childrenByParent = new Map<string, Project[]>();
  projectList
    .filter((p) => p.parent_id)
    .forEach((p) => {
      const list = childrenByParent.get(p.parent_id!) ?? [];
      list.push(p);
      childrenByParent.set(p.parent_id!, list);
    });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">Método SMART</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Cada projeto é um objetivo SMART: define-o, acompanha o progresso, e organiza as tuas tarefas lá dentro.
            Cria subprojetos para agrupares dentro de um objetivo maior.
          </p>
        </div>
        <NewProjectButton availableParents={topLevel} availableTeams={adminTeams} />
      </div>

      {projectList.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-16 text-center">
          <FolderKanban className="h-8 w-8 text-[var(--color-ink-muted)]" />
          <p className="text-sm font-medium text-[var(--color-ink)]">Ainda sem projetos</p>
          <p className="max-w-xs text-sm text-[var(--color-ink-muted)]">
            Cria o teu primeiro projeto para começares a organizar as tuas tarefas.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {topLevel.map((project) => {
            const counts = taskCounts.get(project.id) ?? { total: 0, completed: 0 };
            const children = childrenByParent.get(project.id) ?? [];
            return (
              <div key={project.id}>
                <ProjectCard
                  project={project}
                  totalTasks={counts.total}
                  completedTasks={counts.completed}
                  teamName={project.team_id ? teamNameById.get(project.team_id) : null}
                />
                {children.length > 0 && (
                  <div className="ml-6 mt-3 space-y-3 border-l-2 border-[var(--color-border)] pl-4">
                    {children.map((child) => {
                      const childCounts = taskCounts.get(child.id) ?? { total: 0, completed: 0 };
                      return (
                        <ProjectCard
                          key={child.id}
                          project={child}
                          totalTasks={childCounts.total}
                          completedTasks={childCounts.completed}
                          teamName={child.team_id ? teamNameById.get(child.team_id) : null}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
