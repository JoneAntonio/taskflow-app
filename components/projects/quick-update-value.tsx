"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { projectsService } from "@/services/projects.service";
import type { Project } from "@/types/database";

export function QuickUpdateValue({ project }: { project: Project }) {
  const [value, setValue] = useState(project.actual_value?.toString() ?? project.current_value?.toString() ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  if (project.current_value == null || project.target_value == null) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!value.trim()) return;
    setIsSubmitting(true);
    try {
      await projectsService.updateProject(project.id, { actual_value: Number(value) });
      toast.success("Valor atual atualizado");
      router.refresh();
    } catch {
      toast.error("Não foi possível atualizar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
    >
      <TrendingUp className="h-4 w-4 shrink-0 text-[var(--color-accent)]" />
      <span className="shrink-0 text-xs text-[var(--color-ink-muted)]">Atualizar valor atual</span>
      <Input type="number" step="any" value={value} onChange={(e) => setValue(e.target.value)} className="h-8 flex-1" />
      {project.metric_unit && (
        <span className="shrink-0 text-xs text-[var(--color-ink-muted)]">{project.metric_unit}</span>
      )}
      <Button type="submit" size="sm" isLoading={isSubmitting}>
        Guardar
      </Button>
    </form>
  );
}
