"use client";

import { useMemo, useState } from "react";
import { FolderKanban } from "lucide-react";
import { QuadrantCard } from "@/components/eisenhower/quadrant-card";
import type { Task, Project } from "@/types/database";

export function MatrixProjectFilter({
  doQuadrant,
  scheduleQuadrant,
  delegateQuadrant,
  eliminateQuadrant,
  projects,
}: {
  doQuadrant: Task[];
  scheduleQuadrant: Task[];
  delegateQuadrant: Task[];
  eliminateQuadrant: Task[];
  projects: Project[];
}) {
  const [projectId, setProjectId] = useState<string>("");

  const filter = (tasks: Task[]) => (projectId ? tasks.filter((t) => t.project_id === projectId) : tasks);

  const filtered = useMemo(
    () => ({
      doQuadrant: filter(doQuadrant),
      scheduleQuadrant: filter(scheduleQuadrant),
      delegateQuadrant: filter(delegateQuadrant),
      eliminateQuadrant: filter(eliminateQuadrant),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projectId, doQuadrant, scheduleQuadrant, delegateQuadrant, eliminateQuadrant]
  );

  return (
    <div className="space-y-4">
      {projects.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
          <FolderKanban className="h-4 w-4 shrink-0 text-[var(--color-ink-muted)]" />
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full max-w-xs bg-transparent text-sm text-[var(--color-ink)] outline-none"
          >
            <option value="">Todos os projetos</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {projectId && (
            <span className="text-xs text-[var(--color-ink-muted)]">Novas tarefas ficam ligadas a este projeto</span>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <QuadrantCard
          title="Fazer"
          subtitle="Urgente e importante"
          accentVar="--color-danger"
          tasks={filtered.doQuadrant}
          important
          urgent
          projectId={projectId || null}
        />
        <QuadrantCard
          title="Agendar"
          subtitle="Importante, não urgente"
          accentVar="--color-secondary"
          tasks={filtered.scheduleQuadrant}
          important
          urgent={false}
          projectId={projectId || null}
        />
        <QuadrantCard
          title="Delegar"
          subtitle="Urgente, não importante"
          accentVar="--color-warning"
          tasks={filtered.delegateQuadrant}
          important={false}
          urgent
          projectId={projectId || null}
        />
        <QuadrantCard
          title="Eliminar"
          subtitle="Nem urgente, nem importante"
          accentVar="--color-ink-muted"
          tasks={filtered.eliminateQuadrant}
          important={false}
          urgent={false}
          projectId={projectId || null}
        />
      </div>
    </div>
  );
}
