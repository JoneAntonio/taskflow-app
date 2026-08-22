import Link from "next/link";
import { Folder, Users2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Project } from "@/types/database";

export function ProjectCard({
  project,
  totalTasks,
  completedTasks,
  teamName,
}: {
  project: Project;
  totalTasks: number;
  completedTasks: number;
  teamName?: string | null;
}) {
  const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <Link href={`/projetos/${project.id}`}>
      <Card className="p-4 transition-colors hover:border-[var(--color-accent)]/60">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `color-mix(in srgb, ${project.color} 18%, transparent)` }}
          >
            <Folder className="h-5 w-5" style={{ color: project.color }} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-[var(--color-ink)]">{project.name}</p>
              {teamName && (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--color-secondary)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--color-secondary)]">
                  <Users2 className="h-2.5 w-2.5" /> {teamName}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--color-ink-muted)]">
              {completedTasks} de {totalTasks} tarefas concluídas
            </p>
          </div>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-alt)]">
          <div
            className="h-full rounded-full transition-[width]"
            style={{ width: `${percentage}%`, backgroundColor: project.color }}
          />
        </div>
      </Card>
    </Link>
  );
}
