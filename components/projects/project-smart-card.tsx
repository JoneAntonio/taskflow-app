import { Target, Calendar } from "lucide-react";
import type { Project } from "@/types/database";

export function ProjectSmartCard({ project }: { project: Project }) {
  if (!project.objective && !project.success_metric && !project.target_date) return null;

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
        Objetivo SMART
      </p>
      {project.objective && (
        <p className="mb-3 text-sm font-medium text-[var(--color-ink)]">{project.objective}</p>
      )}
      <div className="grid grid-cols-2 gap-3">
        {project.success_metric && (
          <div className="rounded-xl bg-[var(--color-surface-alt)] p-3">
            <p className="mb-1 flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
              <Target className="h-3.5 w-3.5" /> Métrica de sucesso
            </p>
            <p className="text-sm text-[var(--color-ink)]">{project.success_metric}</p>
          </div>
        )}
        {project.target_date && (
          <div className="rounded-xl bg-[var(--color-surface-alt)] p-3">
            <p className="mb-1 flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
              <Calendar className="h-3.5 w-3.5" /> Prazo
            </p>
            <p className="text-sm text-[var(--color-ink)]">
              {new Date(project.target_date + "T00:00:00").toLocaleDateString("pt-PT", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
