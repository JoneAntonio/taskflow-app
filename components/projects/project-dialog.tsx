"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { projectsService, PROJECT_COLORS } from "@/services/projects.service";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/database";

export function ProjectDialog({
  open,
  onClose,
  project,
  availableParents = [],
}: {
  open: boolean;
  onClose: () => void;
  project?: Project;
  /** Projetos de topo que podem servir de "projeto principal" (exclui o próprio, se estiveres a editar). */
  availableParents?: Project[];
}) {
  const router = useRouter();
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [color, setColor] = useState(project?.color ?? PROJECT_COLORS[0]);
  const [parentId, setParentId] = useState<string>(project?.parent_id ?? "");
  const [objective, setObjective] = useState(project?.objective ?? "");
  const [successMetric, setSuccessMetric] = useState(project?.success_metric ?? "");
  const [targetDate, setTargetDate] = useState(project?.target_date ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parentOptions = availableParents.filter((p) => p.id !== project?.id);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      const smartFields = {
        objective: objective.trim() || null,
        successMetric: successMetric.trim() || null,
        targetDate: targetDate || null,
      };
      if (project) {
        await projectsService.updateProject(project.id, {
          name: name.trim(),
          description: description || null,
          color,
          parentId: parentId || null,
          objective: smartFields.objective,
          success_metric: smartFields.successMetric,
          target_date: smartFields.targetDate,
        });
        toast.success("Projeto atualizado");
      } else {
        await projectsService.createProject({
          name: name.trim(),
          description: description || undefined,
          color,
          parentId: parentId || null,
          ...smartFields,
        });
        toast.success("Projeto criado");
      }
      onClose();
      router.refresh();
    } catch {
      toast.error("Não foi possível guardar o projeto.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={project ? "Editar projeto" : "Novo projeto"} className="max-w-lg">
      <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        <div>
          <Label htmlFor="project-name">Nome</Label>
          <Input id="project-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Trabalho" />
        </div>
        <div>
          <Label htmlFor="project-description">Descrição (opcional)</Label>
          <Input id="project-description" value={description ?? ""} onChange={(e) => setDescription(e.target.value)} />
        </div>
        {parentOptions.length > 0 && (
          <div>
            <Label htmlFor="project-parent">Projeto principal (opcional)</Label>
            <select
              id="project-parent"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)]"
            >
              <option value="">Nenhum (projeto de topo)</option>
              {parentOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <Label>Cor</Label>
          <div className="flex flex-wrap gap-2">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  "h-8 w-8 rounded-full border-2 transition-transform",
                  color === c ? "scale-110 border-[var(--color-ink)]" : "border-transparent"
                )}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3.5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
            Objetivo SMART (opcional)
          </p>
          <div className="space-y-3">
            <div>
              <Label htmlFor="project-objective">Objetivo (o quê e porquê)</Label>
              <Input
                id="project-objective"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Ex: Reduzir o TMA da equipa SIMAR"
              />
            </div>
            <div>
              <Label htmlFor="project-metric">Métrica de sucesso</Label>
              <Input
                id="project-metric"
                value={successMetric}
                onChange={(e) => setSuccessMetric(e.target.value)}
                placeholder="Ex: TMA médio ≤ 4 min"
              />
            </div>
            <div>
              <Label htmlFor="project-target-date">Prazo do projeto</Label>
              <Input
                id="project-target-date"
                type="date"
                value={targetDate ?? ""}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {project ? "Guardar" : "Criar projeto"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
