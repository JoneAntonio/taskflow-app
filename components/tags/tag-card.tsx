"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Hash, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { tagsService } from "@/services/tags.service";
import type { Tag } from "@/types/database";

export function TagCard({ tag, taskCount, overdueCount }: { tag: Tag; taskCount: number; overdueCount: number }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Eliminar a etiqueta "#${tag.name}"?`)) return;
    setIsDeleting(true);
    try {
      await tagsService.deleteTag(tag.id);
      toast.success("Etiqueta eliminada");
      router.refresh();
    } catch {
      toast.error("Não foi possível eliminar.");
      setIsDeleting(false);
    }
  }

  return (
    <Card className="relative p-4">
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        aria-label="Eliminar etiqueta"
        className="absolute right-3 top-3 rounded-md p-1 text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-danger)]"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-center gap-2.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `color-mix(in srgb, ${tag.color} 18%, transparent)` }}
        >
          <Hash className="h-4 w-4" style={{ color: tag.color }} />
        </span>
        <p className="truncate pr-6 text-sm font-medium text-[var(--color-ink)]">{tag.name}</p>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="rounded-full bg-[var(--color-surface-alt)] px-2.5 py-1 text-xs font-medium text-[var(--color-ink-muted)]">
          {taskCount} {taskCount === 1 ? "tarefa" : "tarefas"}
        </span>
        {overdueCount > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-[var(--color-danger)]/15 px-2.5 py-1 text-xs font-medium text-[var(--color-danger)]">
            <AlertTriangle className="h-3 w-3" />
            {overdueCount} atrasada{overdueCount > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </Card>
  );
}
