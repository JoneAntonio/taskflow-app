import Link from "next/link";
import { Target } from "lucide-react";
import { getProjectHealth, HEALTH_LABELS, HEALTH_COLOR_VAR } from "@/lib/project-health";
import type { Project } from "@/types/database";

export function ActiveProjectsWidget({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
        <Target className="h-3.5 w-3.5" /> Objetivos SMART em curso
      </p>
      <div className="space-y-3">
        {projects.map((project) => {
          const { health, progress } = getProjectHealth(project);
          const colorVar = HEALTH_COLOR_VAR[health];
          return (
            <Link key={project.id} href={`/projetos/${project.id}`} className="block">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-[var(--color-ink)]">{project.name}</span>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{
                    color: `var(${colorVar})`,
                    backgroundColor: `color-mix(in srgb, var(${colorVar}) 15%, transparent)`,
                  }}
                >
                  {HEALTH_LABELS[health]}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-alt)]">
                <div
                  className="h-full rounded-full transition-[width]"
                  style={{ width: `${progress ?? 0}%`, backgroundColor: `var(${colorVar})` }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
